import { supabase } from '../lib/supabase';
import { safeGet } from '../utils/safeLocal';
import type { MCPServer } from '../types';

export class MCPServerService {
  /**
   * Fetch **all** active MCP servers and run basic sanity checks:
   *   1. Warn about servers that are missing the required `apiurl` column.
   *   2. Detect duplicate rows (based on <id> or <apiurl>) and keep only the first occurrence.
   *   3. Seamlessly fall back to an environment variable (e.g. `VITE_OPENAI_MCP_URL`) when
   *      the `apiurl` column is missing – this allows zero-DB configuration while developing.
   *
   * These guards dramatically improve DX – instead of a silent `undefined` that propagates
   * up to the UI we now fail fast *with context* so users know exactly what to fix in their
   * Supabase table or environment.
   */
  static async getAllServers(): Promise<MCPServer[]> {
    const { data, error } = await supabase
      .from('mcp_servers')
      .select('*')
      .eq('status', 'active')
      .order('downloads', { ascending: false });

    if (error) {
      console.error('[MCP] Supabase error while fetching servers:', error);
      throw new Error('Could not fetch MCP servers – please check your network connection and Supabase credentials.');
    }

    if (!data || data.length === 0) {
      throw new Error('No active MCP servers found. Make sure the `mcp_servers` table is populated and the `status` column is set to "active".');
    }

    const { servers, warnings } = this.validateAndNormalizeServers(data);

    // Emit warnings once – useful in development, harmless in production logs
    warnings.forEach(w => console.warn('[MCP] ' + w));

    return servers;
  }

  static async getServerById(id: string): Promise<MCPServer | null> {
    const { data, error } = await supabase
      .from('mcp_servers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`[MCP] Supabase error while retrieving server '${id}':`, error);
    }

    // If we did not find a row OR it is missing an apiurl we try the env-var fallback
    if (!data || !data.apiurl) {
      const envKey = `VITE_${id.toUpperCase()}_MCP_URL`;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore – import.meta exists in Vite runtime
      const fallbackUrl = import.meta.env[envKey] as string | undefined;
      if (fallbackUrl) {
        console.info(`[MCP] Using environment fallback (${envKey}) for server '${id}'.`);
        return {
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          description: '',
          category: 'custom',
          version: '0.0.0',
          author: 'env',
          authType: 'none',
          capabilities: [],
          pricing: 'free',
          downloads: 0,
          rating: 0,
          reviewCount: 0,
          lastUpdated: new Date().toISOString(),
          status: 'active',
          tags: [],
          iconUrl: '',
          apiUrl: fallbackUrl,
        } as MCPServer;
      }

      // Provide actionable error hint
      const reason = !data ? 'not found in database' : 'missing required apiurl column';
      console.error(`[MCP] Server '${id}' ${reason}.`);
      return null;
    }

    const { servers } = this.validateAndNormalizeServers([data]);
    return servers[0] || null;
  }

  static async searchServers(query: string, category?: string, pricing?: string): Promise<MCPServer[]> {
    let queryBuilder = supabase
      .from('mcp_servers')
      .select('*')
      .eq('status', 'active');

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);
    }

    if (category && category !== 'all') {
      queryBuilder = queryBuilder.eq('category', category);
    }

    if (pricing && pricing !== 'all') {
      queryBuilder = queryBuilder.eq('pricing', pricing);
    }

    const { data, error } = await queryBuilder.order('downloads', { ascending: false });

    if (error) {
      console.error('Error searching servers:', error);
      throw new Error('Failed to search MCP servers');
    }

    return data.map(this.transformServerData);
  }

  static async incrementDownloads(serverId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_server_downloads', {
      server_id: serverId
    });

    if (error) {
      console.error('Error incrementing downloads:', error);
      throw new Error('Failed to update download count');
    }
  }

  /**
   * Validate raw rows coming from Supabase, normalize them with correct typing
   * and collect warnings (duplicates / missing apiUrl).
   */
  private static validateAndNormalizeServers(rows: any[]): {
    servers: MCPServer[];
    warnings: string[];
  } {
    const warnings: string[] = [];
    const byId = new Map<string, any>();
    const byApi = new Map<string, any>();

    for (const row of rows) {
      if (!row.id) {
        warnings.push('Found MCP server row without an `id` – skipping.');
        continue;
      }

      // Duplicate `id` check (even if theoretically unique in DB, a developer might have bypassed constraint)
      if (byId.has(row.id)) {
        warnings.push(`Duplicate MCP server id '${row.id}' detected – ignoring subsequent entries.`);
        continue;
      }

      // Missing apiurl – we treat this as warning (not error) because the env-var fallback might rescue it
      if (!row.apiurl) {
        warnings.push(`Server '${row.id}' is missing the required 'apiurl' column – UI will fall back to env var if provided.`);
      }

      byId.set(row.id, row);

      if (row.apiurl) {
        if (byApi.has(row.apiurl)) {
          const existing = byApi.get(row.apiurl);
          warnings.push(`Servers '${existing.id}' and '${row.id}' share the same apiurl (${row.apiurl}). This is likely a configuration mistake.`);
        } else {
          byApi.set(row.apiurl, row);
        }
      }
    }

    // Convert to MCPServer objects after validation
    const servers: MCPServer[] = Array.from(byId.values()).map(this.transformServerData);

    return { servers, warnings };
  }

  private static transformServerData(data: any): MCPServer {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      version: data.version,
      author: data.author,
      authType: data.auth_type,
      capabilities: data.capabilities,
      pricing: data.pricing,
      downloads: data.downloads,
      rating: data.rating,
      reviewCount: data.review_count,
      lastUpdated: data.last_updated,
      status: data.status,
      tags: data.tags,
      iconUrl: data.icon_url,
      // Source priority: localStorage override > explicit column > env fallback (handled earlier)
      apiUrl: (() => {
        try {
          // Allow users to override a single server API endpoint via localStorage (UI settings panel)
          const override = typeof window !== 'undefined' ? safeGet(`mcp_${data.id}_api_url`, '') || null : null;
          if (override) return override;
        } catch {
          /* no-op: access to localStorage might fail in some environments */
        }
        // The column could be either `apiurl` (legacy) or `api_url` (snake_case)
        return data.apiurl || data.api_url || undefined;
      })()
    };
  }
}
import { supabase } from '../lib/supabase';
import type { MCPServer } from '../types';

export class MCPServerService {
  static async getAllServers(): Promise<MCPServer[]> {
    const { data, error } = await supabase
      .from('mcp_servers')
      .select('*')
      .eq('status', 'active')
      .order('downloads', { ascending: false });

    if (error) {
      console.error('Error fetching servers:', error);
      throw new Error('Failed to fetch MCP servers');
    }

    return data.map(this.transformServerData);
  }

  static async getServerById(id: string): Promise<MCPServer | null> {
    const { data, error } = await supabase
      .from('mcp_servers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching server:', error);
      return null;
    }

    return this.transformServerData(data);
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
      apiUrl: data.apiurl
    };
  }
}
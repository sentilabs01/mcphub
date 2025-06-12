export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: 'free' | 'pro' | 'enterprise';
          member_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: 'free' | 'pro' | 'enterprise';
          member_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan?: 'free' | 'pro' | 'enterprise';
          member_count?: number;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          organization_id: string | null;
          google_refresh_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          organization_id?: string | null;
          google_refresh_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          organization_id?: string | null;
          google_refresh_token?: string | null;
          updated_at?: string;
        };
      };
      mcp_servers: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: string;
          version: string;
          author: string;
          auth_type: 'none' | 'api-key' | 'oauth';
          capabilities: string[];
          pricing: 'free' | 'premium' | 'enterprise';
          downloads: number;
          rating: number;
          review_count: number;
          last_updated: string;
          status: 'active' | 'maintenance' | 'deprecated';
          tags: string[];
          icon_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          category: string;
          version: string;
          author: string;
          auth_type: 'none' | 'api-key' | 'oauth';
          capabilities: string[];
          pricing?: 'free' | 'premium' | 'enterprise';
          downloads?: number;
          rating?: number;
          review_count?: number;
          last_updated: string;
          status?: 'active' | 'maintenance' | 'deprecated';
          tags?: string[];
          icon_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          category?: string;
          version?: string;
          author?: string;
          auth_type?: 'none' | 'api-key' | 'oauth';
          capabilities?: string[];
          pricing?: 'free' | 'premium' | 'enterprise';
          downloads?: number;
          rating?: number;
          review_count?: number;
          last_updated?: string;
          status?: 'active' | 'maintenance' | 'deprecated';
          tags?: string[];
          icon_url?: string | null;
          updated_at?: string;
        };
      };
      user_server_installations: {
        Row: {
          id: string;
          user_id: string;
          server_id: string;
          status: 'running' | 'stopped' | 'error' | 'installing';
          configuration: Record<string, any>;
          installed_at: string;
          last_active: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          server_id: string;
          status?: 'running' | 'stopped' | 'error' | 'installing';
          configuration?: Record<string, any>;
          installed_at?: string;
          last_active?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'running' | 'stopped' | 'error' | 'installing';
          configuration?: Record<string, any>;
          last_active?: string;
          updated_at?: string;
        };
      };
      server_usage_metrics: {
        Row: {
          id: string;
          installation_id: string;
          requests: number;
          uptime: number;
          error_rate: number;
          response_time: number;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          installation_id: string;
          requests: number;
          uptime: number;
          error_rate: number;
          response_time: number;
          recorded_at?: string;
          created_at?: string;
        };
        Update: {
          requests?: number;
          uptime?: number;
          error_rate?: number;
          response_time?: number;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_hash: string;
          permissions: string[];
          last_used: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_hash: string;
          permissions?: string[];
          last_used?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          permissions?: string[];
          last_used?: string | null;
          expires_at?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
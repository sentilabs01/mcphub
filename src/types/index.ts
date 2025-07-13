export interface MCPServer {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  authType: 'none' | 'api-key' | 'oauth';
  capabilities: string[];
  pricing: 'free' | 'premium' | 'enterprise';
  downloads: number;
  rating: number;
  reviewCount: number;
  lastUpdated: string;
  status: 'active' | 'maintenance' | 'deprecated';
  tags: string[];
  iconUrl?: string;
  apiUrl?: string;
}

export interface Installation {
  id: string;
  serverId: string;
  serverName: string;
  status: 'running' | 'stopped' | 'error' | 'installing';
  installedAt: string;
  lastActive: string;
  usageMetrics: {
    requests: number;
    uptime: number;
    errorRate: number;
  };
  configuration: Record<string, any>;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  memberCount: number;
  createdAt: string;
}

export interface APIEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  examples: Array<{
    name: string;
    request: any;
    response: any;
  }>;
}

export interface AnalyticsData {
  totalRequests: number;
  activeServers: number;
  errorRate: number;
  avgResponseTime: number;
  requestsOverTime: Array<{ time: string; requests: number }>;
  topServers: Array<{ name: string; requests: number }>;
}
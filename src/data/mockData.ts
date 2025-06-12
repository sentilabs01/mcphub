import { MCPServer, Installation, Organization, APIEndpoint, AnalyticsData } from '../types';

export const mockServers: MCPServer[] = [
  {
    id: '1',
    name: 'GitHub Integration',
    description: 'Connect to GitHub repositories, manage issues, pull requests, and access repository data.',
    category: 'Development',
    version: '2.1.0',
    author: 'GitHub Inc.',
    authType: 'oauth',
    capabilities: ['repositories', 'issues', 'pull-requests', 'webhooks'],
    pricing: 'free',
    downloads: 15420,
    rating: 4.8,
    reviewCount: 324,
    lastUpdated: '2025-05-15',
    status: 'active',
    tags: ['git', 'version-control', 'collaboration']
  },
  {
    id: '2',
    name: 'Slack Bot Framework',
    description: 'Build powerful Slack bots with advanced message handling and interactive components.',
    category: 'Communication',
    version: '1.8.2',
    author: 'Slack Technologies',
    authType: 'api-key',
    capabilities: ['messaging', 'interactive-components', 'events', 'slash-commands'],
    pricing: 'premium',
    downloads: 8932,
    rating: 4.6,
    reviewCount: 156,
    lastUpdated: '2025-05-12',
    status: 'active',
    tags: ['slack', 'chatbot', 'automation']
  },
  {
    id: '3',
    name: 'Database Analytics',
    description: 'Advanced analytics and monitoring for PostgreSQL, MySQL, and MongoDB databases.',
    category: 'Analytics',
    version: '3.0.1',
    author: 'DataCore Labs',
    authType: 'api-key',
    capabilities: ['query-analysis', 'performance-monitoring', 'alerts', 'reporting'],
    pricing: 'enterprise',
    downloads: 5643,
    rating: 4.9,
    reviewCount: 89,
    lastUpdated: '2025-05-10',
    status: 'active',
    tags: ['database', 'monitoring', 'performance']
  },
  {
    id: '4',
    name: 'Weather Data API',
    description: 'Real-time weather data, forecasts, and historical weather information.',
    category: 'Data',
    version: '1.4.0',
    author: 'WeatherTech',
    authType: 'api-key',
    capabilities: ['current-weather', 'forecasts', 'historical-data', 'alerts'],
    pricing: 'free',
    downloads: 12876,
    rating: 4.3,
    reviewCount: 278,
    lastUpdated: '2025-05-08',
    status: 'active',
    tags: ['weather', 'api', 'data']
  },
  {
    id: '5',
    name: 'Email Marketing Suite',
    description: 'Comprehensive email marketing platform with automation and analytics.',
    category: 'Marketing',
    version: '2.3.1',
    author: 'MailFlow',
    authType: 'oauth',
    capabilities: ['campaigns', 'automation', 'analytics', 'templates'],
    pricing: 'premium',
    downloads: 7234,
    rating: 4.7,
    reviewCount: 167,
    lastUpdated: '2025-05-05',
    status: 'active',
    tags: ['email', 'marketing', 'automation']
  },
  {
    id: '6',
    name: 'Payment Processing',
    description: 'Secure payment processing with support for multiple payment methods.',
    category: 'Finance',
    version: '1.9.3',
    author: 'PaySecure',
    authType: 'api-key',
    capabilities: ['payments', 'refunds', 'webhooks', 'fraud-detection'],
    pricing: 'premium',
    downloads: 9876,
    rating: 4.5,
    reviewCount: 234,
    lastUpdated: '2025-05-03',
    status: 'active',
    tags: ['payments', 'fintech', 'security']
  }
];

export const mockInstallations: Installation[] = [
  {
    id: '1',
    serverId: '1',
    serverName: 'GitHub Integration',
    status: 'running',
    installedAt: '2025-04-20',
    lastActive: '2025-06-06T10:30:00Z',
    usageMetrics: {
      requests: 1247,
      uptime: 99.8,
      errorRate: 0.2
    },
    configuration: {
      repositories: ['sentilabs/mcp-hub', 'sentilabs/ai-toolkit'],
      webhookUrl: 'https://api.sentilabs.com/webhook'
    }
  },
  {
    id: '2',
    serverId: '2',
    serverName: 'Slack Bot Framework',
    status: 'running',
    installedAt: '2025-04-15',
    lastActive: '2025-06-06T09:45:00Z',
    usageMetrics: {
      requests: 892,
      uptime: 98.5,
      errorRate: 1.5
    },
    configuration: {
      channels: ['#general', '#dev-team', '#ai-research'],
      botName: 'Senti Assistant'
    }
  },
  {
    id: '3',
    serverId: '4',
    serverName: 'Weather Data API',
    status: 'stopped',
    installedAt: '2025-04-10',
    lastActive: '2025-06-05T16:20:00Z',
    usageMetrics: {
      requests: 456,
      uptime: 95.2,
      errorRate: 2.1
    },
    configuration: {
      locations: ['San Francisco', 'New York', 'London'],
      units: 'metric'
    }
  }
];

export const mockOrganization: Organization = {
  id: '1',
  name: 'Senti Labs',
  slug: 'senti-labs',
  plan: 'pro',
  memberCount: 12,
  createdAt: '2025-03-01'
};

export const mockAPIEndpoints: APIEndpoint[] = [
  {
    id: '1',
    name: 'List Repositories',
    method: 'GET',
    path: '/api/v1/github/repositories',
    description: 'Get a list of repositories for the authenticated user',
    parameters: [
      { name: 'page', type: 'number', required: false, description: 'Page number for pagination' },
      { name: 'per_page', type: 'number', required: false, description: 'Number of items per page' },
      { name: 'sort', type: 'string', required: false, description: 'Sort order (created, updated, pushed, full_name)' }
    ],
    examples: [
      {
        name: 'Basic request',
        request: { page: 1, per_page: 10 },
        response: {
          repositories: [
            { id: 1, name: 'mcp-hub', full_name: 'sentilabs/mcp-hub', private: false },
            { id: 2, name: 'ai-toolkit', full_name: 'sentilabs/ai-toolkit', private: true }
          ],
          total_count: 2
        }
      }
    ]
  },
  {
    id: '2',
    name: 'Send Message',
    method: 'POST',
    path: '/api/v1/slack/messages',
    description: 'Send a message to a Slack channel',
    parameters: [
      { name: 'channel', type: 'string', required: true, description: 'Channel ID or name' },
      { name: 'text', type: 'string', required: true, description: 'Message text' },
      { name: 'blocks', type: 'array', required: false, description: 'Rich message blocks' }
    ],
    examples: [
      {
        name: 'Simple message',
        request: { channel: '#ai-research', text: 'New model training completed!' },
        response: { ok: true, message: { ts: '1234567890.123456' } }
      }
    ]
  }
];

export const mockAnalytics: AnalyticsData = {
  totalRequests: 45672,
  activeServers: 8,
  errorRate: 1.2,
  avgResponseTime: 245,
  requestsOverTime: [
    { time: '00:00', requests: 120 },
    { time: '04:00', requests: 85 },
    { time: '08:00', requests: 340 },
    { time: '12:00', requests: 520 },
    { time: '16:00', requests: 680 },
    { time: '20:00', requests: 420 }
  ],
  topServers: [
    { name: 'GitHub Integration', requests: 15420 },
    { name: 'Weather Data API', requests: 12876 },
    { name: 'Payment Processing', requests: 9876 },
    { name: 'Slack Bot Framework', requests: 8932 }
  ]
};
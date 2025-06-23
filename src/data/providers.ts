import { MCPServer } from '../types';

export interface ProviderMeta {
  id: string;
  name: string;
  logo: string; // light-mode logo (default)
  logoDark?: string; // optional dark-mode variant
  mcpServerId: string; // id to match MCPServer in DB
  commands: string[];
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'google_drive',
    name: 'Google Drive',
    logo: '/logos/google-drive-icon-google-product-illustration-free-png.webp',
    mcpServerId: 'google_drive',
    commands: ['List files', 'Upload file', 'Download file'],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    logo: '/logos/Gmail_icon_(2020).svg (1).webp',
    mcpServerId: 'gmail',
    commands: [
      'get-message',
      'send-email',
      // Status / labels
      'mark_email_as_read',
      'list_email_labels',
      'create_label',
      'update_label',
      'delete_label',
      'add_label_to_message',
      'remove_label_from_message',
      // Threads
      'list_threads',
      'get_thread',
      'modify_thread_labels',
      'trash_thread',
      'untrash_thread',
      'delete_thread',
      // Drafts
      'list_drafts',
      'get_draft',
      'create_draft',
      'update_draft',
      'delete_draft',
      // Delete / trash
      'trash_email',
      'untrash_message',
      'delete_email',
      // Attachments & profile
      'get_attachment',
      'get_profile',
      // Contacts / people
      'search_people',
      'get_contacts'
    ],
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    logo: '/logos/Google_Calendar_icon_(2020).svg.png',
    mcpServerId: 'google_calendar',
    commands: ['List events', 'Create event', 'Update event', 'Delete event'],
  },
  {
    id: 'github',
    name: 'GitHub',
    logo: '/logos/Octicons-mark-github.svg',
    logoDark: '/logos/github.png',
    mcpServerId: 'github',
    commands: ['list-repos', 'create-repo', 'get-issues', 'get-file'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    logo: '/logos/anthropic-icon-tdvkiqisswbrmtkiygb0ia.webp',
    logoDark: '/logos/anthropicwhiteSymbol.png',
    mcpServerId: 'anthropic',
    commands: ['chat', 'summarize', 'generate-code', 'explain', 'translate'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    logo: '/logos/openai-icon-505x512-pr6amibw.png',
    logoDark: '/logos/chatgptWHT.png',
    mcpServerId: 'openai',
    commands: ['chat', 'summarize', 'generate-code', 'explain', 'translate'],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    logo: '/logos/gemini_icon-logo_brandlogos.net_bqzeu.png',
    mcpServerId: 'gemini',
    commands: ['chat', 'summarize', 'generate-code', 'explain', 'translate'],
  },
  {
    id: 'slack',
    name: 'Slack',
    logo: '/logos/Slack_icon_2019.svg.png',
    mcpServerId: 'slack',
    commands: ['Send message', 'List channels', 'Get messages'],
  },
  {
    id: 'jira',
    name: 'Jira',
    logo: '/logos/jira-1.svg',
    mcpServerId: 'jira',
    commands: ['List projects', 'Create issue', 'Get issue', 'Update issue'],
  },
  {
    id: 'notion',
    name: 'Notion',
    logo: '/logos/Notion-logo.svg.png',
    mcpServerId: 'notion',
    commands: ['List pages', 'Create page', 'Retrieve page', 'Update page'],
  },
  {
    id: 'chroma',
    name: 'Chroma',
    logo: '/logos/chroma-logo.png',
    mcpServerId: 'chroma',
    commands: ['List collections', 'Query data'],
  },
  {
    id: 'jupyter',
    name: 'Jupyter',
    logo: '/logos/jupyter-notebook.png',
    mcpServerId: 'jupyter',
    commands: ['List notebooks', 'Run cell'],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    logo: '/logos/zapier-logo-svg-vector.svg',
    mcpServerId: 'zapier',
    commands: ['Trigger zap', 'List zaps', 'Run zap']
  },
  {
    id: 'make_com',
    name: 'Make.com',
    logo: '/logos/Make-app-icon.png',
    mcpServerId: 'make_com',
    commands: [
      'List scenarios  (/make list)',
      'Run scenario    (/make run <id>)',
      'Trigger webhook (/make webhook <url>)'
    ]
  },
  {
    id: 'n8n',
    name: 'n8n',
    logo: '/logos/n8n-color.png',
    mcpServerId: 'n8n',
    commands: ['Execute command', 'Execute workflow']
  },
  {
    id: 'zapier_cli',
    name: 'Zapier (Private)',
    logo: '/logos/zapier-logo-svg-vector.svg',
    mcpServerId: 'zapier',
    commands: ['Execute command', 'Execute workflow']
  },
  {
    id: 'cursor',
    name: 'Cursor',
    logo: '/logos/cursor light mode(1).png',
    logoDark: '/logos/cursor.png',
    mcpServerId: 'cursor',
    commands: ['open', 'search', 'code-complete'],
  },
];

export { PROVIDERS as default }; 
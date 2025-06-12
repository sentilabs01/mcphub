import { MCPServer } from '../types';

export interface ProviderMeta {
  id: string;
  name: string;
  logo: string; // path to logo in /public/logos
  mcpServerId: string; // id to match MCPServer in DB
  commands: string[];
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'github',
    name: 'GitHub',
    logo: '/logos/Octicons-mark-github.svg',
    mcpServerId: 'github',
    commands: ['List repos', 'Create repo', 'Get issues'],
  },
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
    commands: ['Send email', 'List inbox', 'Search emails'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    logo: '/logos/anthropic-icon-tdvkiqisswbrmtkiygb0ia.webp',
    mcpServerId: 'anthropic',
    commands: ['Chat', 'Summarize', 'Generate code'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    logo: '/logos/openai-icon-505x512-pr6amibw.png',
    mcpServerId: 'openai',
    commands: ['Chat', 'Summarize', 'Generate code'],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    logo: '/logos/gemini_icon-logo_brandlogos.net_bqzeu.png',
    mcpServerId: 'gemini',
    commands: ['Chat', 'Summarize', 'Generate code'],
  },
  {
    id: 'figma',
    name: 'Figma',
    logo: '/logos/Figma-logo.svg',
    mcpServerId: 'figma',
    commands: ['List files', 'Get design', 'Export asset'],
  },
  {
    id: 'slack',
    name: 'Slack',
    logo: '/logos/Slack_icon_2019.svg.png',
    mcpServerId: 'slack',
    commands: ['Send message', 'List channels', 'Get messages'],
  },
  {
    id: 'chroma',
    name: 'Chroma',
    logo: '/logos/chroma-logo.png',
    mcpServerId: 'chroma',
    commands: ['List collections', 'Query data'],
  },
  {
    id: 'brave',
    name: 'Brave',
    logo: '/logos/Brave_icon_lionface.png',
    mcpServerId: 'brave',
    commands: ['Get bookmarks', 'List tabs'],
  },
  {
    id: 'jupyter',
    name: 'Jupyter',
    logo: '/logos/jupyter-notebook.png',
    mcpServerId: 'jupyter',
    commands: ['List notebooks', 'Run cell'],
  },
  {
    id: 'clickhouse',
    name: 'ClickHouse',
    logo: '/logos/clickhouse.svg',
    mcpServerId: 'clickhouse',
    commands: ['Query data', 'List tables'],
  },
]; 
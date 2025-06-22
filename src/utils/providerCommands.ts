export const PROVIDER_COMMANDS = {
  openai: [
    { name: "Chat", command: "/openai chat" },
    { label: 'List Models', value: '/openai models' },
    { label: 'Usage Stats', value: '/openai usage' },
    { label: 'Set System Prompt', value: '/openai system "You are a helpful assistant."' },
    { label: 'Summarize Text', value: '/openai summarize <text>' },
    { label: 'Translate Text', value: '/openai translate <text> to <language>' },
  ],
  anthropic: [
    { name: "Chat", command: "/anthropic chat" },
    { label: 'List Models', value: '/anthropic models' },
    { label: 'Usage Stats', value: '/anthropic usage' },
    { label: 'Set System Prompt', value: '/anthropic system "You are a helpful assistant."' },
    { label: 'Summarize Text', value: '/anthropic summarize <text>' },
    { label: 'Translate Text', value: '/anthropic translate <text> to <language>' },
  ],
  google: {
    homepage: 'https://ai.google/',
    commands: [
      { label: 'Chat (default)', value: '' },
      { label: 'List Models', value: '/gemini models' },
      { label: 'Usage Stats', value: '/gemini usage' },
      { label: 'Summarize Text', value: '/gemini summarize <text>' },
      { label: 'Translate Text', value: '/gemini translate <text> to <language>' },
    ],
  },
  github: {
    homepage: 'https://github.com/',
    commands: [
      { label: 'List Repos', value: '/github repos' },
      { label: 'Create Issue', value: '/github create issue owner/repo "title" "body"' },
      { label: 'List Pull Requests', value: '/github pulls' },
      { label: 'List Issues', value: '/github issues' },
      { label: 'Get Repo Details', value: '/github repo owner/repo' },
      { label: 'Close Issue', value: '/github close issue owner/repo issue_number' },
    ],
  },
  jupyter: {
    homepage: 'https://jupyter.org/',
    commands: [
      { label: 'Open Notebook', value: '/jupyter open <notebook>' },
      { label: 'List Notebooks', value: '/jupyter list' },
    ],
  },
  brave: {
    homepage: 'https://search.brave.com/',
    commands: [
      { label: 'Web Search', value: '/brave search <query>' },
      { label: 'Local Search', value: '/brave local <query>' },
    ],
  },
  chroma: {
    homepage: 'https://www.trychroma.com/',
    commands: [
      { label: 'List Collections', value: '/chroma collections' },
      { label: 'Query Collection', value: '/chroma query <collection>' },
    ],
  },
  slack: {
    homepage: 'https://slack.com/',
    commands: [
      { label: 'List Channels', value: '/slack list channels' },
      { label: 'Send Message', value: '/slack send <channel> <message>' },
      { label: 'Open Socket Connection', value: '/slack connections open' },
      { label: 'List Authorizations', value: '/slack authorizations list' },
      { label: 'Export App Manifest', value: '/slack manifest export' },
      { label: 'Import App Manifest', value: '/slack manifest import <url_or_json>' },
    ],
  },
  jira: {
    homepage: 'https://www.atlassian.com/software/jira',
    commands: [
      { label: 'List Projects', value: '/jira projects' },
      { label: 'Create Issue', value: '/jira create-issue <project> "Summary" "Description"' },
      { label: 'Get Issue', value: '/jira issue <issue-key>' },
      { label: 'Update Issue', value: '/jira update-issue <issue-key> "field=value"' },
    ],
  },
  notion: {
    homepage: 'https://www.notion.so/',
    commands: [
      { label: 'List Pages', value: '/notion pages' },
      { label: 'Create Page', value: '/notion create-page "Title"' },
      { label: 'Retrieve Page', value: '/notion page <page-id>' },
      { label: 'Update Page', value: '/notion update-page <page-id> "property=value"' },
    ],
  },
  '21stdev': {
    homepage: 'https://21st.dev/',
    commands: [
      { label: 'Create UI Component', value: '/21stdev create <component>' },
    ],
  },
  clickhouse: {
    homepage: 'https://clickhouse.com/',
    commands: [
      { label: 'Query Table', value: '/clickhouse query <sql>' },
    ],
  },
  convex: {
    homepage: 'https://convex.dev/',
    commands: [
      { label: 'List Functions', value: '/convex functions' },
    ],
  },
  codeium: {
    homepage: 'https://codeium.com/',
    commands: [
      { label: 'Code Completion', value: '/codeium complete <code>' },
    ],
  },
  sourcegraph: {
    homepage: 'https://sourcegraph.com/',
    commands: [
      { label: 'Search Code', value: '/sourcegraph search <query>' },
    ],
  },
  linear: {
    homepage: 'https://linear.app/',
    commands: [
      { label: 'List Issues', value: '/linear issues' },
      { label: 'Create Issue', value: '/linear create <title>' },
    ],
  },
  webflow: {
    homepage: 'https://webflow.com/',
    commands: [
      { label: 'List Sites', value: '/webflow sites' },
    ],
  },
  browserstack: {
    homepage: 'https://browserstack.com/',
    commands: [
      { label: 'List Browsers', value: '/browserstack browsers' },
    ],
  },
  everart: {
    homepage: 'https://everart.ai/',
    commands: [
      { label: 'Generate Image', value: '/everart generate <prompt>' },
    ],
  },
  google_drive: {
    homepage: 'https://drive.google.com/',
    commands: [
      { label: 'List Files', value: '/drive list' },
      { label: 'Search Files', value: '/drive search <query>' },
      { label: 'Upload File', value: '/drive upload <filepath>' },
      { label: 'Download File', value: '/drive download file_id' },
      { label: 'Delete File', value: '/drive delete file_id' },
      { label: 'Share File', value: '/drive share file_id email' },
      { label: 'Get File Details', value: '/drive details file_id' },
    ],
  },
  gmail: {
    homepage: 'https://mail.google.com/',
    commands: [
      { label: 'List Emails', value: '/gmail list' },
      { label: 'Search Emails', value: '/gmail search <query>' },
      { label: 'Send Email', value: '/gmail send to@example.com "Subject" "Body"' },
      { label: 'Get Email Details', value: '/gmail get email_id' },
    ],
  },
  zapier: {
    homepage: 'https://zapier.com/',
    commands: [
      { label: 'Trigger Zap', value: '/zapier trigger' },
      { label: 'List Zaps', value: '/zapier list-zaps' },
      { label: 'List Actions', value: '/zapier list-actions' },
      { label: 'Run Zap', value: '/zapier run-zap <id>' },
      { label: 'Find Zap', value: '/zapier find-zap "name or id"' },
      { label: 'Zap Info', value: '/zapier info zap_id' },
    ],
  },
  make_com: {
    homepage: 'https://www.make.com/',
    commands: [
      { label: 'List Scenarios', value: '/make list scenarios' },
      { label: 'Run Scenario', value: '/make run <scenarioId>' },
      { label: 'Trigger Webhook', value: '/make webhook <url>' },
    ],
  },
  n8n: {
    homepage: 'https://n8n.io/',
    commands: [
      { label: 'Execute Command', value: '/n8n execute command' },
      { label: 'Execute Workflow', value: '/n8n execute workflow' },
    ],
  },
  google_calendar: {
    homepage: 'https://calendar.google.com/',
    commands: [
      { label: 'List Events (today)', value: '/calendar list' },
      { label: 'List Calendars', value: '/calendar calendars' },
      { label: 'Create Event', value: '/calendar create "Meeting" 2024-01-01T10:00 2024-01-01T11:00' },
      { label: 'Delete Event', value: '/calendar delete event_id' },
    ],
  },
  cursor: {
    homepage: 'https://cursor.sh/',
    commands: [
      { label: 'Open Repository', value: '/cursor open <repo-url>' },
      { label: 'Search Code', value: '/cursor search <query>' },
      { label: 'Code Complete', value: '/cursor complete <file>' },
    ],
  },
}; 
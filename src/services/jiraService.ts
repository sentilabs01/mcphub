/*
 * Jira Service – thin wrapper around Jira REST API.
 * NOTE: This is an initial scaffold. Extend with real functionality as needed.
 */

export interface JiraCredentials {
  baseUrl: string; // e.g. "https://your-domain.atlassian.net"
  email: string;   // Atlassian account email
  apiToken: string; // API token generated from https://id.atlassian.com/manage-profile/security/api-tokens
}

// Simple health-check by hitting /rest/api/3/myself. Returns true if credentials are valid.
export async function validateJiraCredentials(creds: JiraCredentials): Promise<boolean> {
  const { baseUrl, email, apiToken } = creds;
  if (!baseUrl || !email || !apiToken) throw new Error('Missing Jira credentials');

  const res = await fetch(`${baseUrl}/rest/api/3/myself`, {
    headers: {
      Authorization: `Basic ${btoa(`${email}:${apiToken}`)}`,
      Accept: 'application/json',
    },
  });
  return res.ok;
}

// Fetch list of projects (key + name). Returns [] on error.
export async function listJiraProjects(creds: JiraCredentials): Promise<any[]> {
  try {
    const res = await fetch(`${creds.baseUrl}/rest/api/3/project/search`, {
      headers: {
        Authorization: `Basic ${btoa(`${creds.email}:${creds.apiToken}`)}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.values || [];
  } catch {
    return [];
  }
} 
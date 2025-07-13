export async function fetchUserRepos(token: string): Promise<any[]> {
  try {
    const response = await fetch('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch repos: ' + response.statusText);
    }
    const data = await response.json();
    return data;
  } catch {
    return [];
  }
}

export async function createIssue(token: string, repo: string, title: string, body: string): Promise<any> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create issue');
    }
    return await response.json();
  } catch (err: any) {
    return { error: err.message || 'Unknown error' };
  }
}

// Validate a GitHub personal access token by calling the /user endpoint.
// Returns the user object (with at least the login field) if the token is valid, otherwise throws.
export async function verifyGithubToken(token: string): Promise<any> {
  if (!token) {
    throw new Error('GitHub token is required');
  }
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'MCP-Messenger'
    }
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub token verification failed: ${txt || res.statusText}`);
  }
  return res.json();
}

// ------- New helpers for backend-managed GitHub token ---------

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BACKEND_URL) || '';
const GITHUB_TOKEN_ENDPOINT = `${API_BASE}/api/user/github-token`;

// Load saved GitHub token from backend (cookie-based session). Returns empty string if not found.
export async function fetchSavedGithubToken(): Promise<string> {
  try {
    const res = await fetch(GITHUB_TOKEN_ENDPOINT, {
      credentials: 'include'
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data?.token || '';
  } catch {
    return '';
  }
}

// Persist a GitHub PAT in backend (POST). Throws on error.
export async function saveGithubToken(token: string): Promise<void> {
  const res = await fetch(GITHUB_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ token })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Failed to save GitHub token');
  }
}

// Delete saved GitHub token from backend (DELETE). Throws on error.
export async function deleteGithubToken(): Promise<void> {
  const res = await fetch(GITHUB_TOKEN_ENDPOINT, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Failed to delete GitHub token');
  }
} 
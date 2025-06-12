export async function fetchUserRepos(token: string): Promise<any[]> {
  try {
    const response = await fetch('https://api.github.com/user/repos', {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch repos: ' + response.statusText);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    return [];
  }
}

export async function createIssue(token: string, repo: string, title: string, body: string): Promise<any> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
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
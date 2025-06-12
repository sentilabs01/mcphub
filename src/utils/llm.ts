// Utility to call different LLM providers: OpenAI, Anthropic, Google Gemini/PaLM
// For demo/dev only: API keys should be passed in and never hardcoded in production!

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'gemini' | 'github';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMApiKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
  github?: string;
}

export interface CallLLMProviderParams {
  provider: LLMProvider;
  messages: LLMMessage[];
  apiKeys: LLMApiKeys;
  context?: any; // Optional extra context for prompt
}

export async function callLLMProvider({ provider, messages, apiKeys, context }: CallLLMProviderParams): Promise<string> {
  if (provider === 'openai') {
    // OpenAI Chat Completion via backend
    const response = await fetch('http://localhost:3001/api/command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'openai',
        apiKey: apiKeys.openai,
        prompt: messages[messages.length - 1]?.content || '',
        command: 'chat',
        messages,
      }),
    });
    if (!response.ok) throw new Error('OpenAI API error');
    const data = await response.json();
    // Return the backend's output field if present, otherwise fallback
    return data.output || data.reply || data.choices?.[0]?.message?.content || 'No response from OpenAI.';
  }

  if (provider === 'anthropic') {
    const response = await fetch('http://localhost:3001/api/command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'anthropic',
        apiKey: apiKeys.anthropic,
        prompt: messages[messages.length - 1]?.content || '',
        command: 'chat',
        messages,
      }),
    });
    if (!response.ok) throw new Error('Anthropic API error');
    const data = await response.json();
    return data.output || 'No response from Anthropic.';
  }

  if (provider === 'google' || provider === 'gemini') {
    const geminiApiKey = apiKeys.google || process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('No Gemini API key provided');
    }
    // Prepare Gemini API request
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            ...(Array.isArray(messages)
              ? messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
              : [{ role: 'user', parts: [{ text: messages[messages.length - 1]?.content || '' }] }]
            )
          ],
          generationConfig: { maxOutputTokens: 256 }
        })
      }
    );
    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      throw new Error(`Gemini API error: ${err}`);
    }
    const data = await geminiRes.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
  }

  if (provider === 'github') {
    const githubToken = apiKeys.github;
    if (!githubToken) {
      throw new Error('No GitHub token provided');
    }
    // Simple test: fetch user profile to validate token
    const githubRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${githubToken}`,
        'User-Agent': 'MCP-Hub'
      }
    });
    if (!githubRes.ok) {
      const err = await githubRes.text();
      throw new Error(`GitHub API error: ${err}`);
    }
    const data = await githubRes.json();
    return `GitHub token is valid for user: ${data.login}`;
  }

  throw new Error('Unknown LLM provider');
} 
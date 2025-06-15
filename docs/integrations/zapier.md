# Zapier (AI Actions)

| Item                | Value                           |
|---------------------|---------------------------------|
| Provider ID         | `zapier`                        |
| MCP server row      | id=`zapier`, apiurl=…`/api`     |
| Required credential | **AI Actions** key              |
| Local storage key   | `zapierApiKey`                  |

## Slash commands

```
/zapier list zaps
/zapier trigger zap <id>
```

## MCP handler snippet

```ts
case 'zapier': {
  const key = req.headers.authorization?.replace('Bearer ', '');
  if (!key) return res.status(401).json({ error: 'Missing key' });
  // List zaps
  if (/^list zaps/i.test(cmd)) {
    const r = await fetch('https://nla.zapier.com/api/v1/ai_zaps', { headers: { Authorization: `Bearer ${key}` } });
    return res.status(r.status).json(await r.json());
  }
}
``` 
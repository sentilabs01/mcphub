import { getValidGoogleToken } from './googleToken';

export async function listDriveFiles(token?: string): Promise<any[]> {
  if (!token) token = await getValidGoogleToken();
  try {
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch Drive files');
    const data = await response.json();
    return data.files || [];
  } catch {
    return [];
  }
}

export async function getDriveFileDetails(token: string, fileId: string): Promise<any> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=*`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch file details');
  return await response.json();
}

export async function downloadDriveFile(token: string, fileId: string): Promise<Blob> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to download file');
  return await response.blob();
}

export async function uploadDriveFile(token: string, file: File, parentId?: string): Promise<any> {
  const metadata = {
    name: file.name,
    parents: parentId ? [parentId] : undefined,
  };
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async (e) => {
      const contentType = file.type || 'application/octet-stream';
      const base64Data = btoa(e.target?.result as string);
      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${contentType}\r\n` +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        base64Data +
        closeDelim;
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });
      if (!response.ok) reject(new Error('Failed to upload file'));
      else resolve(await response.json());
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

export async function deleteDriveFile(token: string, fileId: string): Promise<boolean> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to delete file');
  return true;
}

export async function shareDriveFile(token: string, fileId: string): Promise<string> {
  // Make file readable by anyone with the link
  const permRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });
  if (!permRes.ok) throw new Error('Failed to set sharing permissions');
  // Get shareable link
  const file = await getDriveFileDetails(token, fileId);
  return file.webViewLink || file.webContentLink || '';
}

export async function searchDriveFiles(token: string, query: string): Promise<any[]> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to search Drive files');
  const data = await response.json();
  return data.files || [];
}

export async function listGmailMessages(token?: string, maxResults: number = 10): Promise<any[]> {
  if (!token) token = await getValidGoogleToken();
  try {
    // Step 1: List message IDs
    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!listRes.ok) throw new Error('Failed to fetch Gmail messages');
    const listData = await listRes.json();
    if (!listData.messages) return [];
    // Step 2: Fetch message details for each ID
    const messages = await Promise.all(
      listData.messages.map(async (msg: any) => {
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=subject&metadataHeaders=from&metadataHeaders=date&metadataHeaders=snippet`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!msgRes.ok) return null;
        return await msgRes.json();
      })
    );
    return messages.filter(Boolean);
  } catch {
    return [];
  }
} 
/**
 * Upload a single image file to a Google Drive folder.
 * @param {File} file - File object from input
 * @param {string} folderId - Target Drive folder ID
 * @param {string} accessToken - OAuth access token
 * @returns {Promise<{id: string, name: string, webViewLink: string}>}
 */
export async function uploadImage(file, folderId, accessToken) {
  const metadata = {
    name: `${Date.now()}_${file.name}`,
    mimeType: file.type,
    parents: [folderId],
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', file);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink&supportsAllDrives=true',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Drive upload failed: ${error.error?.message || response.status}`);
  }

  return await response.json();
}

/**
 * Upload multiple images sequentially with progress tracking.
 * @param {File[]} files - Array of File objects
 * @param {string} folderId - Target Drive folder ID
 * @param {string} accessToken - OAuth access token
 * @param {Function} onProgress - callback(completedCount, totalCount)
 * @returns {Promise<Array<{id: string, name: string, webViewLink: string}>>}
 */
export async function uploadMultipleImages(files, folderId, accessToken, onProgress) {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const result = await uploadImage(files[i], folderId, accessToken);
    results.push(result);
    if (onProgress) onProgress(i + 1, files.length);
  }
  
  return results;
}

/**
 * Create a new folder inside a parent folder in Google Drive.
 * @param {string} folderName - Name of the folder to create
 * @param {string} parentId - Parent folder ID
 * @param {string} accessToken - OAuth access token
 * @returns {Promise<string>} The created folder ID
 */
export async function createFolder(folderName, parentId, accessToken) {
  const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id&supportsAllDrives=true', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Folder creation failed: ${error.error?.message || response.status}`);
  }

  const data = await response.json();
  
  // Make the folder publicly readable so anyone can access photos if needed,
  // or at least readable/accessible to anyone with the link.
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (err) {
    console.warn('Failed to make folder public, proceeding anyway:', err);
  }

  return data.id;
}

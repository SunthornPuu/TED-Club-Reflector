const MASTER_SHEET_ID = import.meta.env.VITE_MASTER_SHEET_ID;

// The sheet name in the Master spreadsheet is "Users"
const MASTER_SHEET_RANGE = 'Users';

/**
 * Read all rows from the master auth sheet using the Service Account's accessToken.
 * @param {string} accessToken - Service account access token
 * @returns {Promise<string[][]>} 2D array of row values
 */
export async function readMasterSheet(accessToken) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${MASTER_SHEET_ID}/values/${MASTER_SHEET_RANGE}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to read master sheet: ${error.error?.message || response.status}`);
  }
  
  const data = await response.json();
  return data.values || [];
}

/**
 * Create a new tab (sheet) inside the Master Spreadsheet.
 * If it already exists, Google returns a 400 error which we catch and safely ignore.
 * @param {string} tabName - Title of the new tab
 * @param {string} accessToken - Service account access token
 * @returns {Promise<string>} The name of the tab
 */
async function createUserTab(tabName, accessToken) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${MASTER_SHEET_ID}:batchUpdate`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: tabName
            }
          }
        }
      ]
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.warn(`Tab creation might have failed or tab already exists: ${error.error?.message || response.status}`);
    // If it exists, we don't need to rewrite the headers, so we just return early.
    return tabName;
  }

  // Add default 4-column headers to the newly created tab
  const headers = [
    'ครั้งที่ (Submission)',
    'คำตอบ Q1 (Answer Q1)',
    'สรุปกิจกรรมจาก AI (AI Summary)',
    'ลิงก์รูปภาพ (Photo Link)'
  ];
  await appendReflection(tabName, accessToken, headers);

  return tabName;
}

/**
 * Increment the reflection count in Column C of the Master Sheet.
 * @param {number} rowIndex - 0-based row index in the Master Sheet array
 * @param {number} nextCount - The incremented reflection count
 * @param {string} accessToken - Service account access token
 */
export async function updateMasterSheetCount(rowIndex, nextCount, accessToken) {
  const rowNumber = rowIndex + 1;
  const range = `${MASTER_SHEET_RANGE}!C${rowNumber}`; // Col C is now the counter
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${MASTER_SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[nextCount]],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update Master Sheet count: ${error.error?.message || response.status}`);
  }
}

/**
 * Authenticate a user by matching username (Col A) and buddy name (Col B).
 * @param {string} username - ชื่อเล่น
 * @param {string} buddyName - ชื่อบัดดี้
 * @param {string} accessToken - Service account access token
 * @returns {Promise<{username: string, sheetId: string, reflectionCount: number, rowIndex: number} | null>}
 */
export async function authenticateUser(username, buddyName, accessToken) {
  const rows = await readMasterSheet(accessToken);
  
  // Skip header row (index 0), search from row 1 onwards
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[0]?.trim() === username.trim() && row[1]?.trim() === buddyName.trim()) {
      let reflectionCountRaw = row[2]?.trim(); // Column C is now Reflection Count
      const entityName = `${username.trim()}-${buddyName.trim()}`;
      const expectedTabName = `${entityName} (Reflection)`;

      // Setup default count
      let reflectionCount = 0;
      if (reflectionCountRaw === undefined || reflectionCountRaw === '') {
        reflectionCount = 0;
      } else {
        reflectionCount = parseInt(reflectionCountRaw, 10) || 0;
      }

      // If this is their first submission (or the count is empty), attempt to create the tab
      if (reflectionCount === 0) {
        await createUserTab(expectedTabName, accessToken);
      }

      return {
        username: row[0].trim(),
        sheetId: expectedTabName, // keeping variable name as sheetId for App.jsx compat
        reflectionCount,
        rowIndex: i,
      };
    }
  }
  
  return null; // No match found
}

/**
 * Append a row of data to a specific tab in the Master Spreadsheet.
 * @param {string} tabName - The name of the tab inside the Master Spreadsheet
 * @param {string} accessToken - OAuth access token
 * @param {string[]} rowData - Array of cell values for the new row [count, q1Answer, aiSummary, photoLink]
 */
export async function appendReflection(tabName, accessToken, rowData) {
  // Using the Master Sheet ID, targeting the specific tab Name
  const range = `${tabName}!A:D`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${MASTER_SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowData],
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to append reflection to tab: ${error.error?.message || response.status}`);
  }
  
  return await response.json();
}

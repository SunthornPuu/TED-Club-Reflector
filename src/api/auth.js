import { importPKCS8, SignJWT } from 'jose';

let accessToken = null;
let tokenExpiration = null; // timestamp when token expires
let tokenPromise = null; // keeps track of in-flight token request

const CLIENT_EMAIL = import.meta.env.VITE_GOOGLE_SERVICE_CLIENT_EMAIL;
const PRIVATE_KEY = import.meta.env.VITE_GOOGLE_SERVICE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
const TOKEN_URI = 'https://oauth2.googleapis.com/token';

/**
 * Generate a JWT signed by the Service Account private key and exchange it for an access token.
 */
async function fetchServiceAccountToken() {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Service Account credentials are not configured in environment variables.');
  }

  try {
    // 1. Create the JWT
    const privateKeyObj = await importPKCS8(PRIVATE_KEY, 'RS256');
    const now = Math.floor(Date.now() / 1000);
    const jwt = await new SignJWT({
      iss: CLIENT_EMAIL,
      scope: SCOPES,
      aud: TOKEN_URI,
      exp: now + 3600, // 1 hour max
      iat: now,
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .sign(privateKeyObj);

    // 2. Exchange JWT for access token
    const response = await fetch(TOKEN_URI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(`Failed to exchange JWT for token: ${errData.error_description || errData.error}`);
    }

    const data = await response.json();
    return {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  } catch (error) {
    console.error('Service Account Auth Error:', error);
    throw error;
  }
}

/**
 * Request an access token using the Service Account credentials.
 * Handles caching and deduplicates simultaneous requests.
 * @returns {Promise<string>} The access token
 */
export async function requestAccessToken() {
  // If we have a valid token that hasn't expired (buffer of 60 seconds)
  if (accessToken && tokenExpiration && Date.now() < tokenExpiration - 60000) {
    return accessToken;
  }

  // If a request is already in flight, wait for it instead of making another
  if (tokenPromise) {
    return tokenPromise;
  }

  // Otherwise, fetch a new token
  tokenPromise = (async () => {
    try {
      const result = await fetchServiceAccountToken();
      accessToken = result.token;
      tokenExpiration = result.expiresAt;
      return accessToken;
    } finally {
      tokenPromise = null; // Clear the in-flight promise
    }
  })();

  return tokenPromise;
}

/**
 * Get the current access token synchronously (may be null if not fetched yet)
 */
export function getAccessToken() {
  return accessToken;
}

/**
 * Revoke/clear token (mostly for testing/resetting in this context)
 */
export function revokeToken() {
  accessToken = null;
  tokenExpiration = null;
}

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { google } from 'googleapis'
import type { Auth, drive_v3 } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']

type OAuthClientFile = {
  web?: {
    client_id: string
    client_secret: string
    redirect_uris?: string[]
  }
  installed?: {
    client_id: string
    client_secret: string
    redirect_uris?: string[]
  }
}

export function getDriveFolderId(): string {
  const folderId = process.env.DRIVE_FOLDER_ID?.trim()
  if (!folderId) throw new Error('Missing DRIVE_FOLDER_ID')
  return folderId
}

function loadOAuthClientConfig(): { clientId: string; clientSecret: string; redirectUri: string } {
  const fromEnvId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim()
  const fromEnvSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim()
  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() ||
    'http://localhost:3002/oauth/google/callback'

  if (fromEnvId && fromEnvSecret) {
    return { clientId: fromEnvId, clientSecret: fromEnvSecret, redirectUri }
  }

  const keyPath =
    process.env.GOOGLE_OAUTH_CLIENT_FILE?.trim() || './.secrets/google-oauth-client.json'
  const absolute = resolve(process.cwd(), keyPath)
  const parsed = JSON.parse(readFileSync(absolute, 'utf8')) as OAuthClientFile
  const block = parsed.web ?? parsed.installed
  if (!block?.client_id || !block.client_secret) {
    throw new Error('Invalid Google OAuth client JSON')
  }

  return {
    clientId: block.client_id,
    clientSecret: block.client_secret,
    redirectUri,
  }
}

export function createOAuth2Client(): Auth.OAuth2Client {
  const { clientId, clientSecret, redirectUri } = loadOAuthClientConfig()
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export function getAuthUrl(): string {
  const client = createOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })
}

const TOKEN_PATH = resolve(process.cwd(), '.secrets/google-oauth-token.json')

export function saveRefreshToken(refreshToken: string) {
  try {
    writeFileSync(
      TOKEN_PATH,
      JSON.stringify({ refresh_token: refreshToken, savedAt: new Date().toISOString() }, null, 2),
      'utf8',
    )
  } catch (err) {
    // In Docker there is often no writable .secrets — token must be copied to env.
    console.warn('[oauth] could not write token file (use GOOGLE_OAUTH_REFRESH_TOKEN env):', err)
  }
}

function loadRefreshToken(): string {
  const fromEnv = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim()
  if (fromEnv) return fromEnv

  try {
    const raw = JSON.parse(readFileSync(TOKEN_PATH, 'utf8')) as { refresh_token?: string }
    if (raw.refresh_token) return raw.refresh_token
  } catch {
    // no token file yet
  }

  throw new Error(
    'Missing Google OAuth refresh token. Open GET /oauth/google once while logged as the Drive owner.',
  )
}

let driveClient: drive_v3.Drive | null = null
let oauthClient: Auth.OAuth2Client | null = null

function getOAuthClient(): Auth.OAuth2Client {
  if (oauthClient) return oauthClient
  oauthClient = createOAuth2Client()
  oauthClient.setCredentials({ refresh_token: loadRefreshToken() })
  return oauthClient
}

export function getDrive(): drive_v3.Drive {
  if (driveClient) return driveClient
  driveClient = google.drive({ version: 'v3', auth: getOAuthClient() })
  return driveClient
}

export async function getAccessToken(): Promise<string> {
  const auth = getOAuthClient()
  const result = await auth.getAccessToken()
  const token = typeof result === 'string' ? result : result?.token
  if (!token) throw new Error('Failed to refresh Google access token')
  return token
}

export function resetDriveClient() {
  driveClient = null
  oauthClient = null
}

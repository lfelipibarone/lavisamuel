import { Hono } from 'hono'
import { createOAuth2Client, getAuthUrl, resetDriveClient, saveRefreshToken } from '../lib/drive.js'

export const oauthRoute = new Hono()

function setupAllowed(): boolean {
  if (process.env.ALLOW_OAUTH_SETUP === 'true') return true
  if (!process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim()) return true
  try {
    // token file may exist — still allow if explicitly enabled
    return process.env.NODE_ENV !== 'production'
  } catch {
    return true
  }
}

oauthRoute.get('/google', (c) => {
  if (!setupAllowed()) {
    return c.json({ error: 'OAuth setup disabled. Set ALLOW_OAUTH_SETUP=true to re-authorize.' }, 403)
  }
  return c.redirect(getAuthUrl())
})

oauthRoute.get('/google/callback', async (c) => {
  if (!setupAllowed()) {
    return c.json({ error: 'OAuth setup disabled' }, 403)
  }

  const code = c.req.query('code')
  const error = c.req.query('error')
  const errorDescription = c.req.query('error_description')

  if (error) {
    return c.text(
      `Google recusou o login: ${error}\n${errorDescription ?? ''}\n\nConfira no Google Cloud se o redirect URI é exatamente:\n${process.env.GOOGLE_OAUTH_REDIRECT_URI ?? '(GOOGLE_OAUTH_REDIRECT_URI não definido)'}`,
      400,
    )
  }

  if (!code) {
    return c.html(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"/><title>OAuth</title></head>
<body style="font-family:system-ui;max-width:40rem;margin:2rem auto;line-height:1.5">
  <h1>Faltou o code do Google</h1>
  <p>Essa URL de callback não pode ser aberta direto. Comece por:</p>
  <p><a href="/oauth/google"><strong>/oauth/google</strong></a></p>
  <p>No Google Cloud, o redirect URI tem que ser <em>exatamente</em>:</p>
  <code>${process.env.GOOGLE_OAUTH_REDIRECT_URI ?? 'GOOGLE_OAUTH_REDIRECT_URI não definido no backend'}</code>
  <p>Sem barra no final. Depois autorize com a conta dona do Drive.</p>
</body></html>`, 400)
  }

  try {
    const client = createOAuth2Client()
    const { tokens } = await client.getToken(code)
    if (!tokens.refresh_token) {
      return c.text(
        'Google não devolveu refresh_token. Revogue o acesso do app em https://myaccount.google.com/permissions e tente de novo com prompt=consent.',
        400,
      )
    }

    saveRefreshToken(tokens.refresh_token)
    resetDriveClient()

    // Also useful to paste into deploy secrets
    return c.html(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"/><title>OAuth OK</title></head>
<body style="font-family:system-ui;max-width:40rem;margin:2rem auto;line-height:1.5">
  <h1>Drive autorizado</h1>
  <p>Refresh token salvo em <code>apps/api/.secrets/google-oauth-token.json</code> (fora do Git).</p>
  <p>No deploy, crie o secret <code>GOOGLE_OAUTH_REFRESH_TOKEN</code> com o valor abaixo:</p>
  <textarea readonly style="width:100%;height:6rem">${tokens.refresh_token}</textarea>
  <p>Pode fechar esta aba e testar o upload no álbum.</p>
</body></html>`)
  } catch (err) {
    console.error(err)
    return c.text('Falha ao trocar o code por token. Veja os logs da API.', 500)
  }
})

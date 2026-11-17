import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { sendAbsences, sendInvites, allowedToSend, MAX_MESSAGES } from './api/whatsapp.js'

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

// Local stand-in for the Vercel /api/whatsapp route. Twilio keys stay in .env.
function whatsAppDev(env) {
  return {
    name: 'whatsapp-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/whatsapp' || req.method !== 'POST') return next()
        if (!allowedToSend(req)) {
          res.statusCode = 401
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Please sign in again.' }))
          return
        }
        try {
          const body = JSON.parse((await readBody(req)) || '{}')
          const result = body.kind === 'invite'
            ? await sendInvites((body.leads || []).slice(0, MAX_MESSAGES), body.institute, env)
            : await sendAbsences((body.students || []).slice(0, MAX_MESSAGES), body.date, env, body.subject)
          res.statusCode = result.error ? 400 : 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'The request was not valid JSON.' }))
        }
      })
    },
  }
}

// Local stand-in for the Vercel /api/db route. The connection string stays in .env.
function mongoDev() {
  return {
    name: 'mongo-db-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || '').split('?')[0]
        if (path !== '/api/db' || req.method !== 'POST') return next()
        let body = {}
        try {
          body = JSON.parse((await readBody(req)) || '{}')
        } catch {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'The request was not valid JSON.' }))
          return
        }
        try {
          // Loaded fresh on each request, so edits to api/ take effect without restarting the dev server.
          const { handle: handleDb } = await server.ssrLoadModule('/api/db.js')
          const result = await handleDb(body, req)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (err) {
          const status = err.status || 500
          if (status === 500) console.error('[api/db]', err)
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: status === 500 ? 'Something went wrong with the database.' : err.message }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.MONGODB_URI) process.env.MONGODB_URI = env.MONGODB_URI
  if (env.MONGODB_DB) process.env.MONGODB_DB = env.MONGODB_DB
  if (env.AUTH_SECRET) process.env.AUTH_SECRET = env.AUTH_SECRET
  // Receipt photos are read on the server with this key.
  if (env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY) process.env.OPENAI_API_KEY = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY
  return {
    plugins: [react(), whatsAppDev(env), mongoDev()],
    build: {
      rolldownOptions: {
        output: {
          entryFileNames: 'assets/[hash].js',
          chunkFileNames: 'assets/[hash].js',
          assetFileNames: 'assets/[hash][extname]',
        },
      },
    },
  }
})

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

// Local stand-in for the Vercel /api/whatsapp and /api/calls routes: runs the real handler with a small req/res shim.
function apiDev() {
  const routes = { '/api/whatsapp': '/api/whatsapp.js', '/api/calls': '/api/calls.js' }
  return {
    name: 'api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const file = routes[(req.url || '').split('?')[0]]
        if (!file) return next()
        const raw = req.method === 'POST' ? await readBody(req) : ''
        const type = String(req.headers['content-type'] || '')
        try {
          req.body = type.includes('urlencoded') ? Object.fromEntries(new URLSearchParams(raw)) : JSON.parse(raw || '{}')
        } catch {
          req.body = raw
        }
        res.status = (code) => { res.statusCode = code; return res }
        res.json = (data) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)) }
        res.send = (data) => res.end(data)
        const { default: handler } = await server.ssrLoadModule(file)
        await handler(req, res)
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
  // Twilio keys for WhatsApp messages and fee calls, read by the api/ handlers.
  Object.keys(env).filter((k) => k.startsWith('TWILIO_') || k === 'PUBLIC_BASE_URL').forEach((k) => { process.env[k] = env[k] })
  // Receipt photos are read on the server with this key.
  if (env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY) process.env.OPENAI_API_KEY = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY
  return {
    plugins: [react(), apiDev(), mongoDev()],
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

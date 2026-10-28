import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { sendAbsences } from './api/whatsapp.js'

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
        try {
          const body = JSON.parse((await readBody(req)) || '{}')
          const result = await sendAbsences(body.students || [], body.date, env)
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

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), whatsAppDev(loadEnv(mode, process.cwd(), ''))],
  build: {
    rolldownOptions: {
      output: {
        entryFileNames: 'assets/[hash].js',
        chunkFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash][extname]',
      },
    },
  },
}))

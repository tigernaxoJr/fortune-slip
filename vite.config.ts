import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    {
      name: 'ai-cors-proxy',
      configureServer(server) {
        server.middlewares.use('/api-proxy', async (req, res) => {
          try {
            const targetUrlStr = req.headers['x-target-url'] as string
            if (!targetUrlStr) {
              res.statusCode = 400
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify({ error: { message: 'Missing x-target-url header in proxy request' } }))
              return
            }

            const reqUrl = req.url || ''
            const targetBase = targetUrlStr.replace(/\/+$/, '')
            const fullTargetUrl = `${targetBase}${reqUrl}`

            const headers: Record<string, string> = {}
            if (req.headers['content-type']) {
              headers['content-type'] = req.headers['content-type'] as string
            }
            if (req.headers['authorization']) {
              headers['authorization'] = req.headers['authorization'] as string
            }

            let body: string | undefined = undefined
            if (req.method !== 'GET' && req.method !== 'HEAD') {
              body = await new Promise<string>((resolve, reject) => {
                let data = ''
                req.on('data', (chunk) => (data += chunk))
                req.on('end', () => resolve(data))
                req.on('error', reject)
              })
            }

            const response = await fetch(fullTargetUrl, {
              method: req.method,
              headers,
              body,
            })

            res.statusCode = response.status
            response.headers.forEach((val, key) => {
              const lowerKey = key.toLowerCase()
              if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(lowerKey)) {
                res.setHeader(key, val)
              }
            })

            const responseBuffer = await response.arrayBuffer()
            res.end(Buffer.from(responseBuffer))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                error: { message: err instanceof Error ? err.message : 'Dev Proxy Error' },
              }),
            )
          }
        })
      },
    },
  ],
})

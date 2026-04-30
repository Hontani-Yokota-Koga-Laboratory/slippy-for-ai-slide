import type { Plugin, ViteDevServer } from 'vite'
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

const ROOT = resolve(import.meta.dirname, '..')

async function handleRequest(req: IncomingMessage, res: ServerResponse, server: ViteDevServer) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const path = url.pathname.slice(5) // strip /api/

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    // GET /api/projects → list project directories
    if (path === 'projects' && req.method === 'GET') {
      const entries = await readdir(join(ROOT, 'projects'), { withFileTypes: true })
      const names = entries.filter(e => e.isDirectory()).map(e => e.name)
      return res.end(JSON.stringify(names))
    }

    // GET /api/projects/:name/slides → read slides.json
    const slidesMatch = path.match(/^projects\/([^/]+)\/slides$/)
    if (slidesMatch) {
      const project = slidesMatch[1]
      const filePath = join(ROOT, 'projects', project, 'slides.json')

      if (req.method === 'GET') {
        const content = await readFile(filePath, 'utf-8')
        res.setHeader('Content-Type', 'application/json')
        return res.end(content)
      }

      if (req.method === 'PUT') {
        const body = await readBody(req)
        await writeFile(filePath, body, 'utf-8')
        return res.end(JSON.stringify({ ok: true }))
      }
    }

    // POST /api/projects/:name/pdf → generate PDF with Puppeteer
    const pdfMatch = path.match(/^projects\/([^/]+)\/pdf$/)
    if (pdfMatch && req.method === 'POST') {
      const project = pdfMatch[1]
      const port = server.config.server.port ?? 5173
      const pdfUrl = `http://localhost:${port}/?project=${project}&print=1`

      const pdfBuffer = await generatePdf(pdfUrl)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${project}.pdf"`)
      return res.end(Buffer.from(pdfBuffer))
    }

    res.statusCode = 404
    res.end(JSON.stringify({ error: 'Not found' }))
  } catch (err) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: String(err) }))
  }
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

async function generatePdf(pageUrl: string): Promise<Uint8Array> {
  const { default: puppeteer } = await import('puppeteer')
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720 })
    await page.goto(pageUrl, { waitUntil: 'networkidle0', timeout: 60_000 })

    // Wait for the print-ready marker
    await page.waitForSelector('#print-ready', { timeout: 30_000 })

    const pdf = await page.pdf({
      width: '1280px',
      height: '720px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    return pdf
  } finally {
    await browser.close()
  }
}

export function slideServerPlugin(): Plugin {
  let devServer: ViteDevServer

  return {
    name: 'slide-server',
    configureServer(server) {
      devServer = server
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        handleRequest(req, res, devServer).catch(err => {
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(err) }))
        })
      })
    },
  }
}

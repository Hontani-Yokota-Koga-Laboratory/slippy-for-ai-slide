import type { Plugin, ViteDevServer } from 'vite'
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises'
import { join, resolve, extname } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

const ROOT = resolve(import.meta.dirname, '..')

async function updateProjectIndex(project: string) {
  const filePath = join(ROOT, 'projects', project, 'slides.json')
  const indexPath = join(ROOT, 'projects', project, '_index.json')

  try {
    const content = await readFile(filePath, 'utf-8')
    const lines = content.split('\n')
    const index = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Find "id": "..." with 4 spaces indentation (top-level slide property)
      const idMatch = line.match(/^ {4}"id":\s*"([^"]+)"/)
      if (idMatch) {
        const id = idMatch[1]
        let title = ''
        // Look ahead for heading or title within the same slide object
        for (let j = 1; j < 15 && (i + j) < lines.length; j++) {
          const nextLine = lines[i + j]
          // If we hit the next slide or end of components, stop looking
          if (nextLine.match(/^ {2}\},?/) || nextLine.match(/^ {4}"id":/)) break

          const titleMatch = nextLine.match(/"(heading|title)":\s*"([^"]+)"/)
          if (titleMatch) {
            title = titleMatch[2]
            break
          }
        }
        index.push({ id, line: i + 1, title })
      }
    }
    await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
  } catch (err) {
    console.error(`Failed to update index for ${project}:`, err)
  }
}

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

    // GET /api/projects/:name/config → read project.json
    const configMatch = path.match(/^projects\/([^/]+)\/config$/)
    if (configMatch) {
      const project = configMatch[1]
      const filePath = join(ROOT, 'projects', project, 'project.json')

      if (req.method === 'GET') {
        try {
          const content = await readFile(filePath, 'utf-8')
          return res.end(content)
        } catch {
          // If config doesn't exist, return empty object
          return res.end(JSON.stringify({}))
        }
      }

      if (req.method === 'PUT') {
        const body = await readBody(req)
        await writeFile(filePath, body, 'utf-8')
        return res.end(JSON.stringify({ ok: true }))
      }
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
        await updateProjectIndex(project)
        return res.end(JSON.stringify({ ok: true }))
      }
    }

    // GET /api/projects/:name/index → read _index.json
    const indexMatch = path.match(/^projects\/([^/]+)\/index$/)
    if (indexMatch && req.method === 'GET') {
      const project = indexMatch[1]
      const indexPath = join(ROOT, 'projects', project, '_index.json')
      try {
        const content = await readFile(indexPath, 'utf-8')
        return res.end(content)
      } catch {
        // If index doesn't exist, try to generate it
        await updateProjectIndex(project)
        const content = await readFile(indexPath, 'utf-8')
        return res.end(content)
      }
    }

    // POST /api/projects/:name/index → force regenerate _index.json
    if (indexMatch && req.method === 'POST') {
      const project = indexMatch[1]
      await updateProjectIndex(project)
      return res.end(JSON.stringify({ ok: true }))
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

    // GET /api/projects/:name/images → list images
    const imagesMatch = path.match(/^projects\/([^/]+)\/images$/)
    if (imagesMatch && req.method === 'GET') {
      const project = imagesMatch[1]
      const dirPath = join(ROOT, 'projects', project, 'images')
      try {
        const entries = await readdir(dirPath, { withFileTypes: true })
        const filenames = entries
          .filter(e => e.isFile() && !e.name.startsWith('.'))
          .map(e => e.name)
        return res.end(JSON.stringify(filenames))
      } catch {
        return res.end(JSON.stringify([]))
      }
    }

    // GET /api/projects/:name/images/:filename → serve image
    const imageMatch = path.match(/^projects\/([^/]+)\/images\/([^/]+)$/)
    if (imageMatch) {
      const project = imageMatch[1]
      const filename = imageMatch[2]
      const filePath = join(ROOT, 'projects', project, 'images', filename)

      if (req.method === 'GET') {
        try {
          const content = await readFile(filePath)
          const ext = extname(filename).toLowerCase()
          const mimeTypes: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml'
          }
          res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
          return res.end(content)
        } catch {
          res.statusCode = 404
          return res.end(JSON.stringify({ error: 'Image not found' }))
        }
      }

      if (req.method === 'DELETE') {
        const { unlink } = await import('node:fs/promises')
        try {
          await unlink(filePath)
          return res.end(JSON.stringify({ ok: true }))
        } catch (err) {
          res.statusCode = 500
          return res.end(JSON.stringify({ error: String(err) }))
        }
      }
    }

    // POST /api/projects/:name/images → upload image
    if (imagesMatch && req.method === 'POST') {
      const project = imagesMatch[1]
      const dirPath = join(ROOT, 'projects', project, 'images')
      await mkdir(dirPath, { recursive: true })

      const filename = url.searchParams.get('filename') || `pasted-${Date.now()}.png`
      const filePath = join(dirPath, filename)

      const body = await readBody(req)
      await writeFile(filePath, body)

      return res.end(JSON.stringify({ ok: true, filename }))
    }

    res.statusCode = 404
    res.end(JSON.stringify({ error: 'Not found' }))
  } catch (err) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: String(err) }))
  }
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', chunk => { chunks.push(chunk) })
    req.on('end', () => resolve(Buffer.concat(chunks)))
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

      // Watch for changes in projects/**/slides.json to update index automatically
      server.watcher.add(join(ROOT, 'projects/**/slides.json'))
      server.watcher.on('change', (path) => {
        if (path.endsWith('slides.json')) {
          const match = path.match(/projects\/([^/]+)\/slides\.json$/)
          if (match) {
            const project = match[1]
            console.log(`[slide-server] Change detected in ${project}, updating index...`)
            updateProjectIndex(project).catch(console.error)
          }
        }
      })

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

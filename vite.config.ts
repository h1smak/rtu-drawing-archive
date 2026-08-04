import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const LOCAL_PICTURES_DIR = process.env.ARCHIVE_IMAGES_PATH || 'E:/db_pictures'

function serveLocalArchiveImages(): Plugin {
  return {
    name: 'serve-local-archive-images',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.includes('/archive-images/')) {
          const urlPath = req.url.substring(req.url.indexOf('/archive-images/') + '/archive-images/'.length)
          const relativePath = decodeURIComponent(urlPath.split('?')[0])
          const filePath = path.join(LOCAL_PICTURES_DIR, relativePath)

          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase()
            const mimeTypes: Record<string, string> = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.webp': 'image/webp',
              '.gif': 'image/gif',
              '.svg': 'image/svg+xml',
              '.tif': 'image/tiff',
              '.tiff': 'image/tiff',
              '.bmp': 'image/bmp',
            }
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
            res.setHeader('Cache-Control', 'public, max-age=3600')
            return fs.createReadStream(filePath).pipe(res)
          }
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/rtu-drawing-archive/',
  plugins: [react(), serveLocalArchiveImages()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

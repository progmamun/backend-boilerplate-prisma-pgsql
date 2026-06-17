import path from 'path'
import fs from 'fs'

// Create public directory at project root
export const uploadDir = path.join(process.cwd(), 'public')

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

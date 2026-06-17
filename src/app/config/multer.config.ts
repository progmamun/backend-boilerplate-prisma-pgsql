import multer from 'multer'
import { uploadDir } from './upload.config'
import crypto from 'crypto'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const originalName = file.originalname

    const extension = originalName.split('.').pop()?.toLowerCase()

    const fileNameWithoutExtension = originalName
      .split('.')
      .slice(0, -1)
      .join('.')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 20) // limit length

    const uniqueName =
      crypto.randomBytes(6).toString('hex') +
      '-' +
      Date.now() +
      '-' +
      fileNameWithoutExtension +
      '.' +
      extension

    cb(null, uniqueName)
  },
})

export const multerUpload = multer({ storage })

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
})

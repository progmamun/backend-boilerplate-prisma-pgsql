import { Request } from 'express'
import fs from 'fs'

/**
 * Deletes a single file from local disk.
 * Silently ignores if file doesn't exist (already cleaned up).
 */
const deleteLocalFile = (filePath: string): Promise<void> => {
  return new Promise(resolve => {
    fs.unlink(filePath, err => {
      if (err && err.code !== 'ENOENT') {
        // ENOENT = file not found, that's fine
        console.error(`Failed to delete file: ${filePath}`, err)
      } else {
        console.log(`Deleted local file: ${filePath}`)
      }
      resolve() // always resolve — don't crash the error handler
    })
  })
}

export const deleteUploadedFilesFromGlobalErrorHandler = async (
  req: Request
): Promise<void> => {
  try {
    const filesToDelete: string[] = []

    // Single file upload (e.g., multerUpload.single("avatar"))
    if (req.file?.path) {
      filesToDelete.push(req.file.path)
    }
    // Fields upload (e.g., multerUpload.fields([...]))
    else if (
      req.files &&
      typeof req.files === 'object' &&
      !Array.isArray(req.files)
    ) {
      Object.values(req.files).forEach(fileArray => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach(file => {
            if (file.path) filesToDelete.push(file.path)
          })
        }
      })
    }
    // Array upload (e.g., multerUpload.array("photos"))
    else if (Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path) filesToDelete.push(file.path)
      })
    }

    if (filesToDelete.length > 0) {
      await Promise.all(filesToDelete.map(path => deleteLocalFile(path)))
      console.log(
        `\nDeleted ${filesToDelete.length} uploaded file(s) from disk due to error.\n`
      )
    }
  } catch (error) {
    console.error('Error in deleteUploadedFilesFromGlobalErrorHandler:', error)
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import ApiError from '../errors/apiError'
import { fileUploader } from './fileuploader'
import httpStatus from 'http-status'

export const handleFileUploads = async (
  files: { [fieldname: string]: Express.Multer.File[] } | undefined
): Promise<Record<string, string>> => {
  const uploadedFiles: Record<string, string> = {}

  if (!files) return uploadedFiles

  for (const [fieldName, fileArr] of Object.entries(files)) {
    if (!fileArr?.length) continue

    const trimmedFieldName = fieldName.trim() // ← trim trailing spaces
    const file = fileArr[0]
    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? ''

    let fileType: 'image' | 'video' | 'pdf' = 'image'
    if (trimmedFieldName === 'pdf' || ext === 'pdf') {
      fileType = 'pdf'
    } else if (
      trimmedFieldName === 'video' ||
      ['mp4', 'mov', 'avi', 'webm'].includes(ext)
    ) {
      fileType = 'video'
    }

    try {
      const upload = await fileUploader.uploadToZenexCloudWithType(
        file,
        fileType
      )
      uploadedFiles[trimmedFieldName] = upload.Location // ← use trimmed key
    } catch (error: any) {
      console.error(`❌ [${trimmedFieldName}] failed:`, error?.message)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Failed to upload ${trimmedFieldName}: ${error?.message ?? 'Unknown error'}`
      )
    }
  }

  return uploadedFiles
}

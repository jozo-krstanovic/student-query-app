import { apiFetch } from './api'

// Mirrors the backend's validation (InquiryController::uploadDocument /
// Faculty\InquiryController::uploadDocument) so bad files are rejected
// before spending a round trip uploading them.
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024

function validateFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error(`"${file.name}" isn't a supported file type.`)
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`"${file.name}" is larger than 10MB.`)
  }
}

export async function uploadDocuments(uploadPath, files, extra = {}) {
  files.forEach(validateFile)

  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)
    for (const [key, value] of Object.entries(extra)) {
      if (value != null) formData.append(key, value)
    }
    await apiFetch(uploadPath, { method: 'POST', body: formData })
  }
}

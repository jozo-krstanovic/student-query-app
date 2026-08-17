import { useState } from 'react'
import { useSession } from '@/lib/SessionContext'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function InquiryDocumentsCard({ documents, onChanged }) {
  const { profile } = useSession()
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)

  async function handleDownload(documentId) {
    try {
      const body = await apiFetch(`/api/documents/${documentId}/download`)
      window.open(body.url, '_blank')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(documentId) {
    setDeletingId(documentId)
    setError(null)
    try {
      await apiFetch(`/api/documents/${documentId}`, { method: 'DELETE' })
      await onChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  if (documents.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((document) => (
          <div
            key={document.id}
            className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3 text-sm"
          >
            <div>
              <button
                type="button"
                onClick={() => handleDownload(document.id)}
                className="font-medium hover:underline"
              >
                {document.file_name}
              </button>
              {document.comment_id && (
                <span className="ml-2 font-normal text-muted-foreground">(re: comment)</span>
              )}
              <div className="text-muted-foreground">
                {document.uploader.full_name} · {formatFileSize(document.file_size)} ·{' '}
                {new Date(document.created_at).toLocaleString()}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button variant="outline" size="xs" onClick={() => handleDownload(document.id)}>
                Download
              </Button>
              {document.uploaded_by === profile.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="xs" disabled={deletingId === document.id}>
                      {deletingId === document.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete document?</AlertDialogTitle>
                      <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => handleDelete(document.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        ))}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}

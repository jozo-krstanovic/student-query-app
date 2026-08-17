import { useRef, useState } from 'react'
import { useSession } from '@/lib/SessionContext'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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

export default function InquiryCommentsCard({
  comments,
  commentBody,
  setCommentBody,
  submitting,
  onSubmit,
  canComment = true,
  onCommentUpdated,
}) {
  const { profile } = useSession()
  const fileInputRef = useRef(null)
  const [editingId, setEditingId] = useState(null)
  const [editBody, setEditBody] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  function startEdit(comment) {
    setEditingId(comment.id)
    setEditBody(comment.body)
    setEditError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditBody('')
    setEditError(null)
  }

  async function saveEdit(commentId) {
    setSavingEdit(true)
    setEditError(null)
    try {
      await apiFetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: editBody }),
      })
      setEditingId(null)
      await onCommentUpdated?.()
    } catch (err) {
      setEditError(err.message)
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDelete(commentId) {
    setDeletingId(commentId)
    setDeleteError(null)
    try {
      await apiFetch(`/api/comments/${commentId}`, { method: 'DELETE' })
      await onCommentUpdated?.()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">
                    {comment.author.full_name}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString()}
                      {comment.updated_at !== comment.created_at && ' (edited)'}
                    </span>
                  </div>
                  {comment.author_id === profile.id && editingId !== comment.id && (
                    <div className="flex shrink-0 gap-1">
                      <Button variant="outline" size="xs" onClick={() => startEdit(comment)}>
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="xs"
                            disabled={deletingId === comment.id}
                          >
                            {deletingId === comment.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This can't be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleDelete(comment.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
                {editingId === comment.id ? (
                  <div className="mt-1 space-y-2">
                    <Textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={2}
                    />
                    {editError && <p className="text-xs text-destructive">{editError}</p>}
                    <div className="flex gap-2">
                      <Button size="xs" disabled={savingEdit} onClick={() => saveEdit(comment.id)}>
                        {savingEdit ? 'Saving...' : 'Save'}
                      </Button>
                      <Button size="xs" variant="ghost" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{comment.body}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}

        {canComment && (
          <>
            <Separator />
            <form
              onSubmit={(e) => {
                const files = Array.from(fileInputRef.current?.files || [])
                onSubmit(e, files)
                fileInputRef.current.value = ''
              }}
              className="space-y-2"
            >
              <Textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                required
              />
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                className="file:mr-2 file:h-6 file:rounded-md file:border file:border-input file:bg-background file:px-2.5 hover:file:bg-muted"
              />
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post comment'}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  )
}

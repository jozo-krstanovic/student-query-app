import { useState } from 'react'
import { useSession } from '@/lib/SessionContext'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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
  const [editingId, setEditingId] = useState(null)
  const [editBody, setEditBody] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState(null)

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
                    <Button variant="ghost" size="xs" onClick={() => startEdit(comment)}>
                      Edit
                    </Button>
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

        {canComment && (
          <>
            <Separator />
            <form onSubmit={onSubmit} className="space-y-2">
              <Textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                required
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

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import LoadingState from '@/components/layout/LoadingState'
import { ArrowLeft } from 'lucide-react'

const ACTION_LABELS = {
  submit: 'Submitted',
  approve: 'Approved',
  reset: 'Reset to start',
  resolve: 'Resolved',
}

export default function FacultyInquiryDetail({ inquiryId, onBack }) {
  const [inquiry, setInquiry] = useState(null)
  const [can, setCan] = useState({})
  const [error, setError] = useState(null)
  const [note, setNote] = useState('')
  const [acting, setActing] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  async function refresh() {
    try {
      const body = await apiFetch(`/api/faculty/inquiries/${inquiryId}`)
      setInquiry(body.inquiry)
      setCan(body.can)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    refresh()
  }, [inquiryId])

  async function handleAction(action) {
    setError(null)
    setActing(true)
    try {
      await apiFetch(`/api/faculty/inquiries/${inquiryId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note || null }),
      })
      setNote('')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  async function handleComment(e) {
    e.preventDefault()
    setError(null)
    setSubmittingComment(true)
    try {
      await apiFetch(`/api/faculty/inquiries/${inquiryId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentBody }),
      })
      setCommentBody('')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmittingComment(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ArrowLeft className="size-4" />
        Back to assigned inquiries
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!inquiry ? (
        <LoadingState />
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{inquiry.subject.name}</CardTitle>
                {inquiry.status === 'completed' ? (
                  <Badge variant="secondary">Completed</Badge>
                ) : (
                  <Badge>Awaiting {inquiry.current_step?.role?.name ?? '...'}</Badge>
                )}
              </div>
              <CardDescription>
                From {inquiry.student.full_name} — submitted {new Date(inquiry.created_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{inquiry.body}</p>
            </CardContent>
          </Card>

          {(can.approve || can.resolve || can.reset) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="action-note">Note (optional)</Label>
                  <Textarea
                    id="action-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  {can.approve && (
                    <Button disabled={acting} onClick={() => handleAction('approve')}>
                      Approve
                    </Button>
                  )}
                  {can.resolve && (
                    <Button
                      disabled={acting}
                      variant="secondary"
                      onClick={() => handleAction('resolve')}
                    >
                      Resolve
                    </Button>
                  )}
                  {can.reset && (
                    <Button disabled={acting} variant="outline" onClick={() => handleAction('reset')}>
                      Reset to start
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inquiry.step_history.map((entry) => (
                <div key={entry.id} className="text-sm">
                  <span className="font-medium">{ACTION_LABELS[entry.action] ?? entry.action}</span>
                  {' by '}
                  {entry.actor.full_name}
                  {entry.chain_step?.role && ` (${entry.chain_step.role.name})`}
                  <span className="text-muted-foreground">
                    {' — '}
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                  {entry.note && <div className="text-muted-foreground">{entry.note}</div>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inquiry.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                <div className="space-y-3">
                  {inquiry.comments.map((comment) => (
                    <div key={comment.id} className="text-sm">
                      <div className="font-medium">
                        {comment.author.full_name}
                        <span className="ml-2 font-normal text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{comment.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {can.comment && (
                <>
                  <Separator />
                  <form onSubmit={handleComment} className="space-y-2">
                    <Textarea
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      required
                    />
                    <Button type="submit" size="sm" disabled={submittingComment}>
                      {submittingComment ? 'Posting...' : 'Post comment'}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

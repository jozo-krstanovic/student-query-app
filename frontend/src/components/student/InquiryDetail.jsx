import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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

export default function InquiryDetail({ inquiryId, onBack }) {
  const [inquiry, setInquiry] = useState(null)
  const [error, setError] = useState(null)
  const [commentBody, setCommentBody] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  async function refresh() {
    try {
      const { inquiry } = await apiFetch(`/api/inquiries/${inquiryId}`)
      setInquiry(inquiry)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    refresh()
  }, [inquiryId])

  async function handleComment(e) {
    e.preventDefault()
    setError(null)
    setSubmittingComment(true)
    try {
      await apiFetch(`/api/inquiries/${inquiryId}/comments`, {
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
        Back to my inquiries
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
                Submitted {new Date(inquiry.created_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{inquiry.body}</p>
            </CardContent>
          </Card>

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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

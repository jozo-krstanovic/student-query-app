import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LoadingState from '@/components/layout/LoadingState'
import InquiryStatusBadge from '@/components/inquiry/StatusBadge'
import InquiryHistoryCard from '@/components/inquiry/HistoryCard'
import InquiryCommentsCard from '@/components/inquiry/CommentsCard'
import { ArrowLeft } from 'lucide-react'

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
                <InquiryStatusBadge inquiry={inquiry} />
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

          <InquiryHistoryCard stepHistory={inquiry.step_history} />

          <InquiryCommentsCard
            comments={inquiry.comments}
            commentBody={commentBody}
            setCommentBody={setCommentBody}
            submitting={submittingComment}
            onSubmit={handleComment}
            canComment={can.comment}
            onCommentUpdated={refresh}
          />
        </>
      )}
    </div>
  )
}

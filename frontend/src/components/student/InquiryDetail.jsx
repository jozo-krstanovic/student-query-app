import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LoadingState from '@/components/layout/LoadingState'
import InquiryStatusBadge from '@/components/inquiry/StatusBadge'
import InquiryHistoryCard from '@/components/inquiry/HistoryCard'
import InquiryCommentsCard from '@/components/inquiry/CommentsCard'
import { ArrowLeft } from 'lucide-react'

export default function InquiryDetail({ inquiryId, onBack }) {
  const [inquiry, setInquiry] = useState(null)
  const [canEdit, setCanEdit] = useState(false)
  const [error, setError] = useState(null)
  const [commentBody, setCommentBody] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [editingBody, setEditingBody] = useState(false)
  const [bodyDraft, setBodyDraft] = useState('')
  const [savingBody, setSavingBody] = useState(false)

  async function refresh() {
    try {
      const body = await apiFetch(`/api/inquiries/${inquiryId}`)
      setInquiry(body.inquiry)
      setCanEdit(body.can_edit)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    refresh()
  }, [inquiryId])

  function startEditBody() {
    setBodyDraft(inquiry.body)
    setEditingBody(true)
  }

  async function saveBody() {
    setError(null)
    setSavingBody(true)
    try {
      await apiFetch(`/api/inquiries/${inquiryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: bodyDraft }),
      })
      setEditingBody(false)
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingBody(false)
    }
  }

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
                <InquiryStatusBadge inquiry={inquiry} />
              </div>
              <CardDescription>
                Submitted {new Date(inquiry.created_at).toLocaleString()}
                {inquiry.body_edited_at && ' (edited)'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {editingBody ? (
                <div className="space-y-2">
                  <Textarea
                    value={bodyDraft}
                    onChange={(e) => setBodyDraft(e.target.value)}
                    rows={5}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={savingBody} onClick={saveBody}>
                      {savingBody ? 'Saving...' : 'Save'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingBody(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-sm">{inquiry.body}</p>
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={startEditBody}>
                      Edit
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <InquiryHistoryCard stepHistory={inquiry.step_history} />

          <InquiryCommentsCard
            comments={inquiry.comments}
            commentBody={commentBody}
            setCommentBody={setCommentBody}
            submitting={submittingComment}
            onSubmit={handleComment}
            onCommentUpdated={refresh}
          />
        </>
      )}
    </div>
  )
}

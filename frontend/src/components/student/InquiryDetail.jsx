import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { uploadDocuments } from '@/lib/documents'
import { useNotifications } from '@/lib/NotificationsContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LoadingState from '@/components/layout/LoadingState'
import NotFoundPage from '@/components/NotFoundPage'
import InquiryStatusBadge from '@/components/inquiry/StatusBadge'
import InquiryHistoryCard from '@/components/inquiry/HistoryCard'
import InquiryCommentsCard from '@/components/inquiry/CommentsCard'
import InquiryDocumentsCard from '@/components/inquiry/DocumentsCard'
import { ArrowLeft, Pencil } from 'lucide-react'

export default function InquiryDetail({ inquiryId, onBack }) {
  const { lastEvent } = useNotifications()
  const [inquiry, setInquiry] = useState(null)
  const [canEdit, setCanEdit] = useState(false)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
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
      // Only the initial load (inquiry still null) counts as "not found" --
      // a later refresh failing (e.g. after posting a comment) should show
      // an inline error alongside the data already on screen, not blow the
      // whole view away.
      if (!inquiry) {
        setNotFound(true)
      } else {
        setError(err.message)
      }
    }
  }

  useEffect(() => {
    refresh()
  }, [inquiryId])

  // A live notification for this same inquiry (e.g. faculty commented or
  // resolved it) while it's already open -- refresh in place, since
  // navigating to a URL you're already on doesn't remount/refetch anything.
  useEffect(() => {
    if (lastEvent && String(lastEvent.inquiry_id) === String(inquiryId)) {
      refresh()
    }
  }, [lastEvent])

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

  async function handleComment(e, files = []) {
    e.preventDefault()
    setError(null)
    setSubmittingComment(true)
    try {
      const { comment } = await apiFetch(`/api/inquiries/${inquiryId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentBody }),
      })

      if (files.length > 0) {
        await uploadDocuments(`/api/inquiries/${inquiryId}/documents`, files, { comment_id: comment.id })
      }

      setCommentBody('')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmittingComment(false)
    }
  }

  if (notFound) {
    return <NotFoundPage />
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
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{inquiry.subject.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <InquiryStatusBadge inquiry={inquiry} />
                  {canEdit && !editingBody && (
                    <Button variant="outline" size="sm" onClick={startEditBody} className="gap-1">
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                  )}
                </div>
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
                <p className="whitespace-pre-wrap text-sm">{inquiry.body}</p>
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

          <InquiryDocumentsCard documents={inquiry.documents} onChanged={refresh} />
        </>
      )}
    </div>
  )
}

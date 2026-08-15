import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LoadingState from '@/components/layout/LoadingState'
import InquiryStatusBadge from '@/components/inquiry/StatusBadge'
import InquiryHistoryCard from '@/components/inquiry/HistoryCard'
import InquiryCommentsCard from '@/components/inquiry/CommentsCard'
import { ArrowLeft } from 'lucide-react'

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
                <InquiryStatusBadge inquiry={inquiry} />
              </div>
              <CardDescription>
                Submitted {new Date(inquiry.created_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{inquiry.body}</p>
            </CardContent>
          </Card>

          <InquiryHistoryCard stepHistory={inquiry.step_history} />

          <InquiryCommentsCard
            comments={inquiry.comments}
            commentBody={commentBody}
            setCommentBody={setCommentBody}
            submitting={submittingComment}
            onSubmit={handleComment}
          />
        </>
      )}
    </div>
  )
}

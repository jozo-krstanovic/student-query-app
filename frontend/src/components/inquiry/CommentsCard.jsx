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
}) {
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

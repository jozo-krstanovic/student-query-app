import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function InquiryList({ inquiries, onSelect }) {
  if (inquiries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          You haven't submitted any inquiries yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {inquiries.map((inquiry) => (
        <Card
          key={inquiry.id}
          className="cursor-pointer transition-colors hover:bg-accent/50"
          onClick={() => onSelect(inquiry.id)}
        >
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <div className="font-medium">{inquiry.subject.name}</div>
              <div className="line-clamp-1 text-sm text-muted-foreground">{inquiry.body}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {inquiry.status === 'completed' ? (
                <Badge variant="secondary">Completed</Badge>
              ) : (
                <Badge>Awaiting {inquiry.current_step?.role?.name ?? '...'}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

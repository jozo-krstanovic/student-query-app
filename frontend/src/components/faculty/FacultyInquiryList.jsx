import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function FacultyInquiryList({
  inquiries,
  onSelect,
  emptyMessage = 'Nothing awaiting your review right now.',
  layout = 'stack',
}) {
  if (inquiries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={layout === 'grid' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
      {inquiries.map((inquiry) => (
        <Card
          key={inquiry.id}
          className="cursor-pointer transition-colors hover:bg-accent/50"
          onClick={() => onSelect(inquiry.id)}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium">{inquiry.subject.name}</div>
              {inquiry.status === 'completed' ? (
                <Badge variant="secondary">Completed</Badge>
              ) : (
                <Badge>Awaiting {inquiry.current_step?.role?.name ?? '...'}</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">From {inquiry.student.full_name}</div>
            <div className="line-clamp-1 text-sm text-muted-foreground">{inquiry.body}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

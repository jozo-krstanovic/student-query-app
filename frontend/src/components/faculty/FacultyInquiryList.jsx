import { Card, CardContent } from '@/components/ui/card'

export default function FacultyInquiryList({ inquiries, onSelect }) {
  if (inquiries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nothing awaiting your review right now.
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
          <CardContent className="py-4">
            <div className="font-medium">{inquiry.subject.name}</div>
            <div className="text-sm text-muted-foreground">From {inquiry.student.full_name}</div>
            <div className="line-clamp-1 text-sm text-muted-foreground">{inquiry.body}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

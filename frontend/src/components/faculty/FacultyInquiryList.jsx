import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import InquiryStatusBadge from '@/components/inquiry/StatusBadge'

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

  if (layout === 'list') {
    return (
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current step</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.map((inquiry) => (
                <TableRow
                  key={inquiry.id}
                  className="cursor-pointer"
                  onClick={() => onSelect(inquiry.id)}
                >
                  <TableCell className="font-medium">{inquiry.subject.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {inquiry.student.full_name}
                  </TableCell>
                  <TableCell>
                    <InquiryStatusBadge inquiry={inquiry} showRole={false} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {inquiry.current_step?.role?.name ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              <InquiryStatusBadge inquiry={inquiry} />
            </div>
            <div className="text-sm text-muted-foreground">From {inquiry.student.full_name}</div>
            <div className="line-clamp-1 text-sm text-muted-foreground">{inquiry.body}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

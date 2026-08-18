import { Badge } from '@/components/ui/badge'

export default function InquiryStatusBadge({ inquiry, showRole = true }) {
  if (inquiry.status === 'completed') {
    return <Badge variant="success">Completed</Badge>
  }

  return (
    <Badge variant="warning">
      {showRole ? `Awaiting ${inquiry.current_step?.role?.name ?? '...'}` : 'In progress'}
    </Badge>
  )
}

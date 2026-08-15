import { Badge } from '@/components/ui/badge'

export default function InquiryStatusBadge({ inquiry, showRole = true }) {
  if (inquiry.status === 'completed') {
    return <Badge variant="secondary">Completed</Badge>
  }

  return <Badge>{showRole ? `Awaiting ${inquiry.current_step?.role?.name ?? '...'}` : 'In progress'}</Badge>
}

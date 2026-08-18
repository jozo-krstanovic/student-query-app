import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ACTION_LABELS = {
  submit: 'Submitted',
  approve: 'Approved',
  reset: 'Reset to start',
  resolve: 'Resolved',
}

export default function InquiryHistoryCard({ stepHistory }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stepHistory.map((entry) => (
          <div key={entry.id} className="rounded-lg border bg-muted/40 p-3 text-sm">
            <span className="font-medium">{ACTION_LABELS[entry.action] ?? entry.action}</span>
            {' by '}
            {entry.actor.full_name}
            {entry.chain_step?.role && ` (${entry.chain_step.role.name})`}
            <span className="text-muted-foreground">
              {' — '}
              {new Date(entry.created_at).toLocaleString()}
            </span>
            {entry.note && <div className="mt-1 text-muted-foreground">{entry.note}</div>}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

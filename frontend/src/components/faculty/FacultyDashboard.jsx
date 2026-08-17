import { useState } from 'react'
import { useInquiryQueue } from '@/lib/useInquiryQueue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import LoadingState from '@/components/layout/LoadingState'
import FacultyInquiryList from './FacultyInquiryList'
import FacultyInquiryDetail from './FacultyInquiryDetail'

const QUEUES = [
  {
    value: 'assigned',
    label: 'Assigned to me',
    description: 'Inquiries currently waiting on your review.',
    emptyMessage: 'Nothing awaiting your review right now.',
  },
  {
    value: 'watching',
    label: 'Watching',
    description: "Inquiries in your chain that aren't at your step right now.",
    emptyMessage: 'Nothing to watch right now.',
  },
  {
    value: 'completed',
    label: 'Completed',
    description: 'Inquiries in your chain that have been resolved.',
    emptyMessage: 'No completed inquiries yet.',
  },
]

export default function FacultyDashboard() {
  const [queue, setQueue] = useState('assigned')
  const { view, inquiries, selectedId, loading, error, openDetail, backToList } = useInquiryQueue(
    `/api/faculty/inquiries?queue=${queue}`
  )

  const current = QUEUES.find((q) => q.value === queue)

  return (
    <PageContainer>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {view === 'list' && (
        <>
          <PageHeader title={current.label} description={current.description} />
          <Tabs value={queue} onValueChange={setQueue}>
            <TabsList>
              {QUEUES.map((q) => (
                <TabsTrigger key={q.value} value={q.value}>
                  {q.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {loading ? (
            <LoadingState />
          ) : (
            <FacultyInquiryList inquiries={inquiries} onSelect={openDetail} emptyMessage={current.emptyMessage} />
          )}
        </>
      )}

      {view === 'detail' && <FacultyInquiryDetail inquiryId={selectedId} onBack={backToList} />}
    </PageContainer>
  )
}

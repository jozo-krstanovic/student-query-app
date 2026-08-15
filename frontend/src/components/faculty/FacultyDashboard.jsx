import { useInquiryQueue } from '@/lib/useInquiryQueue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import LoadingState from '@/components/layout/LoadingState'
import FacultyInquiryList from './FacultyInquiryList'
import FacultyInquiryDetail from './FacultyInquiryDetail'

export default function FacultyDashboard() {
  const { view, inquiries, selectedId, loading, error, openDetail, backToList } =
    useInquiryQueue('/api/faculty/inquiries')

  if (loading) {
    return <LoadingState />
  }

  return (
    <PageContainer>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {view === 'list' && (
        <>
          <PageHeader title="Assigned to me" description="Inquiries currently waiting on your review." />
          <FacultyInquiryList inquiries={inquiries} onSelect={openDetail} />
        </>
      )}

      {view === 'detail' && <FacultyInquiryDetail inquiryId={selectedId} onBack={backToList} />}
    </PageContainer>
  )
}

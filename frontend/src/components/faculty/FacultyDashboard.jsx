import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import LoadingState from '@/components/layout/LoadingState'
import FacultyInquiryList from './FacultyInquiryList'
import FacultyInquiryDetail from './FacultyInquiryDetail'

export default function FacultyDashboard() {
  const [view, setView] = useState('list') // 'list' | 'detail'
  const [inquiries, setInquiries] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function refreshList() {
    try {
      const { inquiries } = await apiFetch('/api/faculty/inquiries')
      setInquiries(inquiries)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    refreshList().finally(() => setLoading(false))
  }, [])

  function openDetail(id) {
    setSelectedId(id)
    setView('detail')
  }

  function backToList() {
    setView('list')
    refreshList()
  }

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

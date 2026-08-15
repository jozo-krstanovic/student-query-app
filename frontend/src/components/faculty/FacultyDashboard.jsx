import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
    return <p className="p-8 text-sm text-muted-foreground">Loading...</p>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {view === 'list' && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">Assigned to me</h1>
          <FacultyInquiryList inquiries={inquiries} onSelect={openDetail} />
        </>
      )}

      {view === 'detail' && <FacultyInquiryDetail inquiryId={selectedId} onBack={backToList} />}
    </div>
  )
}

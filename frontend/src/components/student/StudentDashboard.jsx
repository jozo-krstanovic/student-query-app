import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import InquiryList from './InquiryList'
import NewInquiryForm from './NewInquiryForm'
import InquiryDetail from './InquiryDetail'

export default function StudentDashboard() {
  const [view, setView] = useState('list') // 'list' | 'new' | 'detail'
  const [inquiries, setInquiries] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function refreshList() {
    try {
      const { inquiries } = await apiFetch('/api/inquiries')
      setInquiries(inquiries)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const [inquiriesRes, subjectsRes] = await Promise.all([
          apiFetch('/api/inquiries'),
          apiFetch('/api/subjects'),
        ])
        setInquiries(inquiriesRes.inquiries)
        setSubjects(subjectsRes.subjects)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">My inquiries</h1>
            <Button onClick={() => setView('new')}>New inquiry</Button>
          </div>
          <InquiryList inquiries={inquiries} onSelect={openDetail} />
        </>
      )}

      {view === 'new' && (
        <NewInquiryForm
          subjects={subjects}
          onCreated={(inquiry) => {
            setInquiries((prev) => [inquiry, ...prev])
            openDetail(inquiry.id)
          }}
          onCancel={() => setView('list')}
        />
      )}

      {view === 'detail' && <InquiryDetail inquiryId={selectedId} onBack={backToList} />}
    </div>
  )
}

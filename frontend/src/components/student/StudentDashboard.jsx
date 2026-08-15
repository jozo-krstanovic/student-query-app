import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import LoadingState from '@/components/layout/LoadingState'
import InquiryList from './InquiryList'
import NewInquiryForm from './NewInquiryForm'
import InquiryDetail from './InquiryDetail'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { pathname } = useLocation()
  const view = id ? 'detail' : pathname === '/new' ? 'new' : 'list'

  const [inquiries, setInquiries] = useState([])
  const [subjects, setSubjects] = useState([])
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

  function openDetail(inquiryId) {
    navigate(`/${inquiryId}`)
  }

  function backToList() {
    navigate('/')
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
          <PageHeader
            title="My inquiries"
            description="Questions you've submitted and their current status."
            action={<Button onClick={() => navigate('/new')}>New inquiry</Button>}
          />
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
          onCancel={() => navigate('/')}
        />
      )}

      {view === 'detail' && <InquiryDetail inquiryId={id} onBack={backToList} />}
    </PageContainer>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import FacultyInquiryList from '@/components/faculty/FacultyInquiryList'
import FacultyInquiryDetail from '@/components/faculty/FacultyInquiryDetail'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
]

export default function AdminInquiriesPage() {
  const [view, setView] = useState('list')
  const [inquiries, setInquiries] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [viewMode, setViewMode] = useState('card')

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

  const roleOptions = useMemo(() => {
    const roles = new Map()
    for (const inquiry of inquiries) {
      const role = inquiry.current_step?.role
      if (role) roles.set(role.id, role)
    }
    return Array.from(roles.values())
  }, [inquiries])

  const filteredInquiries = inquiries.filter((inquiry) => {
    if (statusFilter !== 'all' && inquiry.status !== statusFilter) return false
    if (roleFilter !== 'all' && String(inquiry.current_step?.role?.id) !== roleFilter) return false
    return true
  })

  if (loading) {
    return <p className="p-8 text-sm text-muted-foreground">Loading...</p>
  }

  return (
    <PageContainer size="xl">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {view === 'list' && (
        <>
          <PageHeader
            title="Inquiries"
            description="Every inquiry across all students and roles."
            action={
              <div className="flex gap-2">
                <div className="flex gap-1 rounded-lg border p-0.5">
                  <Button
                    variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                    size="icon-sm"
                    onClick={() => setViewMode('card')}
                    aria-label="Card view"
                  >
                    <LayoutGrid className="size-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon-sm"
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                  >
                    <List className="size-4" />
                  </Button>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
          />
          <FacultyInquiryList
            inquiries={filteredInquiries}
            onSelect={openDetail}
            layout={viewMode === 'card' ? 'grid' : 'list'}
            emptyMessage="No inquiries match these filters."
          />
        </>
      )}

      {view === 'detail' && <FacultyInquiryDetail inquiryId={selectedId} onBack={backToList} />}
    </PageContainer>
  )
}

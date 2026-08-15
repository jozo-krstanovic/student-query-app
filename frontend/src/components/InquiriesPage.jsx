import { useParams } from 'react-router-dom'
import StudentDashboard from '@/components/student/StudentDashboard'
import FacultyDashboard from '@/components/faculty/FacultyDashboard'
import AdminInquiriesPage from '@/components/admin/AdminInquiriesPage'
import NotFoundPage from '@/components/NotFoundPage'
import { useSession } from '@/lib/SessionContext'

export default function InquiriesPage() {
  const { profile } = useSession()
  const { id } = useParams()

  // /:id matches any single path segment, so a genuinely bogus URL like
  // /xyz would otherwise fall through to a dashboard, which would try to
  // fetch it as an inquiry and show an API error instead of a 404. A
  // numeric id that just doesn't exist still goes through the normal
  // fetch-and-show-error path below, same as any other missing record.
  if (id && !/^\d+$/.test(id)) {
    return <NotFoundPage />
  }

  if (profile.user_type === 'superuser') {
    return <AdminInquiriesPage />
  }
  if (profile.user_type === 'faculty') {
    return <FacultyDashboard />
  }
  return <StudentDashboard />
}

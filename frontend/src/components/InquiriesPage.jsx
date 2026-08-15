import StudentDashboard from '@/components/student/StudentDashboard'
import FacultyDashboard from '@/components/faculty/FacultyDashboard'
import AdminInquiriesPage from '@/components/admin/AdminInquiriesPage'
import { useSession } from '@/lib/SessionContext'

export default function InquiriesPage() {
  const { profile } = useSession()

  if (profile.user_type === 'superuser') {
    return <AdminInquiriesPage />
  }
  if (profile.user_type === 'faculty') {
    return <FacultyDashboard />
  }
  return <StudentDashboard />
}

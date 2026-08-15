import AdminPanel from '@/components/admin/AdminPanel'
import StudentDashboard from '@/components/student/StudentDashboard'
import FacultyDashboard from '@/components/faculty/FacultyDashboard'
import { useSession } from '@/lib/SessionContext'

export default function Dashboard() {
  const { profile } = useSession()

  if (profile.user_type === 'superuser') {
    return <AdminPanel />
  }
  if (profile.user_type === 'faculty') {
    return <FacultyDashboard />
  }
  return <StudentDashboard />
}

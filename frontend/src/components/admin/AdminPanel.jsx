import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import LoadingState from '@/components/layout/LoadingState'
import RolesTab from './RolesTab'
import ChainsTab from './ChainsTab'
import SubjectsTab from './SubjectsTab'
import UsersTab from './UsersTab'

export default function AdminPanel() {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [chains, setChains] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [rolesRes, permissionsRes, subjectsRes, chainsRes, usersRes] = await Promise.all([
          apiFetch('/api/admin/roles'),
          apiFetch('/api/admin/permissions'),
          apiFetch('/api/admin/subjects'),
          apiFetch('/api/admin/chains'),
          apiFetch('/api/admin/users'),
        ])
        setRoles(rolesRes.roles)
        setPermissions(permissionsRes.permissions)
        setSubjects(subjectsRes.subjects)
        setChains(chainsRes.chains)
        setUsers(usersRes.users)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <LoadingState message="Loading admin data..." />
  }

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Admin"
        description="Manage roles, permissions, approval chains, subjects, and users."
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="chains">Chains</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="roles">
          <RolesTab roles={roles} setRoles={setRoles} permissions={permissions} setError={setError} />
        </TabsContent>
        <TabsContent value="chains">
          <ChainsTab chains={chains} setChains={setChains} roles={roles} setError={setError} />
        </TabsContent>
        <TabsContent value="subjects">
          <SubjectsTab subjects={subjects} setSubjects={setSubjects} chains={chains} setError={setError} />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab users={users} setUsers={setUsers} roles={roles} setError={setError} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}

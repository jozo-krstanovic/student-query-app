import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import RolesTab from './RolesTab'
import ChainsTab from './ChainsTab'
import SubjectsTab from './SubjectsTab'

export default function AdminPanel() {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [chains, setChains] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [rolesRes, permissionsRes, subjectsRes, chainsRes] = await Promise.all([
          apiFetch('/api/admin/roles'),
          apiFetch('/api/admin/permissions'),
          apiFetch('/api/admin/subjects'),
          apiFetch('/api/admin/chains'),
        ])
        setRoles(rolesRes.roles)
        setPermissions(permissionsRes.permissions)
        setSubjects(subjectsRes.subjects)
        setChains(chainsRes.chains)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <p className="p-8 text-sm text-muted-foreground">Loading admin data...</p>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Manage roles, permissions, approval chains, and subjects.
        </p>
      </div>

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
      </Tabs>
    </div>
  )
}

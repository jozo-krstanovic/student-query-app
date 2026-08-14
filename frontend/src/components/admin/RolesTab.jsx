import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function RolesTab({ roles, setRoles, permissions, setError }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { role } = await apiFetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description || null }),
      })
      setRoles((prev) => [...prev, role])
      setName('')
      setDescription('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTogglePermission(role, permissionId, checked) {
    const currentIds = role.permissions.map((p) => p.id)
    const nextIds = checked
      ? [...currentIds, permissionId]
      : currentIds.filter((id) => id !== permissionId)

    setError(null)
    try {
      const { role: updatedRole } = await apiFetch(`/api/admin/roles/${role.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission_ids: nextIds }),
      })
      setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>Faculty roles and the permissions granted to each.</CardDescription>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  {permissions.map((permission) => (
                    <TableHead key={permission.id} className="text-center">
                      {permission.key}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="font-medium">{role.name}</div>
                      {role.description && (
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                      )}
                    </TableCell>
                    {permissions.map((permission) => (
                      <TableCell key={permission.id} className="text-center">
                        <Checkbox
                          checked={role.permissions.some((p) => p.id === permission.id)}
                          onCheckedChange={(checked) =>
                            handleTogglePermission(role, permission.id, checked)
                          }
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add role</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Name</Label>
              <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Input
                id="role-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Adding...' : 'Add role'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

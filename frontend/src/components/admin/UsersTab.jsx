import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const USER_TYPES = ['student', 'faculty', 'superuser']

export default function UsersTab({ users, setUsers, roles, setError }) {
  const [drafts, setDrafts] = useState({}) // userId -> { user_type, role_id }
  const [savingId, setSavingId] = useState(null)

  function getDraft(user) {
    return drafts[user.id] ?? { user_type: user.user_type, role_id: user.role_id }
  }

  function isDirty(user) {
    const draft = drafts[user.id]
    if (!draft) return false
    return draft.user_type !== user.user_type || draft.role_id !== user.role_id
  }

  function handleTypeChange(user, newType) {
    const current = getDraft(user)
    setDrafts((prev) => ({
      ...prev,
      [user.id]: {
        user_type: newType,
        role_id: newType === 'faculty' ? current.role_id : null,
      },
    }))
  }

  function handleRoleChange(user, roleId) {
    const current = getDraft(user)
    setDrafts((prev) => ({ ...prev, [user.id]: { ...current, role_id: roleId } }))
  }

  async function handleSave(user) {
    const draft = getDraft(user)
    setError(null)
    setSavingId(user.id)
    try {
      const { user: updated } = await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_type: draft.user_type,
          role_id: draft.user_type === 'faculty' ? draft.role_id : null,
        }),
      })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[user.id]
        return next
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Change a user's type and, for faculty, their role.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Role</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const draft = getDraft(user)
              const canSave =
                isDirty(user) && !(draft.user_type === 'faculty' && !draft.role_id)

              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Select value={draft.user_type} onValueChange={(v) => handleTypeChange(user, v)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {draft.user_type === 'faculty' ? (
                      <Select
                        value={draft.role_id ? String(draft.role_id) : ''}
                        onValueChange={(v) => handleRoleChange(user, Number(v))}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select role..." />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={String(role.id)}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      disabled={!canSave || savingId === user.id}
                      onClick={() => handleSave(user)}
                    >
                      {savingId === user.id ? 'Saving...' : 'Save'}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

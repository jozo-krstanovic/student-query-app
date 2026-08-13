import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

export default function AdminPanel() {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [chains, setChains] = useState([])
  const [error, setError] = useState(null)

  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')

  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectDescription, setNewSubjectDescription] = useState('')
  const [newSubjectChainId, setNewSubjectChainId] = useState('')

  const [newChainName, setNewChainName] = useState('')
  const [newChainDescription, setNewChainDescription] = useState('')
  const [newChainSteps, setNewChainSteps] = useState([{ role_id: '', label: '' }])

  async function refresh() {
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
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleCreateRole(e) {
    e.preventDefault()
    setError(null)
    try {
      const { role } = await apiFetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleName, description: newRoleDescription || null }),
      })
      setRoles((prev) => [...prev, role])
      setNewRoleName('')
      setNewRoleDescription('')
    } catch (err) {
      setError(err.message)
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

  async function handleCreateSubject(e) {
    e.preventDefault()
    setError(null)
    try {
      const { subject } = await apiFetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubjectName,
          description: newSubjectDescription || null,
          chain_id: newSubjectChainId || null,
        }),
      })
      setSubjects((prev) => [...prev, subject])
      setNewSubjectName('')
      setNewSubjectDescription('')
      setNewSubjectChainId('')
    } catch (err) {
      setError(err.message)
    }
  }

  function updateStep(index, field, value) {
    setNewChainSteps((steps) =>
      steps.map((step, i) => (i === index ? { ...step, [field]: value } : step)),
    )
  }

  function addStep() {
    setNewChainSteps((steps) => [...steps, { role_id: '', label: '' }])
  }

  function removeStep(index) {
    setNewChainSteps((steps) => steps.filter((_, i) => i !== index))
  }

  async function handleCreateChain(e) {
    e.preventDefault()
    setError(null)
    try {
      const { chain } = await apiFetch('/api/admin/chains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChainName,
          description: newChainDescription || null,
          steps: newChainSteps.map((step) => ({
            role_id: step.role_id,
            label: step.label || null,
          })),
        }),
      })
      setChains((prev) => [...prev, chain])
      setNewChainName('')
      setNewChainDescription('')
      setNewChainSteps([{ role_id: '', label: '' }])
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="admin">
      <h1>Admin</h1>
      {error && <p className="error">{error}</p>}

      <section>
        <h2>Roles</h2>
        <ul>
          {roles.map((role) => (
            <li key={role.id}>
              <strong>{role.name}</strong>
              {role.description && <span> — {role.description}</span>}
              <div>
                {permissions.map((permission) => (
                  <label key={permission.id} style={{ marginRight: '1em' }}>
                    <input
                      type="checkbox"
                      checked={role.permissions.some((p) => p.id === permission.id)}
                      onChange={(e) =>
                        handleTogglePermission(role, permission.id, e.target.checked)
                      }
                    />
                    {permission.key}
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={handleCreateRole}>
          <input
            placeholder="Role name"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            required
          />
          <input
            placeholder="Description"
            value={newRoleDescription}
            onChange={(e) => setNewRoleDescription(e.target.value)}
          />
          <button type="submit">Add role</button>
        </form>
      </section>

      <section>
        <h2>Approval chains</h2>
        <ul>
          {chains.map((chain) => (
            <li key={chain.id}>
              <strong>{chain.name}</strong>
              <ol>
                {chain.steps.map((step) => (
                  <li key={step.id}>
                    {step.role.name}
                    {step.label && ` (${step.label})`}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
        <form onSubmit={handleCreateChain}>
          <input
            placeholder="Chain name"
            value={newChainName}
            onChange={(e) => setNewChainName(e.target.value)}
            required
          />
          <input
            placeholder="Description"
            value={newChainDescription}
            onChange={(e) => setNewChainDescription(e.target.value)}
          />
          {newChainSteps.map((step, index) => (
            <div key={index}>
              <select
                value={step.role_id}
                onChange={(e) => updateStep(index, 'role_id', e.target.value)}
                required
              >
                <option value="">Select role...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="Step label (optional)"
                value={step.label}
                onChange={(e) => updateStep(index, 'label', e.target.value)}
              />
              {newChainSteps.length > 1 && (
                <button type="button" onClick={() => removeStep(index)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addStep}>
            Add step
          </button>
          <button type="submit">Create chain</button>
        </form>
      </section>

      <section>
        <h2>Subjects</h2>
        <ul>
          {subjects.map((subject) => (
            <li key={subject.id}>
              <strong>{subject.name}</strong>
              {subject.chain ? ` — chain: ${subject.chain.name}` : ' — no chain assigned'}
            </li>
          ))}
        </ul>
        <form onSubmit={handleCreateSubject}>
          <input
            placeholder="Subject name"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            required
          />
          <input
            placeholder="Description"
            value={newSubjectDescription}
            onChange={(e) => setNewSubjectDescription(e.target.value)}
          />
          <select
            value={newSubjectChainId}
            onChange={(e) => setNewSubjectChainId(e.target.value)}
          >
            <option value="">No chain yet</option>
            {chains.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
          <button type="submit">Add subject</button>
        </form>
      </section>
    </div>
  )
}

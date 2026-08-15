import { useState } from 'react'
import { X } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ChainsTab({ chains, setChains, roles, setError }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState([{ role_id: '', label: '' }])
  const [submitting, setSubmitting] = useState(false)

  function updateStep(index, field, value) {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, [field]: value } : step)))
  }

  function addStep() {
    setSteps((prev) => [...prev, { role_id: '', label: '' }])
  }

  function removeStep(index) {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { chain } = await apiFetch('/api/admin/chains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          steps: steps.map((step) => ({ role_id: step.role_id, label: step.label || null })),
        }),
      })
      setChains((prev) => [...prev, chain])
      setName('')
      setDescription('')
      setSteps([{ role_id: '', label: '' }])
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Approval chains</CardTitle>
          <CardDescription>Ordered sequences of roles an inquiry must pass through.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {chains.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chains yet.</p>
          ) : (
            chains.map((chain) => (
              <div key={chain.id} className="rounded-lg border p-4">
                <div className="font-medium">{chain.name}</div>
                {chain.description && (
                  <div className="mb-2 text-xs text-muted-foreground">{chain.description}</div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {chain.steps.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {i + 1}. {step.role.name}
                        {step.label && ` — ${step.label}`}
                      </Badge>
                      {i < chain.steps.length - 1 && <span className="text-muted-foreground">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add chain</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chain-name">Name</Label>
              <Input id="chain-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chain-description">Description</Label>
              <Input
                id="chain-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>Steps</Label>
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select value={step.role_id} onValueChange={(value) => updateStep(index, 'role_id', value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Label (optional)"
                    value={step.label}
                    onChange={(e) => updateStep(index, 'label', e.target.value)}
                    className="flex-1"
                  />
                  {steps.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(index)}>
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                Add step
              </Button>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Creating...' : 'Create chain'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

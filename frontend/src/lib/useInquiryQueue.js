import { useEffect, useState } from 'react'
import { apiFetch } from './api'

export function useInquiryQueue(endpoint) {
  const [view, setView] = useState('list')
  const [inquiries, setInquiries] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function refreshList() {
    try {
      const { inquiries } = await apiFetch(endpoint)
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

  return { view, inquiries, selectedId, loading, error, setError, openDetail, backToList }
}

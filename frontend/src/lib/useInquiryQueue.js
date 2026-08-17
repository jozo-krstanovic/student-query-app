import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from './api'

export function useInquiryQueue(endpoint) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [inquiries, setInquiries] = useState([])
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
    setLoading(true)
    refreshList().finally(() => setLoading(false))
  }, [endpoint])

  function openDetail(inquiryId) {
    navigate(`/${inquiryId}`)
  }

  function backToList() {
    navigate('/')
    refreshList()
  }

  return {
    view: id ? 'detail' : 'list',
    inquiries,
    selectedId: id,
    loading,
    error,
    setError,
    openDetail,
    backToList,
  }
}

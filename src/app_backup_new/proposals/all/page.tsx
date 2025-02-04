'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { HiOutlineEye, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch } from 'react-icons/hi'
import { useRouter } from 'next/navigation'

interface Proposal {
  id: string
  customerName: string
  projectName: string
  totalAmount: number
  date: string
  createdBy: string
  description: string
  status: string
}

export default function AllProposalsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createdByFilter, setCreatedByFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Teklifleri yükle
  useEffect(() => {
    fetchProposals()
  }, [])

  const fetchProposals = async () => {
    try {
      const response = await fetch('/api/proposals')
      if (!response.ok) throw new Error('Teklifler yüklenemedi')
      const data = await response.json()
      setProposals(data)
      setError('')
    } catch (err) {
      setError('Teklifler yüklenirken bir hata oluştu')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Açıklama güncelleme
  const handleDescriptionChange = async (id: string, value: string) => {
    try {
      const response = await fetch(`/api/proposals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: value })
      })
      
      if (!response.ok) throw new Error('Açıklama güncellenemedi')
      
      setProposals(proposals.map(proposal =>
        proposal.id === id ? { ...proposal, description: value } : proposal
      ))
    } catch (err) {
      console.error(err)
      // Hata durumunda kullanıcıya bilgi verilebilir
    }
  }

  // Teklif silme
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu teklifi silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/proposals/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Teklif silinemedi')
      
      setProposals(proposals.filter(proposal => proposal.id !== id))
    } catch (err) {
      console.error(err)
      // Hata durumunda kullanıcıya bilgi verilebilir
    }
  }

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = 
      proposal.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter
    const matchesCreator = createdByFilter === 'all' || proposal.createdBy === createdByFilter
    const matchesDateRange = (!startDate || new Date(proposal.date) >= new Date(startDate)) &&
                            (!endDate || new Date(proposal.date) <= new Date(endDate))
    return matchesSearch && matchesStatus && matchesCreator && matchesDateRange
  })

  // Benzersiz oluşturanları al
  const creators = Array.from(new Set(proposals.map(p => p.createdBy)))

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">Yükleniyor...</div>
      </main>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center text-red-600">{error}</div>
      </main>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900">Tüm Teklifler</h1>
          
          {/* Filtreleme ve Arama */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Arama */}
            <div className="relative">
              <input
                type="text"
                placeholder="Müşteri veya proje adı ile ara..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <HiOutlineSearch className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            </div>

            {/* Durum Filtresi */}
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tüm Durumlar</option>
              {['Taslak', 'Onaylı', 'Fatura Bekliyor', 'Faturalandı'].map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            {/* Oluşturan Filtresi */}
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={createdByFilter}
              onChange={(e) => setCreatedByFilter(e.target.value)}
            >
              <option value="all">Tüm Oluşturanlar</option>
              {creators.map(creator => (
                <option key={creator} value={creator}>{creator}</option>
              ))}
            </select>

            {/* Tarih Aralığı */}
            <div className="flex space-x-2">
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Tablo */}
          <div className="mt-6 bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri Adı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proje Adı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Genel Toplam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProposals.map((proposal) => (
                  <tr key={proposal.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proposal.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proposal.projectName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(proposal.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(proposal.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proposal.createdBy}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={proposal.description}
                        onChange={(e) => handleDescriptionChange(proposal.id, e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${proposal.status === 'Onaylı' ? 'bg-green-100 text-green-800' :
                          proposal.status === 'Taslak' ? 'bg-yellow-100 text-yellow-800' :
                          proposal.status === 'Fatura Bekliyor' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {proposal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => router.push(`/proposals/${proposal.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <HiOutlineEye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => router.push(`/proposals/${proposal.id}/edit`)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <HiOutlinePencil className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(proposal.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <HiOutlineTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
} 
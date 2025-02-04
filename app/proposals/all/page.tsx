'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { HiOutlineEye, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch } from 'react-icons/hi'
import { useRouter, useSearchParams } from 'next/navigation'

interface Proposal {
  id: string
  customerName: string
  projectName: string
  totalAmount: number
  date: string
  createdBy: string
  description: string
  status: string
  showTotal: boolean
}

interface ProposalNote {
  note: string;
  updatedAt: string;
}

interface Notes {
  [key: string]: ProposalNote;
}

function formatPrice(price: number): string {
  return `₺${price.toLocaleString('tr-TR', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

export default function AllProposalsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [createdByFilter, setCreatedByFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [notes, setNotes] = useState<Notes>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proposalsRes, notesRes] = await Promise.all([
          fetch('/api/proposals'),
          fetch('/api/proposal-notes')
        ])
        
        const proposalsData = await proposalsRes.json()
        const notesData = await notesRes.json()
        
        setProposals(proposalsData)
        setNotes(notesData)
        setError('')
      } catch (error) {
        console.error('Veri yüklenirken hata:', error)
        setError('Teklifler yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
    }
  }

  // Durum güncelleme fonksiyonu
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/proposals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) throw new Error('Durum güncellenemedi')
      
      // Önce mevcut teklifleri güncelle
      setProposals(proposals.map(proposal =>
        proposal.id === id ? { ...proposal, status: newStatus } : proposal
      ))
      
      // Duruma göre yönlendirme yap
      router.push(`/proposals/all?status=${encodeURIComponent(newStatus)}`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleNoteChange = async (proposalId: string, note: string) => {
    try {
      const response = await fetch('/api/proposal-notes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proposalId, note })
      })

      if (!response.ok) throw new Error('Not güncellenemedi')

      const updatedNote = await response.json()
      setNotes(prev => ({
        ...prev,
        [proposalId]: updatedNote
      }))
    } catch (error) {
      console.error('Not güncellenirken hata:', error)
    }
  }

  const filteredProposals = proposals.filter((proposal: Proposal) => {
    // Türkçe karakterleri ve büyük/küçük harf duyarlılığını kaldır
    const normalizeText = (text: string | null | undefined): string => {
      if (!text) return '';
      return text
        .toString()
        .toLowerCase() // Tüm metni küçük harfe çevir
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .trim();
    }

    // Önce müşteri filtresini kontrol et
    if (customerFilter !== 'all' && proposal.customerName !== customerFilter) {
      return false;
    }

    const searchTermNormalized = normalizeText(searchTerm)
    const customerNameNormalized = normalizeText(proposal.customerName)
    const projectNameNormalized = normalizeText(proposal.projectName)

    // Boş arama terimi varsa diğer filtrelere geç
    if (!searchTermNormalized) {
      return (
        (createdByFilter === 'all' || proposal.createdBy === createdByFilter) &&
        (!startDate || new Date(proposal.date) >= new Date(startDate)) &&
        (!endDate || new Date(proposal.date) <= new Date(endDate)) &&
        (!searchParams.get('status') || proposal.status === searchParams.get('status'))
      );
    }

    // Arama terimini boşluklara göre ayır ve her bir kelime için kontrol et
    const searchWords = searchTermNormalized.split(/\s+/).filter(word => word.length > 0);
    
    const matchesSearch = searchWords.every(word => {
      const normalizedWord = normalizeText(word);
      return customerNameNormalized.includes(normalizedWord) || 
             projectNameNormalized.includes(normalizedWord);
    });

    return matchesSearch && 
           (createdByFilter === 'all' || proposal.createdBy === createdByFilter) &&
           (!startDate || new Date(proposal.date) >= new Date(startDate)) &&
           (!endDate || new Date(proposal.date) <= new Date(endDate)) &&
           (!searchParams.get('status') || proposal.status === searchParams.get('status'));
  })

  // Benzersiz oluşturanları al
  const creators = Array.from(new Set(proposals.map(p => p.createdBy))).sort()
  // Benzersiz müşterileri al ve sırala
  const customers = Array.from(new Set(proposals.map(p => p.customerName))).sort()

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
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              {searchParams.get('status') === 'Taslak' ? 'Taslak Teklifler' :
               searchParams.get('status') === 'Onaylı' ? 'Onaylı Teklifler' :
               searchParams.get('status') === 'Reddedildi' ? 'Reddedilen Teklifler' :
               searchParams.get('status') === 'Fatura Bekliyor' ? 'Fatura Bekleyen Teklifler' :
               searchParams.get('status') === 'Faturalandı' ? 'Faturalanan Teklifler' :
               'Tüm Teklifler'}
            </h1>
            <button
              onClick={() => router.push('/proposals/add')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Teklif Ekle
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Filtreleme ve Arama */}
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Müşteri veya proje adı ile ara..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <HiOutlineSearch className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          </div>

          {/* Müşteri Filtresi */}
          <select
            className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          >
            <option value="all">Tüm Müşteriler</option>
            {customers.map((customer, index) => (
              <option key={`customer-${index}`} value={customer}>
                {customer}
              </option>
            ))}
          </select>

          {/* Oluşturan Filtresi */}
          <select
            className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={createdByFilter}
            onChange={(e) => setCreatedByFilter(e.target.value)}
          >
            <option value="all">Tüm Oluşturanlar</option>
            {creators.map((creator, index) => (
              <option key={`creator-${index}`} value={creator}>{creator}</option>
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
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri Adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[200px]">Proje Adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Tutar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Not</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProposals.map((proposal) => (
                <tr key={`proposal-${proposal.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proposal.customerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-[200px] break-words">{proposal.projectName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {proposal.showTotal ? formatPrice(proposal.totalAmount) : formatPrice(0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(proposal.date).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={proposal.status}
                      onChange={(e) => handleStatusChange(proposal.id, e.target.value)}
                      className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      {['Taslak', 'Onaylı', 'Reddedildi', 'Fatura Bekliyor', 'Faturalandı'].map((status, index) => (
                        <option key={`status-${proposal.id}-${index}-${status}`} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                    <textarea
                      value={notes[proposal.id]?.note || ''}
                      onChange={(e) => handleNoteChange(proposal.id, e.target.value)}
                      className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[38px] resize-none"
                      placeholder="Not ekle..."
                      rows={2}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proposal.createdBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => router.push(`/proposals/${proposal.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <HiOutlineEye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => router.push(`/proposals/${proposal.id}/edit`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <HiOutlinePencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(proposal.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <HiOutlineTrash className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { HiOutlineSearch } from 'react-icons/hi'

interface Service {
  totalPrice?: number
  price?: number
  quantity?: number
  days?: number
}

interface Category {
  services: Service[]
}

interface Topic {
  categories: Category[]
}

interface Proposal {
  id: string
  customerName: string
  projectName: string
  date: string
  status: string
  totalAmount?: number
  topics?: Topic[]
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

// Toplam tutarı hesapla
const calculateTotalAmount = (proposal: Proposal): number => {
  if (proposal.totalAmount) return proposal.totalAmount
  
  let total = 0
  proposal.topics?.forEach(topic => {
    topic.categories?.forEach(category => {
      category.services?.forEach(service => {
        if (service.totalPrice) {
          total += service.totalPrice
        } else if (service.price && service.quantity && service.days) {
          total += service.price * service.quantity * service.days
        }
      })
    })
  })
  return total
}

// Para birimi formatla
const formatAmount = (proposal: Proposal) => {
  const amount = calculateTotalAmount(proposal)
  return `${amount.toLocaleString('tr-TR')} ₺`
}

export default function DraftProposalsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await fetch('/api/proposals')
        if (!response.ok) throw new Error('Teklifler yüklenemedi')
        const data = await response.json()
        // Sadece taslak teklifleri filtrele
        setProposals(data.filter((p: Proposal) => p.status === 'Taslak'))
        setError('')
      } catch (err) {
        setError('Teklifler yüklenirken bir hata oluştu')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProposals()
  }, [])

  const filteredProposals = proposals.filter(proposal =>
    proposal.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Yükleniyor...</div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">{error}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Taslak Teklifler</h1>
          <Link
            href="/proposals/add"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Yeni Teklif Oluştur
          </Link>
        </div>

        {/* Arama */}
        <div className="mb-6">
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
        </div>

        {/* Teklifler Tablosu */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proje
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oluşturan
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {proposal.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {proposal.projectName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(proposal.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(proposal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {proposal.createdBy || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/proposals/${proposal.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Görüntüle
                      </Link>
                      <Link
                        href={`/proposals/${proposal.id}/edit`}
                        className="text-green-600 hover:text-green-900"
                      >
                        Düzenle
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredProposals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      Taslak teklif bulunamadı
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
} 
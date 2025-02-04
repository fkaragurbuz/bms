'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'

interface Proposal {
  id: string
  customerName: string
  projectName: string
  date: string
  status: string
  totalAmount: number
  description?: string
  createdBy: string
}

export default function ProposalsByStatusPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const status = searchParams.get('status')

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await fetch('/api/proposals')
        if (!response.ok) throw new Error('Teklifler yüklenemedi')
        const data = await response.json()
        // Filter proposals based on status
        const filteredProposals = status ? data.filter((p: Proposal) => p.status === status) : data
        setProposals(filteredProposals)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProposals()
  }, [status])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">Yükleniyor...</div>
        </main>
      </div>
    )
  }

  const statusTitles: { [key: string]: string } = {
    'Taslak': 'Taslak Teklifler',
    'Onaylı': 'Onaylı Teklifler',
    'Reddedildi': 'Reddedilen Teklifler',
    'Fatura Bekliyor': 'Faturası Kesilecek Teklifler',
    'Faturalandı': 'Faturası Kesilen Teklifler'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          {status ? statusTitles[status] : 'Tüm Teklifler'}
        </h1>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Müşteri Adı
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proje Adı
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutar
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">İşlemler</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proposals.map((proposal) => (
                <tr key={proposal.id}>
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
                    ₺{proposal.totalAmount.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${proposal.status === 'Onaylı' ? 'bg-green-100 text-green-800' : 
                      proposal.status === 'Reddedildi' ? 'bg-red-100 text-red-800' : 
                      proposal.status === 'Taslak' ? 'bg-yellow-100 text-yellow-800' :
                      proposal.status === 'Fatura Bekliyor' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'}`}>
                      {proposal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={`/proposals/${proposal.id}`} className="text-indigo-600 hover:text-indigo-900">
                      Görüntüle
                    </a>
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
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  showTotal: boolean
  createdAt?: string
  updatedAt?: string
}

function formatPrice(price: number): string {
  return `₺${price.toLocaleString('tr-TR', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await fetch('/api/proposals')
        if (!response.ok) throw new Error('Teklifler yüklenemedi')
        const data = await response.json()
        
        // Teklifleri tarihe göre sırala
        const sortedData = data.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.date)
          const dateB = new Date(b.createdAt || b.date)
          return dateB.getTime() - dateA.getTime()
        })
        
        setProposals(sortedData)
      } catch (err) {
        console.error(err)
        setError('Teklifler yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchProposals()
  }, [])

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link href="/proposals/add" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 text-blue-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-base font-bold text-gray-900">Yeni Teklif</span>
            </div>
          </Link>

          <Link href="/proposals/all?status=Taslak" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 text-yellow-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span className="text-base font-bold text-gray-900">Taslak</span>
              <span className="text-sm text-gray-600 mt-1">{proposals.filter(p => p.status === 'Taslak').length}</span>
            </div>
          </Link>

          <Link href="/proposals/all?status=Onaylı" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 text-green-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-base font-bold text-gray-900">Onaylı</span>
              <span className="text-sm text-gray-600 mt-1">{proposals.filter(p => p.status === 'Onaylı').length}</span>
            </div>
          </Link>

          <Link href="/proposals/all?status=Reddedildi" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-base font-bold text-gray-900">Reddedildi</span>
              <span className="text-sm text-gray-600 mt-1">{proposals.filter(p => p.status === 'Reddedildi').length}</span>
            </div>
          </Link>

          <Link href="/proposals/all?status=Fatura Bekliyor" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 text-orange-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-base font-bold text-gray-900">Fatura Bekliyor</span>
              <span className="text-sm text-gray-600 mt-1">{proposals.filter(p => p.status === 'Fatura Bekliyor').length}</span>
            </div>
          </Link>

          <Link href="/proposals/all?status=Faturalandı" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 text-blue-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              <span className="text-base font-bold text-gray-900">Faturalandı</span>
              <span className="text-sm text-gray-600 mt-1">{proposals.filter(p => p.status === 'Faturalandı').length}</span>
            </div>
          </Link>

          <Link href="/proposals/all" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="text-base font-bold text-gray-900">Tüm Teklifler</span>
              <span className="text-sm text-gray-600 mt-1">{proposals.length}</span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
} 
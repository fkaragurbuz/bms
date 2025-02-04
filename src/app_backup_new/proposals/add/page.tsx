'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

interface RateCard {
  id: string
  customerName: string
}

export default function AddProposalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rateCards, setRateCards] = useState<RateCard[]>([])
  
  const [selectedCustomerType, setSelectedCustomerType] = useState('existing') // 'existing' veya 'new'
  const [selectedRateCard, setSelectedRateCard] = useState('')
  const [newCustomerName, setNewCustomerName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [proposalDate, setProposalDate] = useState(new Date().toISOString().split('T')[0])
  const [showTerms, setShowTerms] = useState(false)
  const [termsText, setTermsText] = useState(`Teklif Şartları:
1.  Teklifte yer alan tüm fiyatlar KDV hariç Türk Lirası olarak hazırlanmıştır.
2.  Teklif, geçerlilik süresi sonuna kadar geçerlidir.
3.  Ödeme, işin bitimini takip eden 30 (Otuz) takvim günü içerisinde toplam tutarın tamamı olarak gerçekleştirilecektir.`)

  // Rate Card'ları yükle
  useEffect(() => {
    const fetchRateCards = async () => {
      try {
        const response = await fetch('/api/ratecards')
        if (!response.ok) throw new Error('Rate cardlar yüklenemedi')
        const data = await response.json()
        setRateCards(data)
        setError('')
      } catch (err) {
        setError('Rate cardlar yüklenirken bir hata oluştu')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchRateCards()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const customerName = selectedCustomerType === 'existing' 
        ? rateCards.find(rc => rc.id === selectedRateCard)?.customerName 
        : newCustomerName

      if (!customerName) {
        setError('Lütfen müşteri adını girin')
        return
      }

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          projectName,
          date: proposalDate,
          status: 'Taslak',
          totalAmount: 0,
          description: '',
          terms: termsText,
          createdBy: 'Test User', // Bu kısım auth sisteminden gelecek
          rateCardId: selectedCustomerType === 'existing' ? selectedRateCard : null
        })
      })

      if (!response.ok) throw new Error('Teklif oluşturulamadı')

      const newProposal = await response.json()
      router.push(`/proposals/${newProposal.id}/edit`)
    } catch (err) {
      setError('Teklif oluşturulurken bir hata oluştu')
      console.error(err)
    }
  }

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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">Yeni Teklif Oluştur</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {/* Müşteri Seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Müşteri Tipi
              </label>
              <div className="flex gap-4 mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="customerType"
                    value="existing"
                    checked={selectedCustomerType === 'existing'}
                    onChange={(e) => setSelectedCustomerType(e.target.value)}
                  />
                  <span className="ml-2">Mevcut Müşteri</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="customerType"
                    value="new"
                    checked={selectedCustomerType === 'new'}
                    onChange={(e) => setSelectedCustomerType(e.target.value)}
                  />
                  <span className="ml-2">Yeni Müşteri</span>
                </label>
              </div>

              {selectedCustomerType === 'existing' ? (
                <select
                  value={selectedRateCard}
                  onChange={(e) => setSelectedRateCard(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">Müşteri Seçin</option>
                  {rateCards.map((rc) => (
                    <option key={rc.id} value={rc.id}>
                      {rc.customerName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Müşteri Adı"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              )}
            </div>

            {/* Proje Adı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proje Adı
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>

            {/* Teklif Tarihi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teklif Tarihi
              </label>
              <input
                type="date"
                value={proposalDate}
                onChange={(e) => setProposalDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>

            {/* Teklif Şartları */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="showTerms"
                  checked={showTerms}
                  onChange={(e) => setShowTerms(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showTerms" className="text-sm font-medium text-gray-700">
                  Teklif Şartları
                </label>
              </div>
              
              {showTerms && (
                <textarea
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                  rows={6}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Teklif Oluştur
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'

interface Service {
  id: string
  name: string
  price: string
}

interface Category {
  id: string
  name: string
  services: Service[]
}

interface RateCard {
  id: string
  customerName: string
  startDate: string
  endDate: string
  categories: Category[]
  createdBy: {
    id: number
    name: string
    email: string
    role: string
  }
  createdAt: string
  updatedAt: string
}

export default function ViewRateCardPage() {
  const router = useRouter()
  const params = useParams()
  const [rateCard, setRateCard] = useState<RateCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRateCard = async () => {
      try {
        const response = await fetch(`/api/ratecards/${params.id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Rate card yüklenirken bir hata oluştu')
        }

        setRateCard(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRateCard()
  }, [params.id])

  const handleExportExcel = async () => {
    try {
      const response = await fetch(`/api/ratecards/${params.id}/export`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Excel dosyası oluşturulamadı')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rate-card-${rateCard?.customerName}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Yükleniyor...</div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-red-500">{error}</div>
        </div>
      </>
    )
  }

  if (!rateCard) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div>Rate card bulunamadı</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Üst Bilgiler */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{rateCard.customerName}</h1>
              <div className="text-sm text-gray-500">
                <p>Oluşturan: {rateCard.createdBy.name}</p>
                <p>Oluşturulma: {new Date(rateCard.createdAt).toLocaleDateString('tr-TR')}</p>
                <p>Son Güncelleme: {new Date(rateCard.updatedAt).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            <div className="text-sm">
              <div className="mb-2">
                <span className="font-semibold">Başlangıç Tarihi:</span>{' '}
                {new Date(rateCard.startDate).toLocaleDateString('tr-TR')}
              </div>
              <div>
                <span className="font-semibold">Bitiş Tarihi:</span>{' '}
                {new Date(rateCard.endDate).toLocaleDateString('tr-TR')}
              </div>
            </div>
          </div>
        </div>

        {/* Kategoriler ve Hizmetler */}
        <div className="space-y-6">
          {rateCard.categories.map((category) => (
            <div key={category.id} className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{category.name}</h2>
              {category.services.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hizmet
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fiyat
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {category.services.map((service) => (
                        <tr key={service.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {service.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {new Intl.NumberFormat('tr-TR', {
                              style: 'currency',
                              currency: 'TRY'
                            }).format(Number(service.price))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Bu kategoride henüz hizmet bulunmuyor</p>
              )}
            </div>
          ))}
        </div>

        {/* Düzenle ve Geri Dön Butonları */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={() => router.push('/ratecards')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Geri Dön
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Excel Olarak İndir
          </button>
          <button
            onClick={() => router.push(`/ratecards/${rateCard.id}/edit`)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Düzenle
          </button>
        </div>
      </div>
    </>
  )
} 
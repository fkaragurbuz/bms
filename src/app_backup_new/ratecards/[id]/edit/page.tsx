"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { HiTrash } from 'react-icons/hi'

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

export default function EditRateCardPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [rateCard, setRateCard] = useState<RateCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSaveAsModal, setShowSaveAsModal] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')

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
  }, [params?.id])

  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (rateCard) {
      setRateCard({ ...rateCard, customerName: e.target.value })
    }
  }

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    if (rateCard) {
      setRateCard({ ...rateCard, [field]: value })
    }
  }

  const handleServiceChange = (categoryId: string, serviceId: string, field: 'name' | 'price', value: string) => {
    if (rateCard) {
      const updatedCategories = rateCard.categories.map(category => {
        if (category.id === categoryId) {
          const updatedServices = category.services.map(service => {
            if (service.id === serviceId) {
              return { ...service, [field]: value }
            }
            return service
          })
          return { ...category, services: updatedServices }
        }
        return category
      })
      setRateCard({ ...rateCard, categories: updatedCategories })
    }
  }

  const handleAddService = (categoryId: string) => {
    if (rateCard) {
      const updatedCategories = rateCard.categories.map(category => {
        if (category.id === categoryId) {
          const newService = {
            id: Date.now().toString(),
            name: '',
            price: ''
          }
          return { ...category, services: [...category.services, newService] }
        }
        return category
      })
      setRateCard({ ...rateCard, categories: updatedCategories })
    }
  }

  const handleDeleteService = (categoryId: string, serviceId: string) => {
    if (rateCard) {
      const updatedCategories = rateCard.categories.map(category => {
        if (category.id === categoryId) {
          const updatedServices = category.services.filter(service => service.id !== serviceId)
          return { ...category, services: updatedServices }
        }
        return category
      })
      setRateCard({ ...rateCard, categories: updatedCategories })
    }
  }

  const handleSubmit = async () => {
    if (!rateCard) return

    try {
      setLoading(true)
      setError('')

      // Önce mevcut rate card'ları kontrol et
      const existingCardsResponse = await fetch('/api/ratecards')
      const existingCards = await existingCardsResponse.json()
      
      const existingCard = existingCards.find((card: RateCard) => 
        card.customerName.toLowerCase() === rateCard.customerName.toLowerCase() &&
        card.id !== rateCard.id
      )

      if (existingCard) {
        setError('Bu müşteri adıyla kayıtlı bir rate card zaten mevcut')
        setShowErrorModal(true)
        setLoading(false)
        return
      }

      const response = await fetch(`/api/ratecards/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rateCard),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Rate card güncellenirken bir hata oluştu')
        setShowErrorModal(true)
        return
      }

      // Başarılı kayıt durumunda yönlendir
      router.push(`/ratecards/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAs = async () => {
    setLoading(true)
    setError('')

    try {
      // Önce mevcut rate card'ları kontrol et
      const response = await fetch('/api/ratecards')
      const rateCards = await response.json()
      
      const customerNameToCheck = newCustomerName || (rateCard.customerName + ' (Kopya)')
      const existingCard = rateCards.find((card: RateCard) => 
        card.customerName.toLowerCase() === customerNameToCheck.toLowerCase()
      )

      if (existingCard) {
        setError('Bu müşteri adıyla kayıtlı bir rate card zaten mevcut')
        setShowSaveAsModal(true)
        setLoading(false)
        return
      }

      const newRateCard = {
        ...rateCard,
        id: Date.now().toString(),
        customerName: customerNameToCheck,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const saveResponse = await fetch('/api/ratecards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRateCard)
      })

      if (!saveResponse.ok) {
        throw new Error('Rate card kaydedilemedi')
      }

      router.push('/ratecards')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAsClick = () => {
    setNewCustomerName(rateCard.customerName + ' (Kopya)')
    setShowSaveAsModal(true)
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Müşteri Adı</label>
              <input
                type="text"
                value={rateCard.customerName}
                onChange={handleCustomerNameChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Başlangıç Tarihi</label>
              <input
                type="date"
                value={rateCard.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bitiş Tarihi</label>
              <input
                type="date"
                value={rateCard.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Kategoriler */}
        {rateCard.categories.map((category) => (
          category.name && (
            <div key={category.id} className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{category.name}</h3>
              
              {/* Hizmetler */}
              <div className="space-y-4">
                {category.services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => handleServiceChange(category.id, service.id, 'name', e.target.value)}
                        placeholder="Hizmet adı"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={service.price}
                        onChange={(e) => handleServiceChange(category.id, service.id, 'price', e.target.value)}
                        placeholder="Fiyat"
                        className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <span className="text-sm text-gray-500">TL</span>
                      <button
                        onClick={() => handleDeleteService(category.id, service.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <HiTrash className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Yeni Hizmet Ekle Butonu */}
              <button
                onClick={() => handleAddService(category.id)}
                className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Yeni Hizmet Ekle
              </button>
            </div>
          )
        ))}

        {/* Kaydet ve İptal Butonları */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/ratecards')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSaveAsClick}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {loading ? 'Kaydediliyor...' : 'Farklı Kaydet'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
              <h3 className="text-lg font-semibold text-red-600 mb-4">Hata</h3>
              <p className="text-gray-700 mb-6">{error}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowErrorModal(false)
                    setError('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none"
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Farklı Kaydet Modalı */}
        {showSaveAsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Farklı İsimle Kaydet</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yeni Müşteri Adı
                  </label>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Yeni müşteri adı girin"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 mb-4">{error}</p>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSaveAsModal(false)
                    setError('')
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveAs}
                  disabled={loading || !newCustomerName.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
} 
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { HiTrash, HiPlus } from 'react-icons/hi'

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
  const [errorDetails, setErrorDetails] = useState<string[]>([])
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

      // Kullanıcı bilgilerini al
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        throw new Error('Kullanıcı bilgisi bulunamadı')
      }
      const user = JSON.parse(userStr)

      const response = await fetch(`/api/ratecards/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: rateCard.customerName,
          categories: rateCard.categories.map(category => ({
            name: category.name,
            services: category.services.map(service => ({
              name: service.name,
              price: service.price
            }))
          }))
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'DUPLICATE_CUSTOMER') {
          setError('Bu müşteri adıyla başka bir rate card bulunmakta. Lütfen farklı bir müşteri adı giriniz.')
        } else {
          setError(data.error || 'Rate card güncellenirken bir hata oluştu')
        }
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
    if (!rateCard) return

    setLoading(true)
    setError('')

    try {
      // Kullanıcı bilgilerini al
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        throw new Error('Kullanıcı bilgisi bulunamadı')
      }
      const user = JSON.parse(userStr)
      
      const customerNameToCheck = newCustomerName || (rateCard.customerName + ' (Kopya)')

      const saveResponse = await fetch('/api/ratecards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: customerNameToCheck,
          categories: rateCard.categories.map(category => ({
            name: category.name,
            services: category.services.map(service => ({
              name: service.name,
              price: service.price
            }))
          })),
          userId: user.id
        })
      })

      if (!saveResponse.ok) {
        const data = await saveResponse.json()
        throw new Error(data.error || 'Rate card kaydedilemedi')
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

  const handleAddCategory = () => {
    setRateCard(prev => {
      const newCategory = {
        id: `temp-${Date.now()}`,
        name: '',
        services: []
      }
      return {
        ...prev,
        categories: [
          ...prev?.categories || [],
          newCategory
        ]
      }
    })
  }

  const handleDownloadExcel = async () => {
    try {
      const response = await fetch(`/api/ratecards/${params.id}/excel`, {
        method: 'GET'
      })
      
      if (!response.ok) {
        throw new Error('Excel indirme hatası')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${rateCard.customerName}_rate_card.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Excel indirme hatası oluştu')
      setShowErrorModal(true)
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Rate Card Düzenle</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Müşteri Bilgileri */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Müşteri Bilgileri</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Müşteri Adı
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={rateCard.customerName}
                    onChange={handleCustomerNameChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={rateCard.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={rateCard.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Kategoriler */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Kategoriler</h2>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <HiPlus className="-ml-1 mr-2 h-4 w-4" />
                  Yeni Kategori
                </button>
              </div>

              <div className="space-y-4">
                {rateCard.categories.map((category, categoryIndex) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) => {
                          const updatedCategories = rateCard.categories.map(c => {
                            if (c.id === category.id) {
                              return { ...c, name: e.target.value }
                            }
                            return c
                          })
                          setRateCard({ ...rateCard, categories: updatedCategories })
                        }}
                        placeholder="Kategori Adı"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedCategories = rateCard.categories.filter(c => c.id !== category.id)
                          setRateCard({ ...rateCard, categories: updatedCategories })
                        }}
                        className="ml-2 p-1 text-red-500 hover:text-red-600"
                      >
                        <HiTrash className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Hizmetler */}
                    <div className="space-y-2">
                      {category.services.map((service, serviceIndex) => (
                        <div key={service.id} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={service.name}
                            onChange={(e) => {
                              const updatedCategories = rateCard.categories.map(c => {
                                if (c.id === category.id) {
                                  const updatedServices = c.services.map(s => {
                                    if (s.id === service.id) {
                                      return { ...s, name: e.target.value }
                                    }
                                    return s
                                  })
                                  return { ...c, services: updatedServices }
                                }
                                return c
                              })
                              setRateCard({ ...rateCard, categories: updatedCategories })
                            }}
                            placeholder="Hizmet Adı"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                          <input
                            type="number"
                            value={service.price}
                            onChange={(e) => {
                              const updatedCategories = rateCard.categories.map(c => {
                                if (c.id === category.id) {
                                  const updatedServices = c.services.map(s => {
                                    if (s.id === service.id) {
                                      return { ...s, price: e.target.value }
                                    }
                                    return s
                                  })
                                  return { ...c, services: updatedServices }
                                }
                                return c
                              })
                              setRateCard({ ...rateCard, categories: updatedCategories })
                            }}
                            placeholder="Fiyat"
                            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updatedCategories = rateCard.categories.map(c => {
                                if (c.id === category.id) {
                                  const updatedServices = c.services.filter(s => s.id !== service.id)
                                  return { ...c, services: updatedServices }
                                }
                                return c
                              })
                              setRateCard({ ...rateCard, categories: updatedCategories })
                            }}
                            className="p-1 text-red-500 hover:text-red-600"
                          >
                            <HiTrash className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddService(category.id)}
                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <HiPlus className="-ml-1 mr-2 h-4 w-4" />
                        Yeni Hizmet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hata Mesajları */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    {errorDetails && errorDetails.length > 0 && (
                      <div className="mt-2 text-sm text-red-700">
                        <ul className="list-disc pl-5 space-y-1">
                          {errorDetails.map((detail, index) => (
                            <li key={index}>{detail}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Butonlar */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/ratecards')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSaveAsClick}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Farklı Kaydet
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kaydediliyor...
                  </>
                ) : (
                  'Kaydet'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Farklı Kaydet Modal */}
      {showSaveAsModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Farklı İsimle Kaydet
                  </h3>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Yeni müşteri adı"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleSaveAs}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveAsModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hata Modal */}
      {showErrorModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Hata
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  onClick={() => setShowErrorModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 
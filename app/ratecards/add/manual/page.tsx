'use client'

import { useState } from 'react'
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

export default function ManualRateCardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Ekip & Ekipman', services: [] },
    { id: '2', name: 'Post Prodüksiyon', services: [] },
    { id: '3', name: 'Prodüksiyon Harcama', services: [] },
  ])

  const handleAddCategory = () => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name: '',
      services: []
    }
    setCategories([...categories, newCategory])
  }

  const handleCategoryNameChange = (categoryId: string, newName: string) => {
    setCategories(categories.map(category => {
      if (category.id === categoryId) {
        return { ...category, name: newName }
      }
      return category
    }))
  }

  const handleAddService = (categoryId: string) => {
    setCategories(categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          services: [...category.services, {
            id: Date.now().toString(),
            name: '',
            price: ''
          }]
        }
      }
      return category
    }))
  }

  const handleServiceChange = (categoryId: string, serviceId: string, field: 'name' | 'price', value: string) => {
    setCategories(categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          services: category.services.map(service => {
            if (service.id === serviceId) {
              return { ...service, [field]: value }
            }
            return service
          })
        }
      }
      return category
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Kullanıcı bilgilerini al
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        throw new Error('Kullanıcı bilgisi bulunamadı')
      }
      const user = JSON.parse(userStr)

      // Rate card verilerini hazırla
      const rateCardData = {
        customerName,
        startDate,
        endDate,
        categories: categories.map(category => ({
          id: category.id,
          name: category.name,
          services: category.services.filter(service => service.name && service.price)
        })),
        userId: user.id
      }

      // API'ye gönder
      const response = await fetch('/api/ratecards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rateCardData)
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'DUPLICATE_CUSTOMER') {
          setError('Bu müşteri adıyla zaten bir rate card bulunmakta. Lütfen farklı bir müşteri adı giriniz.')
        } else {
          setError(data.error || 'Rate card kaydedilirken bir hata oluştu')
        }
        return
      }

      // Başarılı ise rate cards sayfasına yönlendir
      router.push('/ratecards')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter(category => category.id !== categoryId));
  };

  const handleDeleteService = (categoryId: string, serviceId: string) => {
    setCategories(categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          services: category.services.filter(service => service.id !== serviceId)
        }
      }
      return category
    }))
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Manuel Rate Card Oluştur</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Üst Bölüm - Müşteri Bilgileri */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                  Müşteri Adı
                </label>
                <input
                  type="text"
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Alt Bölüm - Kategoriler */}
          <div className="space-y-6">
            {categories.map((category, index) => (
              <div key={category.id} className="mb-8">
                <div className="flex items-center mb-4">
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => handleCategoryNameChange(category.id, e.target.value)}
                    placeholder="Başlık giriniz"
                    className="text-lg font-semibold text-gray-900 border-none focus:ring-0 p-0 bg-transparent"
                  />
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <HiTrash className="h-5 w-5" />
                  </button>
                </div>
                {/* Hizmetler Listesi */}
                <div className="space-y-4">
                  {category.services.map(service => (
                    <div key={service.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Hizmet Adı
                        </label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) => handleServiceChange(category.id, service.id, 'name', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Birim Fiyat
                          </label>
                          <input
                            type="number"
                            value={service.price}
                            onChange={(e) => handleServiceChange(category.id, service.id, 'price', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(category.id, service.id)}
                          className="mt-6 text-red-600 hover:text-red-800"
                        >
                          <HiTrash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Yeni Hizmet Ekleme Butonu */}
                <button
                  type="button"
                  onClick={() => handleAddService(category.id)}
                  className="mt-4 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  + Yeni Hizmet Ekle
                </button>
              </div>
            ))}

            {/* Yeni Başlık Ekleme Butonu */}
            <button
              type="button"
              onClick={handleAddCategory}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              + Yeni Başlık Ekle
            </button>
          </div>

          {/* Form Submit Butonu */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => router.push('/ratecards')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>

          {error && (
            <div className="mt-4 text-red-600">
              {error}
            </div>
          )}
        </form>
      </div>
    </>
  )
} 
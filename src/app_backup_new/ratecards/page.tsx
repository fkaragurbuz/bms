'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { HiPlus, HiUpload, HiEye, HiPencil, HiTrash } from 'react-icons/hi'

interface RateCard {
  id: string
  customerName: string
  createdBy: {
    id: number
    name: string
    email: string
    role: string
  }
  createdAt: string
  updatedAt: string
}

export default function RateCardsPage() {
  const router = useRouter()
  const [rateCards, setRateCards] = useState<RateCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  useEffect(() => {
    // Kullanıcı kontrolü
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }

    fetchRateCards()
  }, [])

  const fetchRateCards = async () => {
    try {
      const response = await fetch('/api/ratecards')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Rate cardlar yüklenirken bir hata oluştu')
      }

      setRateCards(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/ratecards/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Rate card silinirken bir hata oluştu')
      }

      // Listeyi güncelle
      setRateCards(prevCards => prevCards.filter(card => card.id !== id))
      setShowDeleteModal(false)
      setSelectedCardId(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteClick = (id: string) => {
    setSelectedCardId(id)
    setShowDeleteModal(true)
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
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Başlık ve Butonlar */}
        <div className="px-4 sm:px-0 mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Rate Cards
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/ratecards/import')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <HiUpload className="-ml-1 mr-2 h-5 w-5" />
              Excel'den Yükle
            </button>
            <button
              onClick={() => router.push('/ratecards/add')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <HiPlus className="-ml-1 mr-2 h-5 w-5" />
              Yeni Rate Card
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {/* Rate Card Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rateCards.map((card) => (
            <div
              key={card.id}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {card.customerName}
                </h3>
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => router.push(`/ratecards/${card.id}`)}
                    className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <HiEye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => router.push(`/ratecards/${card.id}/edit`)}
                    className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <HiPencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(card.id)}
                    className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <HiTrash className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {rateCards.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            Henüz rate card oluşturulmamış
          </div>
        )}

        {/* Silme Onay Modalı */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
              <div className="text-center">
                <HiTrash className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Rate Card'ı Sil</h3>
                <p className="text-gray-600">Bu rate cardı silmek istediğinize emin misiniz?</p>
              </div>
              <div className="mt-6 flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedCardId(null)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  İptal
                </button>
                <button
                  onClick={() => selectedCardId && handleDelete(selectedCardId)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
} 
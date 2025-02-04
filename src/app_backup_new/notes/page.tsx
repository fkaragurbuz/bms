'use client'

import Header from '@/components/Header'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { HiPlus, HiEye, HiPencil, HiTrash } from 'react-icons/hi'
import { format, isValid } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'

interface Note {
  id: string
  customerName: string
  subject: string
  content: string
  createdAt?: string
  updatedAt?: string
  createdBy?: {
    id: number
    name: string
    email: string
  }
}

interface User {
  id: number
  name: string
  email: string
  role: string
}

// Güvenli tarih formatlaması için yardımcı fonksiyon
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (!isValid(date)) return '-'
  return format(date, 'dd MMMM yyyy', { locale: tr })
}

export default function NotesPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Kullanıcı kontrolü
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(userStr))
    fetchNotes()
  }, [router])

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error)
      }
      
      setNotes(data)
    } catch (err: any) {
      setError(err.message || 'Notlar yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu notu silmek istediğinize emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/notes?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Not silinirken bir hata oluştu')
      }

      setNotes(notes.filter(note => note.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (!user) {
    return null // Kullanıcı bilgisi yüklenene kadar bir şey gösterme
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
        <div className="px-4 sm:px-0 mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Notlar
          </h1>
          <button
            onClick={() => router.push('/notes/add')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <HiPlus className="-ml-1 mr-2 h-5 w-5" />
            Yeni Not Ekle
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Müşteri Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Konu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Oluşturulma Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Son Güncelleme
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notes.map((note) => (
                <tr key={note.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {note.customerName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {note.subject}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(note.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(note.updatedAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => router.push(`/notes/${note.id}`)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="Görüntüle"
                    >
                      <HiEye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => router.push(`/notes/${note.id}/edit`)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="Düzenle"
                    >
                      <HiPencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Sil"
                    >
                      <HiTrash className="h-5 w-5" />
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
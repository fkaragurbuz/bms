'use client'

import Header from '@/components/Header'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { HiPencil, HiDownload } from 'react-icons/hi'

interface Note {
  id: string
  customerName: string
  subject: string
  date: string
  content: string
  files: string[]
  createdBy: {
    id: number
    name: string
    email: string
    role: string
  }
  createdAt: string
  updatedAt: string
}

export default function ViewNotePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [id, setId] = useState<string>('')

  useEffect(() => {
    // ID'yi state'e kaydet
    setId(params.id)
  }, [params])

  useEffect(() => {
    // Kullanıcı kontrolü
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }

    if (id) {
      fetchNote()
    }
  }, [id])

  const fetchNote = async () => {
    try {
      console.log('Not getiriliyor, ID:', id)
      const response = await fetch(`/api/notes/${id}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Not yüklenirken bir hata oluştu')
      }
      
      console.log('API yanıtı (ham veri):', data)
      console.log('Files array:', Array.isArray(data.files), data.files)
      
      // Dosya kontrolü
      if (!data.files) {
        data.files = []
        console.log('Dosya dizisi oluşturuldu')
      }
      
      setNote(data)
    } catch (err: any) {
      console.error('Not yükleme hatası:', err)
      setError(err.message || 'Not yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!note) {
      setError('Not bulunamadı')
      return
    }

    try {
      const response = await fetch(`/api/notes/${note.id}/export`, {
        method: 'GET'
      })
      
      if (!response.ok) {
        throw new Error('Dışa aktarma sırasında bir hata oluştu')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Not-${note.customerName}-${format(new Date(note.date), 'dd.MM.yyyy')}.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      console.error('Dışa aktarma hatası:', err)
      setError(err.message || 'Dışa aktarma sırasında bir hata oluştu')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">Yükleniyor...</div>
        </main>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">Not bulunamadı</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Başlık ve Butonlar */}
        <div className="px-4 sm:px-0 mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Not Detayı
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <HiDownload className="-ml-1 mr-2 h-5 w-5" />
              Word Olarak İndir
            </button>
            <button
              onClick={() => router.push(`/notes/${note.id}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <HiPencil className="-ml-1 mr-2 h-5 w-5" />
              Düzenle
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              {/* Not ID */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Not ID
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {note.id}
                </dd>
              </div>

              {/* Müşteri Adı */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Müşteri Adı
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {note.customerName}
                </dd>
              </div>

              {/* Konu */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Konu
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {note.subject}
                </dd>
              </div>

              {/* Tarih */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Tarih
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(note.date), 'dd MMMM yyyy', { locale: tr })}
                </dd>
              </div>

              {/* Oluşturan */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Oluşturan
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {note.createdBy.name} ({note.createdBy.email})
                </dd>
              </div>

              {/* Oluşturulma Tarihi */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Oluşturulma Tarihi
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(note.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                </dd>
              </div>

              {/* Son Güncelleme */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Son Güncelleme
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(note.updatedAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                </dd>
              </div>

              {/* Not İçeriği */}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">
                  Not
                </dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {note.content}
                </dd>
              </div>

              {/* Dosyalar */}
              {note.files && note.files.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    Dosyalar
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {note.files.map((file, index) => {
                        const fileName = file.split('-').slice(1).join('-')
                        return (
                          <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <span className="ml-2 flex-1 w-0 truncate">
                                {fileName}
                              </span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <a
                                href={`/uploads/${file}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:text-blue-500"
                              >
                                İndir
                              </a>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </main>
    </div>
  )
} 
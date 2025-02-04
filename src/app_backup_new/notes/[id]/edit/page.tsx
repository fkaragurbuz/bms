'use client'

import Header from '@/components/Header'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HiX } from 'react-icons/hi'

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
  }
  createdAt: string
}

interface FileWithPreview extends File {
  preview?: string
}

export default function EditNotePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    customerName: '',
    subject: '',
    date: '',
    content: ''
  })
  const [existingFiles, setExistingFiles] = useState<string[]>([])

  useEffect(() => {
    if (params.id) {
      fetchNote()
    }
  }, [params.id])

  const fetchNote = async () => {
    try {
      const response = await fetch(`/api/notes/${params.id}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error)
      }
      
      setFormData({
        customerName: data.customerName,
        subject: data.subject,
        date: data.date,
        content: data.content
      })
      setExistingFiles(data.files || [])
    } catch (err: any) {
      setError(err.message || 'Not yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prevFiles => [...prevFiles, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }

  const removeExistingFile = async (fileName: string) => {
    try {
      const response = await fetch(`/api/notes/${params.id}/files?file=${fileName}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Dosya silinirken bir hata oluştu')
      }

      setExistingFiles(prevFiles => prevFiles.filter(f => f !== fileName))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // Notu güncelle
      const noteResponse = await fetch(`/api/notes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: params.id,
          ...formData
        }),
      })

      if (!noteResponse.ok) {
        throw new Error('Not güncellenirken bir hata oluştu')
      }

      // Yeni dosyaları yükle
      if (files.length > 0) {
        const formData = new FormData()
        files.forEach(file => {
          formData.append('files', file)
        })

        const filesResponse = await fetch(`/api/notes/${params.id}/files`, {
          method: 'POST',
          body: formData,
        })

        if (!filesResponse.ok) {
          throw new Error('Dosyalar yüklenirken bir hata oluştu')
        }
      }

      // Başarılı - not detay sayfasına yönlendir
      router.push(`/meetings/${params.id}`)
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setSaving(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Not Düzenle
          </h1>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg">
          <div className="p-6 space-y-6">
            {/* Müşteri Adı */}
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                Müşteri Adı
              </label>
              <input
                type="text"
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Konu */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Konu
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Tarih */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Tarih
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Not İçeriği */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Not
              </label>
              <textarea
                id="content"
                rows={5}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Mevcut Dosyalar */}
            {existingFiles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mevcut Dosyalar
                </label>
                <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                  {existingFiles.map((file, index) => {
                    const fileName = file.split('-').slice(1).join('-')
                    return (
                      <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                        <div className="w-0 flex-1 flex items-center">
                          <span className="ml-2 flex-1 w-0 truncate">
                            {fileName}
                          </span>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex space-x-4">
                          <a
                            href={`/uploads/${file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-500"
                          >
                            İndir
                          </a>
                          <button
                            type="button"
                            onClick={() => removeExistingFile(file)}
                            className="font-medium text-red-600 hover:text-red-500"
                          >
                            Sil
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Yeni Dosya Yükleme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yeni Dosya Ekle
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Dosya Yükle</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">veya sürükleyip bırakın</p>
                  </div>
                  <p className="text-xs text-gray-500">Tüm dosya türleri kabul edilir</p>
                </div>
              </div>

              {/* Yeni Yüklenen Dosyalar Listesi */}
              {files.length > 0 && (
                <ul className="mt-4 divide-y divide-gray-200">
                  {files.map((file, index) => (
                    <li key={index} className="py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{file.name}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <HiX className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="px-6 py-3 bg-gray-50 flex items-center justify-end rounded-b-lg">
            <button
              type="button"
              onClick={() => router.push(`/meetings/${params.id}`)}
              className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
} 
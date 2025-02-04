'use client'

import Header from '@/components/Header'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { HiX } from 'react-icons/hi'

interface FileWithPreview extends File {
  preview?: string
}

interface User {
  id: number
  name: string
  email: string
  role: string
}

export default function AddNotePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    customerName: '',
    subject: '',
    date: new Date().toISOString().split('T')[0],
    content: ''
  })

  useEffect(() => {
    // Kullanıcı kontrolü
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(userStr))
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prevFiles => [...prevFiles, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Önce notu oluştur
      console.log('Not oluşturuluyor...')
      const noteResponse = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          createdBy: user,
          files: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }),
      })

      console.log('Not API yanıtı:', noteResponse.status)
      const responseText = await noteResponse.text()
      console.log('Not API yanıt içeriği:', responseText)

      if (!noteResponse.ok) {
        throw new Error(`Not oluşturulurken hata: ${responseText}`)
      }

      const noteData = JSON.parse(responseText)
      console.log('Not oluşturuldu:', noteData)

      // Dosyaları yükle
      if (files.length > 0) {
        console.log('Dosyalar yükleniyor...')
        const formData = new FormData()
        files.forEach(file => {
          console.log('Dosya ekleniyor:', file.name)
          formData.append('files', file)
        })

        const filesResponse = await fetch(`/api/notes/${noteData.id}/files`, {
          method: 'POST',
          body: formData,
        })

        console.log('Dosya API yanıtı:', filesResponse.status)
        const filesResponseText = await filesResponse.text()
        console.log('Dosya API yanıt içeriği:', filesResponseText)

        if (!filesResponse.ok) {
          throw new Error(`Dosya yükleme hatası: ${filesResponseText}`)
        }

        const fileData = JSON.parse(filesResponseText)
        console.log('Dosyalar yüklendi:', fileData)
        
        if (fileData.errors?.length > 0) {
          setError(`Bazı dosyalar yüklenemedi: ${fileData.errors.join(', ')}`)
          return
        }
      }

      // Başarılı - notlar sayfasına yönlendir
      router.push('/notes')
    } catch (err: any) {
      console.error('Hata detayı:', err)
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null // Kullanıcı bilgisi yüklenene kadar bir şey gösterme
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Yeni Not Ekle
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

            {/* Dosya Yükleme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosyalar
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

              {/* Yüklenen Dosyalar Listesi */}
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
              onClick={() => router.push('/notes')}
              className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
} 
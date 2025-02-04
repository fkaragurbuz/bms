'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

export default function ExcelRateCardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any>(null)

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/ratecards/template')
      if (!response.ok) throw new Error('Şablon indirilemedi')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'rate-card-template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setFile(file)
    // TODO: Implement file preview logic
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Lütfen bir Excel dosyası seçin')
      return
    }

    setLoading(true)
    setError('')

    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        setError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın')
        router.push('/login')
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('user', userStr)

      const response = await fetch('/api/ratecards/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Rate card yüklenirken bir hata oluştu')
      }

      router.push('/ratecards')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Excel'den Rate Card Oluştur</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Excel Şablonunu İndir
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Excel Dosyası Yükle
              </label>
              <div className="mt-1">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            {preview && (
              <div className="mt-4">
                {/* TODO: Add preview component */}
              </div>
            )}

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
                disabled={!file || loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? 'Yükleniyor...' : 'Yükle'}
              </button>
            </div>

            {error && (
              <div className="mt-4 text-red-600">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  )
} 
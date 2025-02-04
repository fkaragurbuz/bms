'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { HiOutlineDocumentDownload, HiOutlineUpload, HiX } from 'react-icons/hi'

interface PreviewData {
  categories: Array<{
    name: string
    services: Array<{
      name: string
      price: number
      unit?: string
    }>
  }>
}

export default function ExcelRateCardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string[] | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)

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
    } catch (err) {
      setError('Şablon indirme hatası')
      setErrorDetails(err instanceof Error ? [err.message] : ['Bilinmeyen hata'])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    // Dosya tipini kontrol et
    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      setError('Geçersiz dosya formatı')
      setErrorDetails(['Sadece .xlsx veya .xls uzantılı dosyalar yüklenebilir'])
      return
    }

    setFile(selectedFile)
    setError(null)
    setErrorDetails(null)
    setPreview(null)

    try {
      // Önizleme için dosyayı oku
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await fetch('/api/ratecards/preview', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Önizleme oluşturulamadı')
      }

      setPreview(data)
    } catch (err) {
      console.error('Önizleme hatası:', err)
      setError('Dosya önizleme hatası')
      setErrorDetails(err instanceof Error ? [err.message] : ['Önizleme oluşturulamadı'])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // Form submit işlemini engelle
    
    try {
      if (!file) {
        setError('Lütfen bir dosya seçin')
        return
      }

      setLoading(true)
      setError(null)
      setErrorDetails(null)

      const formData = new FormData()
      formData.append('file', file)

      console.log('Form data:', {
        file: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      })

      const response = await fetch('/api/ratecards/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      console.log('Import API response:', {
        status: response.status,
        ok: response.ok,
        result
      })

      if (!response.ok) {
        if (result.code === 'DUPLICATE_CUSTOMER') {
          setError('Bu müşteri adıyla zaten bir rate card bulunmakta')
          setErrorDetails(['Lütfen Excel dosyasındaki müşteri adını değiştirip tekrar deneyin'])
        } else {
          setError(result.error || 'Rate card oluşturulamadı')
          setErrorDetails(Array.isArray(result.details) ? result.details : [result.details])
        }
        return
      }

      router.push('/ratecards')
    } catch (error) {
      console.error('Submit error:', error)
      setError('Rate card oluşturulurken bir hata oluştu')
      if (error instanceof Error) {
        setErrorDetails([error.message])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setPreview(null)
    setError(null)
    setErrorDetails(null)
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Excel'den Rate Card Oluştur</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {/* Şablon İndirme */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Excel Şablonu</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Rate card oluşturmak için örnek Excel şablonunu indirin
                </p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <HiOutlineDocumentDownload className="-ml-1 mr-2 h-5 w-5" />
                Şablonu İndir
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dosya Yükleme */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Excel Dosyası
                </label>
                <div className="mt-1">
                  {!file ? (
                    <div className="max-w-lg flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <HiOutlineUpload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Dosya Seç</span>
                            <input
                              type="file"
                              accept=".xlsx,.xls"
                              onChange={handleFileChange}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">veya sürükle bırak</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Excel (.xlsx, .xls)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 border border-gray-300 rounded-md">
                      <div className="flex items-center">
                        <HiOutlineDocumentDownload className="h-8 w-8 text-gray-400" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="ml-4 bg-white rounded-md p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <HiX className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Önizleme */}
              {preview && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Önizleme</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    {preview.categories.map((category, index) => (
                      <div key={index} className="mb-4 last:mb-0">
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        <div className="mt-2 space-y-2">
                          {category.services.map((service, serviceIndex) => (
                            <div key={serviceIndex} className="flex justify-between text-sm">
                              <span>{service.name}</span>
                              <span className="text-gray-500">
                                {service.price.toLocaleString('tr-TR', {
                                  style: 'currency',
                                  currency: 'TRY'
                                })}
                                {service.unit && ` / ${service.unit}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => router.push('/ratecards')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!file || loading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    !file || loading
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
                      Yükleniyor...
                    </>
                  ) : (
                    'Yükle'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
} 
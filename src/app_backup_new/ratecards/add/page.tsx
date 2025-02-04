'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { HiPlus, HiUpload } from 'react-icons/hi'

export default function AddRateCardPage() {
  const router = useRouter()

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Rate Card Oluştur</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manuel Giriş */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Manuel Giriş</h2>
            <p className="text-gray-600 mb-4">Rate card bilgilerini manuel olarak girin.</p>
            <button
              onClick={() => router.push('/ratecards/add/manual')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <HiPlus className="-ml-1 mr-2 h-5 w-5" />
              Manuel Giriş
            </button>
          </div>

          {/* Excel'den Yükleme */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Excel'den Yükle</h2>
            <p className="text-gray-600 mb-4">Excel dosyasından rate card bilgilerini içe aktarın.</p>
            <button
              onClick={() => router.push('/ratecards/add/excel')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <HiUpload className="-ml-1 mr-2 h-5 w-5" />
              Excel'den Yükle
            </button>
          </div>
        </div>
      </div>
    </>
  )
} 
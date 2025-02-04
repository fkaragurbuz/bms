'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { HiOutlinePlusCircle, HiOutlineDocumentText, HiOutlineCheckCircle, HiOutlineDocument, HiOutlineDocumentDuplicate, HiOutlineCollection } from 'react-icons/hi'

export default function ProposalsPage() {
  const router = useRouter()

  const cards = [
    {
      title: 'Yeni Teklif Ekle',
      description: 'Yeni bir teklif oluşturmak için tıklayın',
      action: () => router.push('/proposals/add'),
      icon: HiOutlinePlusCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Tüm Teklifler',
      description: 'Tüm teklifleri listeleyin ve yönetin',
      action: () => router.push('/proposals/all'),
      icon: HiOutlineCollection,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Taslak Teklifler',
      description: 'Henüz tamamlanmamış teklifleri görüntüleyin',
      action: () => router.push('/proposals/drafts'),
      icon: HiOutlineDocumentText,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Onaylı Teklifler',
      description: 'Onaylanmış teklifleri görüntüleyin',
      action: () => router.push('/proposals/approved'),
      icon: HiOutlineCheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Faturası Kesilecek Teklifler',
      description: 'Fatura bekleyen teklifleri görüntüleyin',
      action: () => router.push('/proposals/pending-invoice'),
      icon: HiOutlineDocument,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Faturası Kesilen Teklifler',
      description: 'Faturası kesilmiş teklifleri görüntüleyin',
      action: () => router.push('/proposals/invoiced'),
      icon: HiOutlineDocumentDuplicate,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 px-4 sm:px-0 mb-8">
            Teklif Yönetimi
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-0">
            {cards.map((card, index) => {
              const Icon = card.icon
              return (
                <div
                  key={index}
                  onClick={card.action}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 relative overflow-hidden"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${card.bgColor}`}></div>
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className={`p-4 rounded-full ${card.bgColor}`}>
                      <Icon className={`w-8 h-8 ${card.color}`} />
                    </div>
                    <h2 className={`text-xl font-semibold ${card.color}`}>
                      {card.title}
                    </h2>
                    <p className="text-sm text-gray-600 text-center">
                      {card.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
} 
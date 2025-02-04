'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

interface AssignmentItem {
  id: string
  inventoryId: string
  quantity: number
  notes?: string
  inventory: {
    id: string
    name: string
    brand: string
    model: string
    serialNumber: string
  }
}

interface Assignment {
  id: string
  employeeId: string
  assignmentDate: string
  returnDate?: string
  notes?: string
  employee: {
    id: string
    name: string
    department: string
  }
  items: AssignmentItem[]
}

export default function AssignmentDetail() {
  const params = useParams()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const response = await fetch(`/api/assignments/${params.id}`)
        if (!response.ok) {
          throw new Error('Zimmet detayları yüklenirken bir hata oluştu')
        }
        const data = await response.json()
        setAssignment(data)
      } catch (error) {
        console.error('Zimmet detayları yüklenirken hata:', error)
        setError('Zimmet detayları yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchAssignment()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div>Yükleniyor...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-red-600">{error || 'Zimmet bulunamadı'}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <Link
              href="/inventory/assignment"
              className="text-sm text-indigo-600 hover:text-indigo-900"
            >
              ← Zimmet Listesine Dön
            </Link>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Yazdır
            </button>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden p-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold mb-2">ZİMMET TUTANAĞI</h2>
            </div>
            
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="font-bold">ADI SOYADI:</span> {assignment.employee.name}
                </div>
                <div>
                  <span className="font-bold">ZİMMET TARİHİ:</span> {new Date(assignment.assignmentDate).toLocaleDateString('tr-TR')}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-center font-bold mb-2">ZİMMET LİSTESİ</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">SIRA</th>
                    <th className="px-4 py-2 text-left">MALZEME TÜRÜ</th>
                    <th className="px-4 py-2 text-left">MARKA</th>
                    <th className="px-4 py-2 text-left">MODEL</th>
                    <th className="px-4 py-2 text-left">MİKTAR</th>
                    <th className="px-4 py-2 text-left">SERİ NO</th>
                  </tr>
                </thead>
                <tbody>
                  {assignment.items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{item.inventory.name}</td>
                      <td className="px-4 py-2">{item.inventory.brand}</td>
                      <td className="px-4 py-2">{item.inventory.model}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">{item.inventory.serialNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-sm">
              <p>Açıklama: Yukarıdaki listede yer alan malzemeleri eksiksiz ve çalışır halde teslim aldım.</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="font-bold mb-2">TESLİM EDEN</p>
              </div>
              <div className="text-center">
                <p className="font-bold mb-2">TESLİM ALAN</p>
                <p>{assignment.employee.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
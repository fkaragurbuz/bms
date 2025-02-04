'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

interface Employee {
  id: number
  name: string
  email: string
}

interface InventoryItem {
  id: number
  type: string
  brand: string
  model: string
  serialNumber: string
  quantity: number
}

export default function AssignmentPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [assignmentDate, setAssignmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignedItems, setAssignedItems] = useState<InventoryItem[]>([])

  // Çalışanları getir
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees')
        const data = await response.json()
        setEmployees(data)
      } catch (error) {
        console.error('Çalışanlar yüklenirken hata:', error)
      }
    }
    fetchEmployees()
  }, [])

  // Seçilen personelin zimmetli malzemelerini getir
  useEffect(() => {
    const fetchAssignedItems = async () => {
      if (selectedEmployee) {
        try {
          const response = await fetch(`/api/inventory/assignments/${selectedEmployee.id}`)
          const data = await response.json()
          setAssignedItems(data)
        } catch (error) {
          console.error('Zimmetli malzemeler yüklenirken hata:', error)
        }
      } else {
        setAssignedItems([])
      }
    }
    fetchAssignedItems()
  }, [selectedEmployee])

  // PDF Oluştur
  const generatePDF = () => {
    const doc = new jsPDF()
    
    // Logo
    const logoImg = new Image()
    logoImg.src = '/images/logo.png'
    doc.addImage(logoImg, 'PNG', 85, 5, 40, 40)
    
    // Başlık
    doc.setFontSize(18)
    doc.text('ZİMMET TUTANAĞI', 105, 55, { align: 'center' })
    
    // Çalışan Bilgileri
    doc.setFontSize(12)
    doc.text(`ADI SOYADI: ${selectedEmployee?.name || ''}`, 20, 70)
    doc.text(`ZİMMET TARİHİ: ${assignmentDate}`, 20, 80)
    
    // Tablo
    const tableData = assignedItems.map((item, index) => [
      index + 1,
      item.type,
      item.brand,
      item.model,
      item.quantity,
      item.serialNumber
    ])

    doc.autoTable({
      startY: 90,
      head: [['SIRA', 'MALZEME TÜRÜ', 'MARKA', 'MODEL', 'MİKTAR', 'SERİ NO']],
      body: tableData,
    })

    // Alt Bilgi
    const finalY = (doc as any).lastAutoTable.finalY || 150
    doc.text('Açıklama: Yukarıdaki listede yer alan malzemeleri eksiksiz ve çalışır halde teslim aldım.', 20, finalY + 20)
    
    // İmza Alanları
    doc.text('TESLİM EDEN', 50, finalY + 50, { align: 'center' })
    doc.text('TESLİM ALAN', 150, finalY + 50, { align: 'center' })

    doc.save('zimmet-tutanagi.pdf')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6 text-center">Zimmet Tutanağı</h1>
            
            {/* Personel Seçimi */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Personel</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedEmployee?.id || ''}
                onChange={(e) => {
                  const employee = employees.find(emp => emp.id === Number(e.target.value))
                  setSelectedEmployee(employee || null)
                }}
              >
                <option value="">Personel Seçiniz</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tarih Seçimi */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Zimmet Tarihi</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={assignmentDate}
                onChange={(e) => setAssignmentDate(e.target.value)}
              />
            </div>

            {/* Malzeme Listesi Tablosu */}
            <div className="mt-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sıra</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Malzeme Türü</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marka</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miktar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seri No</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignedItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.brand}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.model}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.serialNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PDF Oluştur Butonu */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={generatePDF}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                PDF Oluştur
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 
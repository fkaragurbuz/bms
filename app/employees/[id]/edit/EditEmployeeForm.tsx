'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { HiTrash, HiUpload } from 'react-icons/hi'

interface Document {
  id: string
  name: string
  path: string
  uploadDate: string
}

interface Employee {
  id: number
  tckn: string
  name: string
  sgkNo: string
  birthDate: string
  startDate: string
  department: string
  position: string
  phone: string
  email: string
  endDate?: string
  status: 'Aktif' | 'İşten Ayrıldı'
  documents: Document[]
}

interface Assignment {
  id: number
  employeeId: number
  items: Array<{
    id: number
    name: string
    serialNo: string
    quantity: number
  }>
  assignmentDate: string
  endDate?: string
  status?: 'Aktif' | 'Sonlandırıldı'
  createdAt: string
}

export default function EditEmployeeForm({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const [formData, setFormData] = useState({
    tckn: '',
    name: '',
    sgkNo: '',
    birthDate: '',
    startDate: '',
    department: '',
    position: '',
    phone: '',
    email: '',
    endDate: '',
    status: 'Aktif'
  })

  useEffect(() => {
    // Çalışan bilgilerini ve zimmetleri getir
    const fetchData = async () => {
      try {
        const [employeeResponse, assignmentsResponse] = await Promise.all([
          fetch(`/api/employees/${id}`),
          fetch(`/api/employees/${id}/assignments`)
        ])

        if (!employeeResponse.ok) throw new Error('Çalışan bilgileri alınamadı')
        
        const employee: Employee = await employeeResponse.json()
        setFormData({
          tckn: employee.tckn,
          name: employee.name,
          sgkNo: employee.sgkNo,
          birthDate: employee.birthDate,
          startDate: employee.startDate,
          department: employee.department,
          position: employee.position,
          phone: employee.phone,
          email: employee.email,
          endDate: employee.endDate || '',
          status: employee.status
        })
        setDocuments(employee.documents)

        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json()
          setAssignments(assignmentsData)
        }
      } catch (err: any) {
        setError(err.message)
      }
    }

    fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Önce yeni belgeleri yükle
      const uploadedDocs = await Promise.all(
        documents
          .filter(doc => !doc.path.startsWith('/uploads/')) // Sadece yeni yüklenen belgeleri işle
          .map(async (doc) => {
            const response = await fetch(doc.path)
            const blob = await response.blob()
            
            const formData = new FormData()
            formData.append('file', blob, doc.name)
            
            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            })
            
            if (!uploadResponse.ok) {
              throw new Error('Belge yüklenirken hata oluştu')
            }
            
            return await uploadResponse.json()
          })
      )

      // Mevcut belgeleri ve yeni yüklenen belgeleri birleştir
      const allDocuments = [
        ...documents.filter(doc => doc.path.startsWith('/uploads/')), // Mevcut belgeler
        ...uploadedDocs // Yeni yüklenen belgeler
      ]

      // Çalışan bilgilerini güncelle
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          documents: allDocuments
        }),
      })

      if (!response.ok) {
        throw new Error('Çalışan güncellenirken bir hata oluştu')
      }

      router.push('/employees')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    const formData = new FormData();
    Array.from(e.target.files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`/api/employees/${id}/files`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Dosya yükleme hatası');
      }

      const result = await response.json();
      
      const newDocs: Document[] = result.files.map((fileName: string) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: fileName.substring(fileName.indexOf('-') + 1), // Timestamp'i kaldır
        path: `/uploads/${fileName}`,
        uploadDate: new Date().toISOString()
      }));

      setDocuments(prev => [...prev, ...newDocs]);
      
      // Input'u temizle
      e.target.value = '';
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      alert('Dosya yüklenirken bir hata oluştu');
    }
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId))
  }

  const handleDownloadDocument = (doc: Document) => {
    if (doc.path.startsWith('/uploads/')) {
      // Sunucudaki dosyayı indir
      const downloadUrl = doc.path;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = doc.name; // Dosyanın orijinal adıyla indirilmesini sağla
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (doc.path.startsWith('blob:')) {
      // Henüz yüklenmemiş, sadece önizleme için olan dosyalar
      window.open(doc.path, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6">Çalışan Düzenle</h1>
            
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    TC Kimlik No
                  </label>
                  <input
                    type="text"
                    name="tckn"
                    required
                    maxLength={11}
                    pattern="[0-9]{11}"
                    value={formData.tckn}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Adı Soyadı
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    SGK No
                  </label>
                  <input
                    type="text"
                    name="sgkNo"
                    required
                    value={formData.sgkNo}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Doğum Tarihi
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    required
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    İşe Başlama Tarihi
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Departman
                  </label>
                  <input
                    type="text"
                    name="department"
                    required
                    value={formData.department}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pozisyon
                  </label>
                  <input
                    type="text"
                    name="position"
                    required
                    value={formData.position}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="05XX XXX XX XX"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    E-posta
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Durum
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="İşten Ayrıldı">İşten Ayrıldı</option>
                  </select>
                </div>

                {formData.status === 'İşten Ayrıldı' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      İşten Ayrılış Tarihi
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      required
                      value={formData.endDate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Belge Yükleme Alanı */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Belgeler
                </label>
                <div className="flex items-center space-x-4">
                  <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                    <HiUpload className="inline-block mr-2" />
                    Belge Yükle
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </label>
                </div>

                {/* Yüklenen Belgeler Listesi */}
                {documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {doc.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <HiTrash className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Zimmet Listesi */}
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Zimmet Listesi</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Zimmet Tarihi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ürünler
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assignments.map((assignment) => (
                        <tr key={assignment.id} className={assignment.status === 'Sonlandırıldı' ? 'bg-gray-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(assignment.assignmentDate).toLocaleDateString('tr-TR')}
                            {assignment.endDate && (
                              <span className="block text-xs text-gray-400">
                                Sonlandırma: {new Date(assignment.endDate).toLocaleDateString('tr-TR')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                assignment.status === 'Sonlandırıldı'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {assignment.status || 'Aktif'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <ul className="list-disc list-inside">
                              {assignment.items.map((item, index) => (
                                <li key={index}>
                                  {item.name} - {item.serialNo} ({item.quantity} adet)
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              type="button"
                              onClick={() => window.open(`/inventory/assignment/${assignment.id}`, '_blank')}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Tutanağı Görüntüle
                            </button>
                          </td>
                        </tr>
                      ))}
                      {assignments.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-sm text-gray-500 text-center">
                            Zimmet bulunamadı
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
} 
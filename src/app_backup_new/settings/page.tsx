'use client'

import Header from '@/components/Header'
import Modal from '@/components/Modal'
import UserForm from '@/components/UserForm'
import { useEffect, useState } from 'react'
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  name: string
  email: string
  role: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Kullanıcı kontrolü
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userStr)
    if (user.role !== 'Admin') {
      router.push('/dashboard')
      return
    }
    setCurrentUser(user)
    fetchUsers()
  }, [router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setUsers(data)
    } catch (err) {
      setError('Kullanıcılar yüklenirken bir hata oluştu')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = () => {
    setError(null)
    setIsAddModalOpen(true)
  }

  const handleEditUser = (userId: number) => {
    setError(null)
    const user = users.find(u => u.id === userId)
    if (user) {
      setSelectedUser(user)
      setIsEditModalOpen(true)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      try {
        const response = await fetch(`/api/users?id=${userId}`, {
          method: 'DELETE'
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        
        setUsers(users.filter(user => user.id !== userId))
      } catch (err: any) {
        setError(err.message || 'Kullanıcı silinirken bir hata oluştu')
      }
    }
  }

  const handleAddSubmit = async (userData: { name: string; email: string; password: string; role: string }) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setUsers([...users, data])
      setIsAddModalOpen(false)
    } catch (err: any) {
      setError(err.message || 'Kullanıcı eklenirken bir hata oluştu')
    }
  }

  const handleEditSubmit = async (userData: { name: string; email: string; password: string; role: string }) => {
    if (selectedUser) {
      try {
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...userData, id: selectedUser.id }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)

        setUsers(users.map(user => 
          user.id === selectedUser.id ? data : user
        ))
        setIsEditModalOpen(false)
        setSelectedUser(null)
      } catch (err: any) {
        setError(err.message || 'Kullanıcı güncellenirken bir hata oluştu')
      }
    }
  }

  if (!currentUser) {
    return null // Kullanıcı bilgisi yüklenene kadar bir şey gösterme
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">Yükleniyor...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Başlık ve Ekle butonu */}
        <div className="px-4 sm:px-0 mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Kullanıcı Ayarları
          </h1>
          <button
            onClick={handleAddUser}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <HiPlus className="-ml-1 mr-2 h-5 w-5" />
            Yeni Kullanıcı
          </button>
        </div>

        {/* Hata mesajı */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {/* Kullanıcı listesi */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'Admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditUser(user.id)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <HiPencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <HiTrash className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Yeni Kullanıcı Modalı */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Yeni Kullanıcı Ekle"
      >
        <UserForm onSubmit={handleAddSubmit} />
      </Modal>

      {/* Kullanıcı Düzenleme Modalı */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedUser(null)
        }}
        title="Kullanıcı Düzenle"
      >
        {selectedUser && (
          <UserForm
            onSubmit={handleEditSubmit}
            initialData={selectedUser}
            isEdit
          />
        )}
      </Modal>
    </div>
  )
} 
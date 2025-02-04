'use client'

import Header from '@/components/Header'
import { useRouter } from 'next/navigation'
import { HiOutlineDocumentText } from 'react-icons/hi'
import { HiOutlineCalculator } from 'react-icons/hi'
import { HiOutlineCash } from 'react-icons/hi'
import { HiOutlineUserGroup } from 'react-icons/hi'
import { HiOutlineCog } from 'react-icons/hi'
import { HiOutlineDesktopComputer } from 'react-icons/hi'
import { useEffect, useState } from 'react'

interface User {
  id: number
  name: string
  email: string
  role: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Giriş yapan kullanıcının bilgilerini localStorage'dan al
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      console.log('Kullanıcı bilgileri:', userData)
      console.log('Kullanıcı rolü:', userData.role)
      setUser(userData)
    } else {
      // Kullanıcı bilgisi yoksa login sayfasına yönlendir
      router.push('/login')
    }
  }, [router])

  console.log('Render sırasında user:', user)

  const menuItems = [
    {
      title: 'Notlar',
      description: 'Müşteri notlarını görüntüle ve yönet',
      href: '/notes',
      icon: HiOutlineDocumentText,
      roles: ['Admin', 'User']
    },
    {
      title: 'Teklif Yönetimi',
      icon: HiOutlineCalculator,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      href: '/proposals',
      roles: ['Admin', 'User']
    },
    {
      title: 'Rate Cards',
      icon: HiOutlineCash,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      href: '/ratecards',
      roles: ['Admin', 'User']
    },
    {
      title: 'Çalışanlar',
      icon: HiOutlineUserGroup,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      href: '/employees',
      roles: ['Admin']
    },
    {
      title: 'Demirbaş',
      icon: HiOutlineDesktopComputer,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      href: '/inventory',
      roles: ['Admin']
    },
    {
      title: 'Kullanıcı Ayarları',
      icon: HiOutlineCog,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      href: '/settings',
      roles: ['Admin']
    }
  ]

  // Kullanıcının rolüne göre görebileceği menü öğelerini filtrele
  const filteredMenuItems = menuItems.filter(item => {
    console.log('Kontrol edilen kart:', {
      title: item.title,
      roles: item.roles,
      userRole: user?.role,
      shouldShow: user && (!item.roles || item.roles.includes(user.role))
    });
    return user && (!item.roles || item.roles.includes(user.role))
  })

  if (!user) {
    return null // Kullanıcı bilgisi yüklenene kadar bir şey gösterme
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 px-4 sm:px-0 mb-8">
            Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-0">
            {filteredMenuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={index}
                  onClick={() => router.push(item.href)}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105"
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className={`p-4 rounded-full ${item.bgColor}`}>
                      <Icon className={`w-8 h-8 ${item.color}`} />
                    </div>
                    <h2 className={`text-xl font-semibold ${item.color}`}>
                      {item.title}
                    </h2>
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
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import {
  HiOutlineDocumentText,
  HiOutlineCalculator,
  HiOutlineCash,
  HiOutlineUserGroup,
  HiOutlineDesktopComputer,
  HiOutlineCog,
  HiOutlineDocumentDuplicate,
  HiCurrencyDollar
} from 'react-icons/hi'

interface User {
  id: string
  email: string
  role: string
}

interface MenuItem {
  label?: string
  title?: string
  description?: string
  href: string
  icon: any
  color?: string
  bgColor?: string
  roles?: string[]
}

const DashboardContent = dynamic(() => Promise.resolve(({ user, router }: { user: User, router: any }) => {
  const menuItems: MenuItem[] = [
    {
      title: 'Teklifler',
      icon: HiOutlineCalculator,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      href: '/proposals',
      roles: ['admin', 'user']
    },
    {
      title: 'Notlar',
      icon: HiOutlineDocumentText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      href: '/notes',
      roles: ['admin', 'user']
    },
    {
      title: 'Rate Cards',
      icon: HiOutlineCash,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      href: '/ratecards',
      roles: ['admin', 'user']
    },
    {
      title: 'Çalışanlar',
      icon: HiOutlineUserGroup,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      href: '/employees',
      roles: ['ADMIN']
    },
    {
      title: 'Demirbaş',
      icon: HiOutlineDesktopComputer,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      href: '/inventory',
      roles: ['ADMIN']
    },
    {
      title: 'Kullanıcı Ayarları',
      icon: HiOutlineCog,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      href: '/settings',
      roles: ['ADMIN']
    }
  ]

  const filteredMenuItems = menuItems.filter(item => {
    const hasAccess = user && (!item.roles || item.roles.some(role => 
      role.toUpperCase() === user.role.toUpperCase()
    ))
    return hasAccess
  })

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
              const IconComponent = item.icon
              return (
                <div
                  key={index}
                  onClick={() => router.push(item.href)}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105"
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className={`p-4 rounded-full ${item.bgColor || 'bg-gray-50'}`}>
                      <IconComponent className={`w-8 h-8 ${item.color || 'text-gray-500'}`} />
                    </div>
                    <h2 className={`text-xl font-semibold ${item.color || 'text-gray-900'}`}>
                      {item.label || item.title}
                    </h2>
                    {item.description && (
                      <p className="text-gray-600 text-center text-sm">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}), { ssr: false })

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUser = () => {
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const userData = JSON.parse(userStr)
          setUser(userData)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error in useEffect:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    if (typeof window !== 'undefined') {
      checkUser()
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    }>
      <DashboardContent user={user} router={router} />
    </Suspense>
  )
} 
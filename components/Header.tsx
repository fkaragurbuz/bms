'use client'

import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Nav } from 'react-bootstrap'

interface MenuItem {
  label: string
  href: string
  icon: React.ReactNode | null
  roles: string[] | null
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          setUser(JSON.parse(userStr))
        } catch (error) {
          console.error('Error parsing user data:', error)
        }
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  const menuItems: MenuItem[] = [
    {
      label: 'Ana Sayfa',
      href: '/dashboard',
      icon: null,
      roles: null
    },
    {
      label: 'Teklifler',
      href: '/proposals',
      icon: null,
      roles: null
    },
    {
      label: 'Rate Cards',
      href: '/ratecards',
      icon: null,
      roles: null
    }
  ]

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="relative w-32 h-8">
            <Image
              src="/images/logo.png"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Hamburger Menu Button (Mobile) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <span className="sr-only">Ana menüyü aç</span>
            {/* Hamburger Icon */}
            <svg
              className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            {/* Close Icon */}
            <svg
              className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex space-x-4">
            {menuItems.filter(item => {
              if (item.roles && user) {
                return item.roles.includes(user.role);
              }
              return true;
            }).map((item, index) => (
              <Nav.Link
                key={index}
                className={pathname === item.href ? 'active' : ''}
                onClick={() => router.push(item.href)}
              >
                {item.icon && <span className="me-1">{item.icon}</span>}
                {item.label}
              </Nav.Link>
            ))}
          </div>

          {/* Logout Button (Desktop) */}
          <div className="hidden md:block">
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden py-2`}>
          <div className="flex flex-col space-y-2">
            {menuItems.filter(item => {
              if (item.roles && user) {
                return item.roles.includes(user.role);
              }
              return true;
            }).map((item, index) => (
              <Nav.Link
                key={index}
                className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md"
                onClick={() => {
                  router.push(item.href)
                  setIsMenuOpen(false)
                }}
              >
                {item.icon && <span className="me-1">{item.icon}</span>}
                {item.label}
              </Nav.Link>
            ))}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </header>
  )
} 
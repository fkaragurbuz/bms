'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPasswordConfirmPage({
  params
}: {
  params: { token: string }
}) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setStatus('error')
      setMessage('Şifreler eşleşmiyor')
      return
    }

    if (password.length < 6) {
      setStatus('error')
      setMessage('Şifre en az 6 karakter olmalıdır')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: params.token,
          password
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Şifreniz başarıyla güncellendi')
        // 3 saniye sonra login sayfasına yönlendir
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Bir hata oluştu')
      }
    } catch (err) {
      setStatus('error')
      setMessage('Bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <div className="relative w-40 h-40 mx-auto mb-6">
            <Image
              src="/images/logo.png"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Yeni Şifre Belirleme</h2>
          <p className="text-gray-600">
            Lütfen yeni şifrenizi girin
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && (
            <div className={`px-4 py-3 rounded-lg ${
              status === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-600'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Yeni Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                placeholder="••••••••"
                disabled={status === 'loading' || status === 'success'}
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Şifre Tekrar
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                placeholder="••••••••"
                disabled={status === 'loading' || status === 'success'}
                minLength={6}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'İşleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 
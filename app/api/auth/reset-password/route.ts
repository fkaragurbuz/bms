import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Kullanıcıyı kontrol et
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Bu email adresiyle kayıtlı kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Yeni token oluştur
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 saat geçerli

    // Varolan token'ı sil ve yeni token'ı ekle
    await prisma.resetToken.deleteMany({
      where: { email }
    })

    await prisma.resetToken.create({
      data: {
        email,
        token,
        expiresAt
      }
    })

    // Gerçek uygulamada burada email gönderimi yapılacak
    // Şimdilik sadece başarılı yanıt dönüyoruz
    return NextResponse.json({
      success: true,
      message: 'Şifre sıfırlama bağlantısı gönderildi'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Şifre sıfırlama işlemi sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    // Token'ı kontrol et
    const resetToken = await prisma.resetToken.findUnique({
      where: { token }
    })
    
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş token' },
        { status: 400 }
      )
    }

    // Token süresini kontrol et
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Şifre sıfırlama bağlantısının süresi dolmuş' },
        { status: 400 }
      )
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(password, 10)

    // Kullanıcının şifresini güncelle
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword }
    })

    // Kullanılan token'ı sil
    await prisma.resetToken.delete({
      where: { token }
    })

    return NextResponse.json({
      success: true,
      message: 'Şifre başarıyla güncellendi'
    })

  } catch (error) {
    console.error('Reset password confirm error:', error)
    return NextResponse.json(
      { error: 'Şifre güncelleme işlemi sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
} 
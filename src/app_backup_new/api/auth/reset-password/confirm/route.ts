import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const tokensFilePath = path.join(process.cwd(), 'data', 'reset-tokens.json')
const usersFilePath = path.join(process.cwd(), 'data', 'users.json')

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    // Token'ı kontrol et
    const tokensData = await fs.readFile(tokensFilePath, 'utf-8')
    const tokens = JSON.parse(tokensData)
    
    const resetToken = tokens.find((t: any) => t.token === token)
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş token' },
        { status: 400 }
      )
    }

    // Token süresini kontrol et
    if (new Date(resetToken.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Şifre sıfırlama bağlantısının süresi dolmuş' },
        { status: 400 }
      )
    }

    // Kullanıcının şifresini güncelle
    const usersData = await fs.readFile(usersFilePath, 'utf-8')
    const users = JSON.parse(usersData)
    
    const userIndex = users.findIndex((u: any) => u.email === resetToken.email)
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Şifreyi güncelle
    users[userIndex].password = password // Gerçek uygulamada şifre hash'lenecek

    // Kullanıcıları kaydet
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2))

    // Kullanılan token'ı sil
    const updatedTokens = tokens.filter((t: any) => t.token !== token)
    await fs.writeFile(tokensFilePath, JSON.stringify(updatedTokens, null, 2))

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
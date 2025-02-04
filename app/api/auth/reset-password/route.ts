import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')
const RESET_TOKENS_FILE = path.join(process.cwd(), 'data', 'reset_tokens.json')

interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface ResetToken {
  token: string;
  email: string;
  expiresAt: Date;
}

// Yardımcı fonksiyonlar
function readJSONFile<T>(filePath: string): T[] {
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error)
    return []
  }
}

function writeJSONFile<T>(filePath: string, data: T[]): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Kullanıcıyı kontrol et
    const users = readJSONFile<User>(USERS_FILE)
    const user = users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Bu email adresiyle kayıtlı kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Yeni token oluştur
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 saat geçerli

    // Reset token'ları oku veya yeni dosya oluştur
    let resetTokens = readJSONFile<ResetToken>(RESET_TOKENS_FILE)

    // Varolan token'ı sil
    resetTokens = resetTokens.filter(t => t.email !== email)

    // Yeni token ekle
    resetTokens.push({
      email,
      token,
      expiresAt
    })

    writeJSONFile(RESET_TOKENS_FILE, resetTokens)

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
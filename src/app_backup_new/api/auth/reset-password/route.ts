import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const dataFilePath = path.join(process.cwd(), 'data', 'reset-tokens.json')

// Token dosyasını oku
async function readTokensFile() {
  try {
    await fs.access(dataFilePath)
    const data = await fs.readFile(dataFilePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // Dosya yoksa boş array döndür
    return []
  }
}

// Token dosyasına yaz
async function writeTokensFile(tokens: any[]) {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true })
  await fs.writeFile(dataFilePath, JSON.stringify(tokens, null, 2))
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Kullanıcıyı kontrol et
    const usersFilePath = path.join(process.cwd(), 'data', 'users.json')
    const usersData = await fs.readFile(usersFilePath, 'utf-8')
    const users = JSON.parse(usersData)
    
    const user = users.find((u: any) => u.email === email)
    if (!user) {
      return NextResponse.json(
        { error: 'Bu email adresiyle kayıtlı kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Yeni token oluştur
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 saat geçerli

    // Token'ı kaydet
    const tokens = await readTokensFile()
    // Varolan token'ı sil
    const filteredTokens = tokens.filter((t: any) => t.email !== email)
    // Yeni token'ı ekle
    filteredTokens.push({
      email,
      token,
      expiresAt
    })
    await writeTokensFile(filteredTokens)

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
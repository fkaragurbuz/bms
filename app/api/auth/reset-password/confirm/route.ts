import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcrypt'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')
const RESET_TOKENS_FILE = path.join(process.cwd(), 'data', 'reset_tokens.json')

// Yardımcı fonksiyonlar
function readJSONFile(filePath: string) {
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error)
    return []
  }
}

function writeJSONFile(filePath: string, data: any) {
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
    const { token, password } = await request.json()

    // Token'ı kontrol et
    const resetTokens = readJSONFile(RESET_TOKENS_FILE)
    const resetToken = resetTokens.find((t: any) => t.token === token)
    
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

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(password, 10)

    // Kullanıcının şifresini güncelle
    const users = readJSONFile(USERS_FILE)
    const userIndex = users.findIndex((u: any) => u.email === resetToken.email)

    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    users[userIndex].password = hashedPassword
    writeJSONFile(USERS_FILE, users)

    // Kullanılan token'ı sil
    const updatedResetTokens = resetTokens.filter((t: any) => t.token !== token)
    writeJSONFile(RESET_TOKENS_FILE, updatedResetTokens)

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
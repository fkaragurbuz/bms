import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'users.json')

// Kullanıcıları oku
async function readUsersFile() {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const users = await readUsersFile()

    // Email ve şifre kontrolü
    const user = users.find((u: any) => u.email === email && u.password === password)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Geçersiz email veya şifre' },
        { status: 401 }
      )
    }

    // Şifreyi gizleyerek kullanıcı bilgilerini dön
    const { password: _, ...safeUser } = user
    return NextResponse.json(safeUser)
  } catch (error) {
    return NextResponse.json(
      { error: 'Giriş yapılırken bir hata oluştu' },
      { status: 500 }
    )
  }
} 
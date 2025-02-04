import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import bcrypt from 'bcrypt'

interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

// Helper to ensure data file exists
async function ensureFile() {
  try {
    await fs.access(USERS_FILE)
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify([]))
  }
}

// Helper to read users
async function readUsers(): Promise<User[]> {
  await ensureFile()
  const content = await fs.readFile(USERS_FILE, 'utf-8')
  return JSON.parse(content)
}

// Helper to write users
async function writeUsers(users: User[]) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
}

// GET - Kullanıcıları getir
export async function GET() {
  try {
    const users = await readUsers()
    // Şifreleri çıkar
    const usersWithoutPasswords = users.map(({ password, ...user }) => user)
    return NextResponse.json(usersWithoutPasswords)
  } catch (error) {
    console.error('Kullanıcılar getirilirken hata:', error)
    return NextResponse.json({ error: 'Kullanıcılar getirilirken bir hata oluştu' }, { status: 500 })
  }
}

// POST - Yeni kullanıcı ekle
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, password, role } = body

    const users = await readUsers()

    // Email kontrolü
    const existingUser = users.find((u: User) => u.email === email)
    if (existingUser) {
      return NextResponse.json({ error: 'Bu email adresi zaten kullanılıyor' }, { status: 400 })
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(password, 10)

    // Yeni kullanıcı oluştur
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      password: hashedPassword,
      role: role || 'USER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    users.push(newUser)
    await writeUsers(users)

    // Şifreyi çıkar ve yanıt olarak gönder
    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Kullanıcı eklenirken hata:', error)
    return NextResponse.json({ error: 'Kullanıcı eklenirken bir hata oluştu' }, { status: 500 })
  }
}

// PUT - Kullanıcı güncelle
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, email, name, role, password } = body

    const users = await readUsers()
    const userIndex = users.findIndex((u: User) => u.id === id)

    if (userIndex === -1) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // Kullanıcıyı güncelle
    const updatedUser = {
      ...users[userIndex],
      email,
      name,
      role,
      updatedAt: new Date().toISOString()
    }

    // Eğer yeni şifre varsa hash'le ve güncelle
    if (password) {
      updatedUser.password = await bcrypt.hash(password, 10)
    }

    users[userIndex] = updatedUser
    await writeUsers(users)

    // Şifreyi çıkar ve yanıt olarak gönder
    const { password: _, ...userWithoutPassword } = updatedUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Kullanıcı güncellenirken hata:', error)
    return NextResponse.json({ error: 'Kullanıcı güncellenirken bir hata oluştu' }, { status: 500 })
  }
}

// DELETE - Kullanıcı sil
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID parametresi gerekli' }, { status: 400 })
    }

    const users = await readUsers()
    const updatedUsers = users.filter((u: User) => u.id !== id)

    if (users.length === updatedUsers.length) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    await writeUsers(updatedUsers)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Kullanıcı silinirken hata:', error)
    return NextResponse.json({ error: 'Kullanıcı silinirken bir hata oluştu' }, { status: 500 })
  }
} 
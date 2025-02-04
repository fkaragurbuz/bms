import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'users.json')

// Veri dosyasını oku
async function readUsersFile() {
  try {
    await fs.access(dataFilePath)
    const data = await fs.readFile(dataFilePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // Dosya yoksa veya okunamazsa varsayılan veriyi döndür
    const defaultData = [
      { id: 1, name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'Admin' }
    ]
    // Veri klasörünü ve dosyayı oluştur
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true })
    await fs.writeFile(dataFilePath, JSON.stringify(defaultData, null, 2))
    return defaultData
  }
}

// Veriyi dosyaya yaz
async function writeUsersFile(users: any[]) {
  await fs.writeFile(dataFilePath, JSON.stringify(users, null, 2))
}

// Tüm kullanıcıları getir
export async function GET() {
  try {
    const users = await readUsersFile()
    // Şifreleri gizle
    const safeUsers = users.map(({ password, ...user }) => user)
    return NextResponse.json(safeUsers)
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json(
      { error: 'Kullanıcılar yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Yeni kullanıcı ekle
export async function POST(request: Request) {
  try {
    const users = await readUsersFile()
    const body = await request.json()

    // Email kontrolü
    const existingUser = users.find((user: any) => user.email === body.email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email adresi zaten kullanımda' },
        { status: 400 }
      )
    }

    // Yeni kullanıcı oluştur
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map((u: any) => u.id)) + 1 : 1,
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role
    }

    users.push(newUser)
    await writeUsersFile(users)

    // Şifreyi gizleyerek yanıt dön
    const { password, ...safeUser } = newUser
    return NextResponse.json(safeUser)
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json(
      { error: 'Kullanıcı eklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Kullanıcı güncelle
export async function PUT(request: Request) {
  try {
    const users = await readUsersFile()
    const body = await request.json()

    // Email kontrolü (kendi emaili hariç)
    const existingUser = users.find((user: any) => 
      user.email === body.email && user.id !== body.id
    )
    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email adresi zaten kullanımda' },
        { status: 400 }
      )
    }

    // Kullanıcıyı güncelle
    const updatedUsers = users.map((user: any) =>
      user.id === body.id
        ? { 
            ...user, 
            name: body.name, 
            email: body.email, 
            role: body.role,
            ...(body.password ? { password: body.password } : {})
          }
        : user
    )

    await writeUsersFile(updatedUsers)
    
    // Şifreyi gizleyerek güncel kullanıcıyı dön
    const updatedUser = updatedUsers.find((user: any) => user.id === body.id)
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }
    const { password, ...safeUser } = updatedUser
    return NextResponse.json(safeUser)
  } catch (error) {
    console.error('PUT error:', error)
    return NextResponse.json(
      { error: 'Kullanıcı güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Kullanıcı sil
export async function DELETE(request: Request) {
  try {
    const users = await readUsersFile()
    const url = new URL(request.url)
    const id = Number(url.searchParams.get('id'))

    if (!id) {
      return NextResponse.json(
        { error: 'Geçersiz kullanıcı ID' },
        { status: 400 }
      )
    }

    const userExists = users.some((user: any) => user.id === id)
    if (!userExists) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    const updatedUsers = users.filter((user: any) => user.id !== id)
    await writeUsersFile(updatedUsers)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE error:', error)
    return NextResponse.json(
      { error: 'Kullanıcı silinirken bir hata oluştu' },
      { status: 500 }
    )
  }
} 
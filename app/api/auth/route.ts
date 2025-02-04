import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import fs from 'fs/promises'
import path from 'path'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

interface User {
  id: string;
  email: string;
  password: string;
  role: string;
}

async function readUsers(): Promise<User[]> {
  try {
    const content = await fs.readFile(USERS_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    return []
  }
}

async function writeUsers(users: User[]) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const users = await readUsers()
    const user = users.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      'your-secret-key',
      { expiresIn: '1d' }
    )

    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    const { password: _, ...userWithoutPassword } = user
    
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
} 
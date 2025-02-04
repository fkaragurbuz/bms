import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

async function readUsers() {
  try {
    const content = await fs.readFile(USERS_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

async function writeUsers(users: any[]) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
}

export async function POST(request: Request) {
  try {
    const { email, password, role = 'USER' } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const users = await readUsers()
    
    // Check if user already exists
    if (users.some(u => u.email === email)) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    
    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    users.push(newUser)
    await writeUsers(users)

    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
} 
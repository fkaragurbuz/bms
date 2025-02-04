import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

export async function GET() {
  try {
    await ensureDataDir()

    // Initialize empty JSON files
    await fs.writeFile(
      path.join(DATA_DIR, 'ratecards.json'),
      JSON.stringify([], null, 2)
    )
    await fs.writeFile(
      path.join(DATA_DIR, 'proposals.json'),
      JSON.stringify([], null, 2)
    )
    await fs.writeFile(
      path.join(DATA_DIR, 'notes.json'),
      JSON.stringify([], null, 2)
    )
    await fs.writeFile(
      path.join(DATA_DIR, 'users.json'),
      JSON.stringify([], null, 2)
    )

    return NextResponse.json({
      message: 'JSON files initialized successfully',
      files: ['ratecards.json', 'proposals.json', 'notes.json', 'users.json']
    })
  } catch (error) {
    console.error('JSON initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize JSON files' },
      { status: 500 }
    )
  }
} 
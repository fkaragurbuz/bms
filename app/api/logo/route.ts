import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET() {
  try {
    const logoPath = path.join(process.cwd(), 'public/images/logo.png')
    const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' })
    return new NextResponse(JSON.stringify({ logo: `data:image/png;base64,${logoBase64}` }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Logo yüklenirken hata oluştu:', error)
    return new NextResponse(JSON.stringify({ error: 'Logo yüklenemedi' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
} 
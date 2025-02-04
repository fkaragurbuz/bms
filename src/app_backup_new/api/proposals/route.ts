import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'proposals.json')

// Veri dosyasını oluştur (yoksa)
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf-8')
}

export async function GET() {
  try {
    const proposals = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    return NextResponse.json(proposals)
  } catch (error) {
    return NextResponse.json(
      { error: 'Teklifler yüklenirken bir hata oluştu.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const proposals = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    const newProposal = await request.json()
    
    // ID ve tarih ekle
    newProposal.id = Date.now().toString()
    newProposal.date = new Date().toISOString()
    
    proposals.push(newProposal)
    fs.writeFileSync(DATA_FILE, JSON.stringify(proposals, null, 2))
    
    return NextResponse.json(newProposal)
  } catch (error) {
    return NextResponse.json(
      { error: 'Teklif eklenirken bir hata oluştu.' },
      { status: 500 }
    )
  }
} 
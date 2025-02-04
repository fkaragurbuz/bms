import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

interface Proposal {
  id: string
  customerName: string
  projectName: string
  date: string
  status: string
  totalAmount: number
  createdBy?: string
  showTotal: boolean
  createdAt?: string
  updatedAt?: string
}

const PROPOSALS_FILE = path.join(process.cwd(), 'data/proposals.json')

// Helper to ensure data file exists
async function ensureFile() {
  try {
    await fs.access(PROPOSALS_FILE)
  } catch {
    await fs.writeFile(PROPOSALS_FILE, '[]')
  }
}

// Helper to read proposals
async function readProposals() {
  try {
    await ensureFile()
    console.log('Dosya yolu:', PROPOSALS_FILE)
    const content = await fs.readFile(PROPOSALS_FILE, 'utf-8')
    console.log('Okunan içerik:', content.substring(0, 100))
    return JSON.parse(content)
  } catch (error) {
    console.error('Dosya okuma hatası:', error)
    return []
  }
}

// Helper to write proposals
async function writeProposals(data: any[]) {
  await fs.writeFile(PROPOSALS_FILE, JSON.stringify(data, null, 2))
}

// GET - Teklifleri getir
export async function GET() {
  console.log('GET isteği alındı: /api/proposals')
  try {
    console.log('Teklifler dosyadan okunuyor...')
    const proposals = await readProposals()
    console.log(`${proposals.length} adet teklif başarıyla okundu`)
    
    // Tarihe göre azalan sıralama
    proposals.sort((a: Proposal, b: Proposal) => {
      const dateA = new Date(a.createdAt || a.date)
      const dateB = new Date(b.createdAt || b.date)
      return dateB.getTime() - dateA.getTime()
    })
    console.log('Teklifler tarihe göre sıralandı')
    
    return NextResponse.json(proposals)
  } catch (error) {
    console.error('Teklifleri getirirken hata oluştu:', error)
    return NextResponse.json({ error: 'Teklifler yüklenemedi' }, { status: 500 })
  }
}

// POST - Yeni teklif ekle
export async function POST(request: Request) {
  try {
    const proposal = await request.json()
    const proposals = await readProposals()

    // Yeni teklif için ID ve tarih oluştur
    const newProposal = {
      ...proposal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Taslak'
    }

    proposals.push(newProposal)
    await writeProposals(proposals)

    return NextResponse.json(newProposal)
  } catch (err) {
    console.error('Teklif kaydedilirken hata:', err)
    return NextResponse.json(
      { error: 'Teklif kaydedilemedi' },
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const PROPOSALS_FILE = path.join(process.cwd(), 'data/proposals.json')

interface Topic {
  title: string
  services: {
    name: string
    quantity: number
    unit: string
    unitPrice: number
    total: number
  }[]
  total: number
}

interface Proposal {
  id: string
  customerName: string
  projectName: string
  date: string
  topics: Topic[]
  totalAmount: number
  status: string
  createdBy?: string
  discount?: {
    type: 'percentage' | 'amount'
    value: number
  } | null
  terms?: string
  showTotal: boolean
  createdAt?: string
  updatedAt?: string
  agencyCommission?: number
}

// Dosyanın varlığını kontrol et
async function ensureFile() {
  try {
    await fs.access(PROPOSALS_FILE)
  } catch {
    await fs.writeFile(PROPOSALS_FILE, '[]')
  }
}

// Teklifleri oku
async function readProposals(): Promise<Proposal[]> {
  await ensureFile()
  const data = await fs.readFile(PROPOSALS_FILE, 'utf8')
  return JSON.parse(data)
}

// Teklifleri yaz
async function writeProposals(proposals: Proposal[]) {
  await ensureFile()
  await fs.writeFile(PROPOSALS_FILE, JSON.stringify(proposals, null, 2))
}

// Teklif getir
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const proposals = await readProposals()
    const proposal = proposals.find((p) => p.id === id)
    
    if (!proposal) {
      return NextResponse.json(
        { error: 'Teklif bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json(proposal)
  } catch (err) {
    console.error('Teklif getirme hatası:', err)
    return NextResponse.json(
      { error: 'Teklif getirilemedi' },
      { status: 500 }
    )
  }
}

// Teklif güncelle
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const proposal = await request.json()

    if (!proposal) {
      return NextResponse.json(
        { error: 'Teklif verisi gerekli' },
        { status: 400 }
      )
    }

    const proposals = await readProposals()
    const proposalIndex = proposals.findIndex(p => p.id === id)

    if (proposalIndex === -1) {
      return NextResponse.json(
        { error: 'Teklif bulunamadı' },
        { status: 404 }
      )
    }

    // Mevcut teklifi güncelle
    const updatedProposal: Proposal = {
      ...proposals[proposalIndex],
      ...proposal,
      updatedAt: new Date().toISOString()
    }

    console.log('Güncellenmiş teklif:', updatedProposal)

    proposals[proposalIndex] = updatedProposal
    await writeProposals(proposals)

    return NextResponse.json(updatedProposal)
  } catch (err) {
    console.error('Teklif güncelleme hatası:', err)
    return NextResponse.json(
      { error: 'Teklif güncellenemedi' },
      { status: 500 }
    )
  }
}

// Teklif sil
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const proposals = await readProposals()
    const proposalIndex = proposals.findIndex(p => p.id === id)

    if (proposalIndex === -1) {
      return NextResponse.json(
        { error: 'Teklif bulunamadı' },
        { status: 404 }
      )
    }

    proposals.splice(proposalIndex, 1)
    await writeProposals(proposals)

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('Teklif silme hatası:', err)
    return NextResponse.json(
      { error: 'Teklif silinemedi' },
      { status: 500 }
    )
  }
} 
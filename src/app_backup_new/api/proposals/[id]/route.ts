import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'proposals.json')

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const proposals = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    const proposal = proposals.find((p: any) => p.id === params.id)

    if (!proposal) {
      return NextResponse.json(
        { error: 'Teklif bulunamadı.' },
        { status: 404 }
      )
    }

    return NextResponse.json(proposal)
  } catch (error) {
    return NextResponse.json(
      { error: 'Teklif yüklenirken bir hata oluştu.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const proposals = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    const index = proposals.findIndex((p: any) => p.id === params.id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Teklif bulunamadı.' },
        { status: 404 }
      )
    }

    const updatedProposal = await request.json()
    proposals[index] = { ...proposals[index], ...updatedProposal }
    fs.writeFileSync(DATA_FILE, JSON.stringify(proposals, null, 2))

    return NextResponse.json(proposals[index])
  } catch (error) {
    return NextResponse.json(
      { error: 'Teklif güncellenirken bir hata oluştu.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const proposals = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    const index = proposals.findIndex((p: any) => p.id === params.id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Teklif bulunamadı.' },
        { status: 404 }
      )
    }

    const deletedProposal = proposals.splice(index, 1)[0]
    fs.writeFileSync(DATA_FILE, JSON.stringify(proposals, null, 2))

    return NextResponse.json(deletedProposal)
  } catch (error) {
    return NextResponse.json(
      { error: 'Teklif silinirken bir hata oluştu.' },
      { status: 500 }
    )
  }
} 
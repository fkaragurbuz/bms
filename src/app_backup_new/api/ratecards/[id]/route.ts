import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'ratecards.json')

// Rate card sil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const rateCards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    const index = rateCards.findIndex((rc: any) => rc.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Rate card bulunamadı' },
        { status: 404 }
      )
    }

    rateCards.splice(index, 1)
    fs.writeFileSync(DATA_FILE, JSON.stringify(rateCards, null, 2))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Rate card silme hatası:', err)
    return NextResponse.json(
      { error: 'Rate card silinirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const rateCards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    const rateCard = rateCards.find((rc: any) => rc.id === id)

    if (!rateCard) {
      return NextResponse.json(
        { error: 'Rate card bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json(rateCard)
  } catch (err) {
    console.error('Rate card getirme hatası:', err)
    return NextResponse.json(
      { error: 'Rate card getirilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const rateCards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    const index = rateCards.findIndex((rc: any) => rc.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Rate card bulunamadı' },
        { status: 404 }
      )
    }

    const updatedRateCard = await request.json()
    rateCards[index] = {
      ...updatedRateCard,
      updatedAt: new Date().toISOString()
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(rateCards, null, 2))

    return NextResponse.json(rateCards[index])
  } catch (err) {
    console.error('Rate card güncelleme hatası:', err)
    return NextResponse.json(
      { error: 'Rate card güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
} 
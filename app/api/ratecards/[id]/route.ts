import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const RATECARDS_FILE = path.join(process.cwd(), 'data', 'ratecards.json')

// Helper to ensure data file exists
async function ensureFile() {
  try {
    await fs.access(RATECARDS_FILE)
  } catch {
    await fs.writeFile(RATECARDS_FILE, JSON.stringify([]))
  }
}

// Helper to read rate cards
async function readRateCards() {
  await ensureFile()
  const data = await fs.readFile(RATECARDS_FILE, 'utf-8')
  return JSON.parse(data)
}

// Helper to write rate cards
async function writeRateCards(data: any) {
  await fs.writeFile(RATECARDS_FILE, JSON.stringify(data, null, 2))
}

// GET - Belirli bir rate card'ı getir
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Await params before accessing id
    const id = await Promise.resolve(params).then(p => p.id)
    const rateCards = await readRateCards()
    const rateCard = rateCards.find((rc: any) => rc.id === id)

    if (!rateCard) {
      return NextResponse.json({ error: 'Rate card bulunamadı' }, { status: 404 })
    }

    // Remove createdBy access since it's not available in JSON storage
    return NextResponse.json(rateCard)
  } catch (error) {
    console.error('Rate card getirme hatası:', error)
    return NextResponse.json({ error: 'Rate card getirilirken bir hata oluştu' }, { status: 500 })
  }
}

// PUT - Rate card'ı güncelle
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = await Promise.resolve(params).then(p => p.id)
    const { customerName, categories } = await request.json()
    const rateCards = await readRateCards()
    const index = rateCards.findIndex((rc: any) => rc.id === id)

    if (index === -1) {
      return NextResponse.json({ error: 'Rate card bulunamadı' }, { status: 404 })
    }

    // Eğer müşteri adı değiştirildiyse, aynı isimle başka rate card var mı kontrol et
    if (customerName !== rateCards[index].customerName) {
      const duplicateCheck = rateCards.find((rc: any) => 
        rc.id !== id && 
        rc.customerName.toLowerCase() === customerName.toLowerCase()
      )

      if (duplicateCheck) {
        return NextResponse.json(
          { error: 'Bu müşteri adıyla başka bir rate card bulunmakta' },
          { status: 400 }
        )
      }
    }

    // Rate card'ı güncelle
    const updatedRateCard = {
      ...rateCards[index],
      customerName,
      categories: categories.map((category: any) => ({
        id: category.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: category.name,
        services: category.services.map((service: any) => ({
          id: service.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: service.name,
          price: service.price
        }))
      })),
      updatedAt: new Date().toISOString()
    }

    rateCards[index] = updatedRateCard
    await writeRateCards(rateCards)

    return NextResponse.json(updatedRateCard)
  } catch (error) {
    console.error('Rate card güncelleme hatası:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Rate card güncellenirken bir hata oluştu',
      code: error instanceof Error && error.message === 'Bu müşteri adıyla başka bir rate card bulunmakta' 
        ? 'DUPLICATE_CUSTOMER' 
        : 'UPDATE_ERROR'
    }, { status: 400 })
  }
}

// DELETE - Rate card'ı sil
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = await Promise.resolve(params).then(p => p.id)
    const rateCards = await readRateCards()
    const index = rateCards.findIndex((rc: any) => rc.id === id)

    if (index === -1) {
      return NextResponse.json({ error: 'Rate card bulunamadı' }, { status: 404 })
    }

    rateCards.splice(index, 1)
    await writeRateCards(rateCards)

    return NextResponse.json({ message: 'Rate card başarıyla silindi' })
  } catch (error) {
    console.error('Rate card silme hatası:', error)
    return NextResponse.json({ error: 'Rate card silinirken bir hata oluştu' }, { status: 500 })
  }
} 
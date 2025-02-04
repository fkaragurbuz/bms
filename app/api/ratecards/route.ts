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

// GET - Rate cardları getir
export async function GET() {
  try {
    const rateCards = await readRateCards()
    return NextResponse.json(rateCards)
  } catch (error) {
    console.error('Rate cards getirme hatası:', error)
    return NextResponse.json({ error: 'Rate cards getirilemedi' }, { status: 500 })
  }
}

// POST - Yeni rate card ekle
export async function POST(request: Request) {
  try {
    const { customerName, categories, userId } = await request.json()

    if (!customerName || !categories) {
      return NextResponse.json(
        { error: 'Müşteri adı ve kategoriler gerekli' },
        { status: 400 }
      )
    }

    const rateCards = await readRateCards()
    
    // Check for existing rate card
    const existingRateCard = rateCards.find((rc: any) => 
      rc.customerName.toLowerCase() === customerName.toLowerCase()
    )

    if (existingRateCard) {
      return NextResponse.json(
        { error: 'Bu müşteri için zaten bir rate card mevcut' },
        { status: 400 }
      )
    }

    // Create new rate card
    const newRateCard = {
      id: Date.now().toString(),
      customerName,
      categories: categories.map((category: any) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: category.name,
        services: category.services.map((service: any) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: service.name,
          price: service.price
        }))
      })),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    rateCards.push(newRateCard)
    await writeRateCards(rateCards)

    return NextResponse.json(newRateCard)
  } catch (error) {
    console.error('Rate card oluşturma hatası:', error)
    return NextResponse.json(
      { error: 'Rate card oluşturulamadı' },
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Rate cards dosyasının yolu
const dataFilePath = path.join(process.cwd(), 'data', 'ratecards.json')

// Rate cards verilerini oku
function getRateCards() {
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, '[]', 'utf-8')
    return []
  }
  const fileContent = fs.readFileSync(dataFilePath, 'utf-8')
  return JSON.parse(fileContent)
}

// GET - Tüm rate cardları getir
export async function GET() {
  try {
    const rateCards = getRateCards()
    return NextResponse.json(rateCards)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Yeni rate card ekle
export async function POST(request: Request) {
  try {
    const rateCards = getRateCards()
    const data = await request.json()

    // Yeni rate card için ID oluştur
    const newRateCard = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Rate card'ı listeye ekle
    rateCards.push(newRateCard)

    // Dosyaya kaydet
    fs.writeFileSync(dataFilePath, JSON.stringify(rateCards, null, 2))

    return NextResponse.json(newRateCard)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 
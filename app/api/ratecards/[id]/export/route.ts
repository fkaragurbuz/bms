import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import * as XLSX from 'xlsx'

const RATECARDS_FILE = path.join(process.cwd(), 'data', 'ratecards.json')

interface Service {
  id: string
  name: string
  price: number
}

interface Category {
  id: string
  name: string
  services: Service[]
}

interface RateCard {
  id: string
  customerName: string
  startDate?: string
  endDate?: string
  categories: Category[]
  createdAt: string
  updatedAt: string
}

// Helper to ensure data file exists
async function ensureFile() {
  try {
    await fs.access(RATECARDS_FILE)
  } catch {
    await fs.writeFile(RATECARDS_FILE, JSON.stringify([]))
  }
}

// Helper to read rate cards
async function readRateCards(): Promise<RateCard[]> {
  await ensureFile()
  const data = await fs.readFile(RATECARDS_FILE, 'utf-8')
  return JSON.parse(data)
}

// Helper to convert Turkish characters to ASCII
function turkishToAscii(text: string) {
  const charMap: { [key: string]: string } = {
    'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
  }
  return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, char => charMap[char] || char)
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const rateCards = await readRateCards()
    const rateCard = rateCards.find((rc) => rc.id === id)

    if (!rateCard) {
      return NextResponse.json({ error: 'Rate card bulunamadı' }, { status: 404 })
    }

    // Excel verilerini hazırla
    const data = [
      ['Müşteri Adı:', rateCard.customerName],
      ['Başlangıç Tarihi:', rateCard.startDate ? new Date(rateCard.startDate).toLocaleDateString('tr-TR') : '-'],
      ['Bitiş Tarihi:', rateCard.endDate ? new Date(rateCard.endDate).toLocaleDateString('tr-TR') : '-'],
      [],
      ['Kategori', 'Hizmet Adı', 'Birim Fiyat']
    ]

    // Kategorileri ve hizmetleri ekle
    rateCard.categories.forEach((category: Category) => {
      category.services.forEach((service: Service) => {
        data.push([category.name, service.name, service.price.toString()])
      })
    })

    // Excel dosyasını oluştur
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rate Card')

    // Excel dosyasını buffer'a dönüştür
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Dosya adındaki Türkçe karakterleri değiştir
    const safeFileName = turkishToAscii(rateCard.customerName)

    // Response header'larını ayarla
    const headers = new Headers()
    headers.append('Content-Disposition', `attachment; filename="rate-card-${safeFileName}.xlsx"`)
    headers.append('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    return new NextResponse(buffer, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Excel export hatası:', error)
    return NextResponse.json({ error: 'Excel dosyası oluşturulurken bir hata oluştu' }, { status: 500 })
  }
} 
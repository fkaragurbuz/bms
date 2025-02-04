import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import * as XLSX from 'xlsx'

const RATECARDS_FILE = path.join(process.cwd(), 'data', 'ratecards.json')

interface ExcelRow {
  Kategori: string
  'Hizmet Adı': string
  'Birim Fiyat': string | number
}

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

// Helper to write rate cards
async function writeRateCards(data: RateCard[]) {
  await fs.writeFile(RATECARDS_FILE, JSON.stringify(data, null, 2))
}

// Helper to parse date
function parseDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? undefined : date.toISOString()
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ 
        error: 'Dosya bulunamadı',
        details: 'Lütfen bir Excel dosyası yükleyin'
      }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    
    console.log('Worksheet:', worksheet)

    // Müşteri bilgilerini oku
    const customerName = worksheet['B1']?.v
    const startDateStr = worksheet['B2']?.v
    const endDateStr = worksheet['B3']?.v

    // Tarihleri doğru formata çevir
    const startDate = parseDate(startDateStr)
    const endDate = parseDate(endDateStr)

    console.log('Müşteri bilgileri:', {
      customerName,
      startDate,
      endDate
    })

    if (!customerName) {
      return NextResponse.json({ 
        error: 'Müşteri adı bulunamadı',
        details: 'Excel dosyasında müşteri adı belirtilmemiş'
      }, { status: 400 })
    }

    // Mevcut rate cardları oku
    const rateCards = await readRateCards()
    
    // Aynı müşteri adıyla başka bir rate card var mı kontrol et
    const existingRateCard = rateCards.find(rc => 
      rc.customerName.toLowerCase() === customerName.toLowerCase()
    )

    if (existingRateCard) {
      return NextResponse.json({ 
        error: 'Bu müşteri adıyla zaten bir rate card bulunmakta',
        code: 'DUPLICATE_CUSTOMER',
        details: ['Lütfen farklı bir müşteri adı kullanın']
      }, { status: 400 })
    }

    // Hizmet verilerini oku (5. satırdan itibaren)
    const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { range: 4 })
    console.log('Excel rows:', rows)

    if (rows.length === 0) {
      return NextResponse.json({ 
        error: 'Excel dosyası boş',
        details: 'Excel dosyasında veri bulunamadı'
      }, { status: 400 })
    }

    // Zorunlu sütunları kontrol et
    const requiredColumns = ['Kategori', 'Hizmet Adı', 'Birim Fiyat']
    const firstRow = rows[0]
    console.log('First row:', firstRow)
    const missingColumns = requiredColumns.filter(col => !(col in firstRow))
    console.log('Missing columns:', missingColumns)

    if (missingColumns.length > 0) {
      return NextResponse.json({
        error: 'Eksik sütunlar',
        details: `Şu sütunlar eksik: ${missingColumns.join(', ')}`
      }, { status: 400 })
    }

    // Verileri grupla ve doğrula
    const categories = new Map<string, Array<{ name: string; price: number }>>()
    const errors: string[] = []

    rows.forEach((row, index) => {
      const lineNumber = index + 5 // Excel satır numarası (başlık satırından sonra)
      const category = row.Kategori?.trim()
      const serviceName = row['Hizmet Adı']?.trim()
      const price = typeof row['Birim Fiyat'] === 'string' ? 
        parseFloat(row['Birim Fiyat'].replace(/[^0-9.-]+/g, '')) : 
        row['Birim Fiyat']

      if (!category) {
        errors.push(`Satır ${lineNumber}: Kategori boş olamaz`)
        return
      }

      if (!serviceName) {
        errors.push(`Satır ${lineNumber}: Hizmet adı boş olamaz`)
        return
      }

      if (isNaN(price) || price < 0) {
        errors.push(`Satır ${lineNumber}: Geçersiz fiyat değeri`)
        return
      }

      if (!categories.has(category)) {
        categories.set(category, [])
      }

      categories.get(category)?.push({
        name: serviceName,
        price
      })
    })

    if (errors.length > 0) {
      return NextResponse.json({
        error: 'Veri doğrulama hatası',
        details: errors
      }, { status: 400 })
    }

    // Rate card oluştur
    const newRateCard: RateCard = {
      id: Date.now().toString(),
      customerName,
      startDate,
      endDate,
      categories: Array.from(categories.entries()).map(([name, services]) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name,
        services: services.map(service => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: service.name,
          price: service.price
        }))
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Rate card'ı kaydet
    rateCards.push(newRateCard)
    await writeRateCards(rateCards)

    return NextResponse.json(newRateCard)
  } catch (err) {
    console.error('Transaction hatası:', err)
    return NextResponse.json({ 
      error: 'Rate card oluşturma hatası',
      details: err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu'
    }, { status: 500 })
  }
} 
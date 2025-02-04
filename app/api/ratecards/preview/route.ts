import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

interface ExcelRow {
  Kategori: string
  'Hizmet Adı': string
  'Birim Fiyat': string | number
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
    const startDate = startDateStr ? new Date(startDateStr) : null
    const endDate = endDateStr ? new Date(endDateStr) : null

    console.log('Müşteri bilgileri:', {
      customerName,
      startDate,
      endDate
    })

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

    // Verileri grupla
    const categories = new Map<string, Array<{ name: string; price: number }>>()

    rows.forEach((row) => {
      const category = row.Kategori?.trim()
      const serviceName = row['Hizmet Adı']?.trim()
      const price = typeof row['Birim Fiyat'] === 'string' ? 
        parseFloat(row['Birim Fiyat'].replace(/[^0-9.-]+/g, '')) : 
        row['Birim Fiyat']

      if (!categories.has(category)) {
        categories.set(category, [])
      }

      categories.get(category)?.push({
        name: serviceName,
        price
      })
    })

    // Preview verisi oluştur
    const preview = {
      categories: Array.from(categories.entries()).map(([name, services]) => ({
        name,
        services: services.map(service => ({
          name: service.name,
          price: service.price
        }))
      }))
    }

    return NextResponse.json(preview)

  } catch (error) {
    console.error('Preview hatası:', error)
    
    return NextResponse.json({
      error: 'Preview oluşturma hatası',
      details: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'
    }, { status: 500 })
  }
} 
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'ratecards.json')

export async function POST(request: Request) {
  try {
    // FormData'dan dosyayı al
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 400 }
      )
    }

    // Dosyayı buffer'a çevir
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Excel dosyasını oku
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

    // Verileri doğrula ve işle
    if (data.length < 4) {
      return NextResponse.json(
        { error: 'Geçersiz Excel formatı' },
        { status: 400 }
      )
    }

    // Müşteri bilgilerini al ve doğrula
    const customerName = data[0]?.[1]?.toString().trim()
    const startDate = data[1]?.[1]
    const endDate = data[2]?.[1]

    if (!customerName) {
      return NextResponse.json(
        { error: 'Müşteri adı boş olamaz' },
        { status: 400 }
      )
    }

    // Tarihleri doğrula ve formatla
    const startDateStr = startDate ? new Date(startDate).toISOString().split('T')[0] : ''
    const endDateStr = endDate ? new Date(endDate).toISOString().split('T')[0] : ''

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Geçerli başlangıç ve bitiş tarihi girilmelidir' },
        { status: 400 }
      )
    }

    // Kategorileri ve hizmetleri işle
    const categories: any[] = []
    let currentCategory = null

    for (let i = 5; i < data.length; i++) {
      const row = data[i] as any[]
      if (!row || row.length === 0) continue

      const category = row[0]?.toString().trim()
      const serviceName = row[1]?.toString().trim()
      const price = row[2]?.toString().trim()

      if (category) {
        currentCategory = {
          id: Date.now().toString() + i,
          name: category,
          services: []
        }
        categories.push(currentCategory)
      } else if (currentCategory && serviceName && price) {
        // Fiyatı sayıya çevir ve kontrol et
        const numericPrice = parseFloat(price.replace(/[^0-9.-]+/g, ''))
        if (isNaN(numericPrice)) {
          return NextResponse.json(
            { error: `Geçersiz fiyat değeri: ${price}` },
            { status: 400 }
          )
        }

        currentCategory.services.push({
          id: Date.now().toString() + i,
          name: serviceName,
          price: numericPrice.toString()
        })
      }
    }

    // En az bir kategori olmalı
    if (categories.length === 0) {
      return NextResponse.json(
        { error: 'En az bir kategori ve hizmet girilmelidir' },
        { status: 400 }
      )
    }

    // Kullanıcı bilgilerini al
    const userStr = formData.get('user')
    if (!userStr) {
      return NextResponse.json(
        { error: 'Kullanıcı bilgisi bulunamadı' },
        { status: 400 }
      )
    }
    const user = JSON.parse(userStr as string)

    // Rate card verisini oluştur
    const rateCard = {
      id: Date.now().toString(),
      customerName,
      startDate: startDateStr,
      endDate: endDateStr,
      categories,
      createdBy: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Mevcut rate card'ları oku
    let rateCards = []
    try {
      rateCards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    } catch (err) {
      rateCards = []
    }

    // Yeni rate card'ı ekle
    rateCards.push(rateCard)

    // Dosyaya kaydet
    fs.writeFileSync(DATA_FILE, JSON.stringify(rateCards, null, 2))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Dosya işlenirken bir hata oluştu' },
      { status: 500 }
    )
  }
} 
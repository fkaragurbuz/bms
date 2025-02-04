import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Dosya yüklenemedi' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

    if (!data || data.length < 2) {
      return NextResponse.json({ error: 'Geçersiz Excel dosyası' }, { status: 400 })
    }

    const headers = data[0] as string[]
    const customerNameIndex = headers.findIndex(h => h.toLowerCase().includes('müşteri'))
    const categoryIndex = headers.findIndex(h => h.toLowerCase().includes('kategori'))
    const serviceIndex = headers.findIndex(h => h.toLowerCase().includes('hizmet'))
    const unitIndex = headers.findIndex(h => h.toLowerCase().includes('birim'))
    const priceIndex = headers.findIndex(h => h.toLowerCase().includes('fiyat'))
    const daysIndex = headers.findIndex(h => h.toLowerCase().includes('gün'))

    if (customerNameIndex === -1 || categoryIndex === -1 || serviceIndex === -1 || 
        unitIndex === -1 || priceIndex === -1) {
      return NextResponse.json({ error: 'Gerekli sütunlar bulunamadı' }, { status: 400 })
    }

    const rateCards = new Map()

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as string[]
      if (!row[customerNameIndex]) continue

      const customerName = row[customerNameIndex].toString()
      const categoryName = row[categoryIndex].toString()
      const serviceName = row[serviceIndex].toString()
      const unit = row[unitIndex].toString()
      const price = parseFloat(row[priceIndex]) || 0
      const days = parseInt(row[daysIndex]) || 1

      if (!rateCards.has(customerName)) {
        rateCards.set(customerName, new Map())
      }

      const categories = rateCards.get(customerName)
      if (!categories.has(categoryName)) {
        categories.set(categoryName, [])
      }

      categories.get(categoryName).push({
        name: serviceName,
        unit,
        price,
        days
      })
    }

    for (const [customerName, categories] of rateCards) {
      const rateCard = await prisma.rateCard.create({
        data: {
          customerName,
          startDate: new Date(),
          categories: {
            create: Array.from(categories).map(([categoryName, services]) => ({
              name: categoryName,
              services: {
                create: services.map((service: any) => ({
                  name: service.name,
                  unit: service.unit,
                  price: service.price,
                  days: service.days
                }))
              }
            }))
          }
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Excel dosyası işlenirken hata:', error)
    return NextResponse.json({ error: 'Excel dosyası işlenirken bir hata oluştu' }, { status: 500 })
  }
} 
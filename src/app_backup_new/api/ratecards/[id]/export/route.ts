import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'ratecards.json')

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Rate card'ı oku
    const rateCards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    const rateCard = rateCards.find((rc: any) => rc.id === params.id)

    if (!rateCard) {
      return NextResponse.json({ error: 'Rate card bulunamadı' }, { status: 404 })
    }

    // Excel verilerini hazırla
    const data: any[] = []

    // Başlık bilgileri
    data.push(['Müşteri Adı:', rateCard.customerName])
    data.push(['Başlangıç Tarihi:', rateCard.startDate])
    data.push(['Bitiş Tarihi:', rateCard.endDate])
    data.push([]) // Boş satır

    // Kategoriler ve hizmetler
    rateCard.categories.forEach((category: any) => {
      if (category.name) { // Boş kategori adlarını atla
        data.push([category.name]) // Kategori adı
        data.push(['Hizmet Adı', 'Birim Fiyat (TL)']) // Tablo başlıkları
        
        if (category.services && category.services.length > 0) {
          category.services.forEach((service: any) => {
            data.push([service.name, service.price])
          })
        } else {
          data.push(['Hizmet bulunmamaktadır', '-'])
        }
        
        data.push([]) // Kategoriler arası boş satır
      }
    })

    // Oluşturma bilgileri
    data.push(['Oluşturan:', rateCard.createdBy.name])
    data.push(['Oluşturulma Tarihi:', new Date(rateCard.createdAt).toLocaleDateString('tr-TR')])
    data.push(['Son Güncelleme:', new Date(rateCard.updatedAt).toLocaleDateString('tr-TR')])

    // Excel dosyası oluştur
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(data)

    // Sütun genişliklerini ayarla
    const colWidths = [{ wch: 30 }, { wch: 20 }]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Rate Card')
    
    // Excel dosyasını buffer'a dönüştür
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Response header'larını ayarla
    const headers = new Headers()
    headers.append('Content-Disposition', `attachment; filename="rate-card-${rateCard.customerName}.xlsx"`)
    headers.append('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    return new NextResponse(buf, { headers })
  } catch (error: any) {
    console.error('Excel export error:', error)
    return NextResponse.json({ error: 'Excel dosyası oluşturulamadı' }, { status: 500 })
  }
} 
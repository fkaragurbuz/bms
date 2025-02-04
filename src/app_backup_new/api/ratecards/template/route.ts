import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    // Şablon verilerini oluştur
    const templateData = [
      ['Müşteri Adı', ''],
      ['Başlangıç Tarihi', ''],
      ['Bitiş Tarihi', ''],
      [''], // Boş satır
      ['Kategori', 'Hizmet Adı', 'Birim Fiyat'],
      ['Ekip & Ekipman', '', ''],
      ['Post Prodüksiyon', '', ''],
      ['Prodüksiyon Harcama', '', '']
    ]

    // Workbook oluştur
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(templateData)

    // Sütun genişliklerini ayarla
    ws['!cols'] = [
      { wch: 20 }, // Kategori
      { wch: 30 }, // Hizmet Adı
      { wch: 15 }, // Birim Fiyat
    ]

    // Worksheet'i workbook'a ekle
    XLSX.utils.book_append_sheet(wb, ws, 'Rate Card')

    // Excel dosyasını oluştur
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Response headers
    const headers = {
      'Content-Disposition': 'attachment; filename="rate-card-template.xlsx"',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }

    return new NextResponse(buffer, { headers })
  } catch (error) {
    console.error('Template generation error:', error)
    return NextResponse.json(
      { error: 'Şablon oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
} 
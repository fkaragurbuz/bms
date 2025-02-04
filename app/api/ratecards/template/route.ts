import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    // Şablon verilerini oluştur
    const templateData = [
      ['Müşteri Adı:', 'Test Müşteri'],
      ['Başlangıç Tarihi:', new Date().toISOString().split('T')[0]],
      ['Bitiş Tarihi:', new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]],
      [''], // Boş satır
      ['Kategori', 'Hizmet Adı', 'Birim Fiyat'],
      ['Ekip & Ekipman', 'Kameraman', '5000'],
      ['Ekip & Ekipman', 'Ses Teknisyeni', '3000'],
      ['Post Prodüksiyon', 'Video Kurgu', '4000'],
      ['Prodüksiyon Harcama', 'Ulaşım', '2000']
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
    const headers = new Headers()
    headers.append('Content-Disposition', 'attachment; filename="rate-card-template.xlsx"')
    headers.append('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    return new NextResponse(buffer, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Şablon oluşturma hatası:', error)
    
    return NextResponse.json({
      error: 'Şablon oluşturma hatası',
      details: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'
    }, { status: 500 })
  }
} 
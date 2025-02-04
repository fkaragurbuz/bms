import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    // JSON dosyasını oku
    const filePath = path.join(process.cwd(), 'src/data/inventory.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(fileContents)

    // Seçilen çalışana ait malzemeleri filtrele
    const assignedItems = data.items.filter(
      (item: any) => item.assignedTo === parseInt(params.employeeId)
    )

    return NextResponse.json(assignedItems)
  } catch (error) {
    console.error('Zimmetli malzemeler getirilirken hata:', error)
    return NextResponse.json(
      { error: 'Zimmetli malzemeler getirilemedi' },
      { status: 500 }
    )
  }
} 
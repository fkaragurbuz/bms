import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'src/data/inventory.json')

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json({ error: 'Demirbaş dosyası bulunamadı' }, { status: 404 })
    }

    const inventory = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    const item = inventory.find((i: any) => i.id === params.id)

    if (!item) {
      return NextResponse.json({ error: 'Demirbaş bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Demirbaş okuma hatası:', error)
    return NextResponse.json({ 
      error: 'Demirbaş okunurken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const updateData = await request.json()
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    
    const itemIndex = data.inventory.findIndex((item: any) => item.id === id)
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Demirbaş bulunamadı' },
        { status: 404 }
      )
    }

    data.inventory[itemIndex] = {
      ...data.inventory[itemIndex],
      ...updateData,
      id
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
    
    return NextResponse.json(data.inventory[itemIndex])
  } catch (error) {
    console.error('Demirbaş güncellenirken hata:', error)
    return NextResponse.json(
      { error: 'Demirbaş güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const DATA_FILE = path.join(process.cwd(), 'data', 'notes.json')

// Dosyanın varlığını kontrol et ve yoksa oluştur
if (!fs.existsSync(DATA_FILE)) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
  fs.writeFileSync(DATA_FILE, '[]')
}

export async function GET() {
  try {
    const notes = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    return NextResponse.json(notes)
  } catch (error) {
    console.error('Notlar okunurken hata:', error)
    return NextResponse.json({ error: 'Notlar yüklenirken bir hata oluştu' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const notes = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    
    const newNote = {
      id: Date.now().toString(),
      customerName: data.customerName || '',
      subject: data.subject || '',
      date: data.date || new Date().toISOString().split('T')[0],
      content: data.content || '',
      createdBy: data.createdBy,
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    notes.push(newNote)
    fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2))
    
    return NextResponse.json(newNote)
  } catch (error) {
    console.error('Not oluşturma hatası:', error)
    return NextResponse.json(
      { error: 'Not oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Not ID\'si gerekli' },
        { status: 400 }
      )
    }

    const notes = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    const filteredNotes = notes.filter((note: any) => note.id !== id)

    if (notes.length === filteredNotes.length) {
      return NextResponse.json(
        { error: 'Not bulunamadı' },
        { status: 404 }
      )
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(filteredNotes, null, 2))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Not silinirken hata:', error)
    return NextResponse.json(
      { error: 'Not silinirken bir hata oluştu' },
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const NOTES_FILE_PATH = path.join(process.cwd(), 'data', 'proposal_notes.json')

async function readNotes() {
  try {
    const data = await fs.readFile(NOTES_FILE_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Notlar okunurken hata:', error)
    return { notes: {} }
  }
}

async function writeNotes(data: any) {
  try {
    await fs.writeFile(NOTES_FILE_PATH, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Notlar yazılırken hata:', error)
    throw error
  }
}

// Tüm notları getir
export async function GET() {
  try {
    const data = await readNotes()
    return NextResponse.json(data.notes)
  } catch (error) {
    return NextResponse.json({ error: 'Notlar alınırken bir hata oluştu' }, { status: 500 })
  }
}

// Yeni not ekle veya mevcut notu güncelle
export async function PUT(request: Request) {
  try {
    const { proposalId, note } = await request.json()
    
    if (!proposalId) {
      return NextResponse.json({ error: 'Teklif ID gerekli' }, { status: 400 })
    }

    const data = await readNotes()
    
    data.notes[proposalId] = {
      note,
      updatedAt: new Date().toISOString()
    }

    await writeNotes(data)
    
    return NextResponse.json(data.notes[proposalId])
  } catch (error) {
    return NextResponse.json({ error: 'Not güncellenirken bir hata oluştu' }, { status: 500 })
  }
}

// Not sil
export async function DELETE(request: Request) {
  try {
    const { proposalId } = await request.json()
    
    if (!proposalId) {
      return NextResponse.json({ error: 'Teklif ID gerekli' }, { status: 400 })
    }

    const data = await readNotes()
    
    if (data.notes[proposalId]) {
      delete data.notes[proposalId]
      await writeNotes(data)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Not silinirken bir hata oluştu' }, { status: 500 })
  }
} 
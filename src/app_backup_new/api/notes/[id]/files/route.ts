import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const DATA_FILE = path.join(process.cwd(), 'data', 'notes.json')

// Dizin kontrolü
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files')

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })
    }

    // Not kontrolü
    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json({ error: 'Not dosyası bulunamadı' }, { status: 404 })
    }

    const notesData = fs.readFileSync(DATA_FILE, 'utf-8')
    const notes = JSON.parse(notesData)
    const note = notes.find((n: any) => n.id === params.id)

    if (!note) {
      return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })
    }

    const uploadedFiles = []
    const errors = []

    for (const file of files) {
      try {
        if (!file || typeof file.arrayBuffer !== 'function') {
          errors.push(`Geçersiz dosya: ${file?.name || 'bilinmeyen'}`)
          continue
        }

        const fileName = `${Date.now()}-${file.name?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'unnamed'}`
        const filePath = path.join(UPLOAD_DIR, fileName)

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        try {
          fs.writeFileSync(filePath, buffer)
          uploadedFiles.push(fileName)
          console.log('Dosya yüklendi:', fileName)
        } catch (writeError) {
          errors.push(`Dosya yazma hatası (${file.name}): ${writeError.message}`)
          continue
        }
      } catch (fileError) {
        errors.push(`Dosya işleme hatası (${file?.name || 'bilinmeyen'}): ${fileError.message}`)
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json({ 
        error: 'Hiçbir dosya yüklenemedi', 
        details: errors 
      }, { status: 500 })
    }

    // Not dosyasını güncelle
    if (!note.files) note.files = []
    note.files.push(...uploadedFiles)
    note.updatedAt = new Date().toISOString()

    fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2))

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0 
        ? 'Bazı dosyalar yüklenirken hata oluştu'
        : 'Tüm dosyalar başarıyla yüklendi'
    })
  } catch (error) {
    console.error('Genel hata:', error)
    return NextResponse.json({ 
      error: 'Dosya yükleme hatası',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('file')

    if (!fileName) {
      return NextResponse.json({ error: 'Dosya adı gerekli' }, { status: 400 })
    }

    // Not kontrolü
    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json({ error: 'Not dosyası bulunamadı' }, { status: 404 })
    }

    const notes = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    const note = notes.find((n: any) => n.id === params.id)

    if (!note) {
      return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })
    }

    // Dosyayı sil
    const filePath = path.join(UPLOAD_DIR, fileName)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Not dosyasını güncelle
    note.files = (note.files || []).filter((f: string) => f !== fileName)
    note.updatedAt = new Date().toISOString()
    fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dosya silme hatası:', error)
    return NextResponse.json({ 
      error: 'Dosya silinemedi',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
} 
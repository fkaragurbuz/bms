import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const DATA_FILE = path.join(process.cwd(), 'data', 'notes.json')
const TEMPLATE_FILE = path.join(process.cwd(), 'templates', 'note-template.docx')

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Not verilerini oku
    const notes = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    const note = notes.find((n: any) => n.id === params.id)

    if (!note) {
      return NextResponse.json(
        { error: 'Not bulunamadı' },
        { status: 404 }
      )
    }

    // Şablon dosyasını oku
    const template = fs.readFileSync(TEMPLATE_FILE, 'binary')
    const zip = new PizZip(template)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    })

    // Şablona verileri yerleştir
    doc.render({
      id: note.id,
      customerName: note.customerName,
      subject: note.subject,
      date: format(new Date(note.date), 'dd MMMM yyyy', { locale: tr }),
      content: note.content,
      createdBy: note.createdBy.name,
      createdAt: format(new Date(note.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr }),
      updatedAt: format(new Date(note.updatedAt), 'dd MMMM yyyy HH:mm', { locale: tr })
    })

    // Word dosyasını oluştur
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    })

    // Dosyayı gönder
    const response = new NextResponse(buf)
    response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    response.headers.set('Content-Disposition', `attachment; filename="Not-${note.customerName}-${format(new Date(note.date), 'dd.MM.yyyy')}.docx"`)
    
    return response
  } catch (error) {
    console.error('Word dışa aktarma hatası:', error)
    return NextResponse.json(
      { error: 'Word dışa aktarma sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
} 
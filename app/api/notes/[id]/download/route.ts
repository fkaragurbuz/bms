import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { format } from 'date-fns';

const NOTES_FILE = path.join(process.cwd(), 'data', 'notes.json');

interface Note {
  id: string;
  customerName: string;
  subject: string;
  date: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  files?: string[];
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Not dosyasını oku
    const notesData = fs.readFileSync(NOTES_FILE, 'utf-8');
    const notes: Note[] = JSON.parse(notesData);
    const note = notes.find(n => n.id === params.id);

    if (!note) {
      return new NextResponse('Not bulunamadı', { status: 404 });
    }

    // Word dökümanı oluştur
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Not Detayı',
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            children: [new TextRun('')],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Müşteri Adı: ', bold: true }),
              new TextRun(note.customerName),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Konu: ', bold: true }),
              new TextRun(note.subject),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Tarih: ', bold: true }),
              new TextRun(format(new Date(note.date), 'dd.MM.yyyy')),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Oluşturan: ', bold: true }),
              new TextRun(note.createdBy),
            ],
          }),
          new Paragraph({
            children: [new TextRun('')],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'İçerik:', bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(note.content),
            ],
          }),
        ],
      }],
    });

    // Word dosyasını oluştur
    const buffer = await Packer.toBuffer(doc);

    // Response header'larını ayarla
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    headers.set('Content-Disposition', `attachment; filename=Not-${note.customerName}-${format(new Date(note.date), 'dd.MM.yyyy')}.docx`);

    return new NextResponse(buffer, { headers });
  } catch (error) {
    console.error('Word oluşturma hatası:', error);
    return new NextResponse('Word dosyası oluşturulurken bir hata oluştu', { status: 500 });
  }
} 
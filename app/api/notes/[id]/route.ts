import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const NOTES_FILE = path.join(process.cwd(), 'data', 'notes.json');
const FILES_DIR = path.join(process.cwd(), 'data', 'files', 'notes');

interface Note {
  id: string;
  customerName: string;
  subject: string;
  content: string;
  date: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  files?: { name: string; path: string; }[];
}

// Notları oku
async function readNotes(): Promise<Note[]> {
  const data = await fs.readFile(NOTES_FILE, 'utf-8');
  return JSON.parse(data);
}

// Notları yaz
async function writeNotes(data: Note[]) {
  await fs.writeFile(NOTES_FILE, JSON.stringify(data, null, 2));
}

// Not getir
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const notes = await readNotes();
    const note = notes.find((n) => n.id === id);
    
    if (!note) {
      return NextResponse.json(
        { error: 'Not bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Not getirme hatası:', error);
    return NextResponse.json(
      { error: 'Not getirilemedi' },
      { status: 500 }
    );
  }
}

// Not güncelle
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const formData = await request.formData();
    const customerName = formData.get('customerName') as string;
    const subject = formData.get('subject') as string;
    const content = formData.get('content') as string;
    const date = formData.get('date') as string;
    const files = formData.getAll('files');
    const existingFiles = JSON.parse(formData.get('existingFiles') as string || '[]');

    if (!customerName || !subject || !content || !date) {
      return NextResponse.json(
        { error: 'Müşteri adı, konu, tarih ve içerik gerekli' },
        { status: 400 }
      );
    }

    const notes = await readNotes();
    const noteIndex = notes.findIndex((n) => n.id === id);

    if (noteIndex === -1) {
      return NextResponse.json(
        { error: 'Not bulunamadı' },
        { status: 404 }
      );
    }

    // Mevcut notu güncelle
    const updatedNote: Note = {
      ...notes[noteIndex],
      customerName,
      subject,
      content,
      date,
      updatedAt: new Date().toISOString(),
      files: existingFiles // Mevcut dosyaları koru
    };

    // Yeni dosyalar varsa ekle
    if (files && files.length > 0) {
      const notePath = path.join(FILES_DIR, id);
      await fs.mkdir(notePath, { recursive: true });

      const savedFiles = await Promise.all(
        files.map(async (file: any) => {
          if (!file || typeof file.arrayBuffer !== 'function') {
            console.error('Geçersiz dosya:', file);
            return null;
          }

          try {
            const fileName = file.name;
            const filePath = path.join(notePath, fileName);
            const buffer = Buffer.from(await file.arrayBuffer());
            await fs.writeFile(filePath, buffer);
            
            return {
              name: fileName,
              path: `/api/notes/${id}/files/${fileName}`
            };
          } catch (error) {
            console.error('Dosya kaydetme hatası:', error);
            return null;
          }
        })
      );

      // Null olmayan dosyaları filtrele
      const validFiles = savedFiles.filter(file => file !== null);
      updatedNote.files = [...existingFiles, ...validFiles];
    }

    notes[noteIndex] = updatedNote;
    await writeNotes(notes);

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Not güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Not güncellenemedi' },
      { status: 500 }
    );
  }
}

// Not sil
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const notes = await readNotes();
    const noteIndex = notes.findIndex((n) => n.id === id);

    if (noteIndex === -1) {
      return NextResponse.json(
        { error: 'Not bulunamadı' },
        { status: 404 }
      );
    }

    // Dosyaları sil
    const notePath = path.join(FILES_DIR, id);
    try {
      await fs.rm(notePath, { recursive: true, force: true });
    } catch (error) {
      console.error('Dosyalar silinirken hata:', error);
    }

    notes.splice(noteIndex, 1);
    await writeNotes(notes);

    return NextResponse.json({ message: 'Not başarıyla silindi' });
  } catch (error) {
    console.error('Not silme hatası:', error);
    return NextResponse.json(
      { error: 'Not silinemedi' },
      { status: 500 }
    );
  }
} 
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

// Dosya sil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; filename: string } }
) {
  try {
    const { id, filename } = params;
    
    // Not dosyasını güncelle
    const notes = await readNotes();
    const noteIndex = notes.findIndex((n) => n.id === id);

    if (noteIndex === -1) {
      return NextResponse.json(
        { error: 'Not bulunamadı' },
        { status: 404 }
      );
    }

    // Dosyayı fiziksel olarak sil
    const filePath = path.join(FILES_DIR, id, filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Dosya silme hatası:', error);
    }

    // Not'un files dizisinden dosyayı kaldır
    const note = notes[noteIndex];
    if (note.files) {
      note.files = note.files.filter(file => file.name !== filename);
      notes[noteIndex] = note;
      await writeNotes(notes);
    }

    return NextResponse.json({ message: 'Dosya başarıyla silindi' });
  } catch (error) {
    console.error('Dosya silme hatası:', error);
    return NextResponse.json(
      { error: 'Dosya silinemedi' },
      { status: 500 }
    );
  }
}

// Dosya görüntüle
export async function GET(
  request: Request,
  { params }: { params: { id: string; filename: string } }
) {
  try {
    const { id, filename } = params;
    const filePath = path.join(FILES_DIR, id, filename);

    try {
      const fileBuffer = await fs.readFile(filePath);
      const contentType = getContentType(filename);

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    } catch (error) {
      console.error('Dosya okuma hatası:', error);
      return new NextResponse('Dosya bulunamadı', { status: 404 });
    }
  } catch (error) {
    console.error('Dosya görüntüleme hatası:', error);
    return new NextResponse('Dosya görüntülenemedi', { status: 500 });
  }
}

// Dosya uzantısına göre content type belirle
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: { [key: string]: string } = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif'
  };
  return contentTypes[ext] || 'application/octet-stream';
} 
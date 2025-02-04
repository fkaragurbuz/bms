import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const NOTES_FILE = path.join(process.cwd(), 'data', 'notes.json');

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

// Dosyanın varlığını kontrol et
async function ensureFile() {
  try {
    await fs.access(NOTES_FILE);
  } catch {
    await fs.writeFile(NOTES_FILE, '[]');
  }
}

// Notları oku
async function readNotes(): Promise<Note[]> {
  await ensureFile();
  const data = await fs.readFile(NOTES_FILE, 'utf8');
  return JSON.parse(data);
}

// Notları yaz
async function writeNotes(notes: Note[]) {
  await ensureFile();
  await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2));
}

// Tüm notları getir
export async function GET() {
  try {
    const notes = await readNotes();
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Notlar getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Notlar getirilemedi' },
      { status: 500 }
    );
  }
}

// Yeni not ekle
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const customerName = formData.get('customerName') as string;
    const subject = formData.get('subject') as string;
    const content = formData.get('content') as string;
    const date = formData.get('date') as string;
    const createdBy = formData.get('createdBy') as string;
    const files = formData.getAll('files') as File[];

    if (!customerName || !subject || !content || !date || !createdBy) {
      return NextResponse.json(
        { error: 'Tüm alanlar gerekli' },
        { status: 400 }
      );
    }

    const notes = await readNotes();
    const newNote: Note = {
      id: Date.now().toString(),
      customerName,
      subject,
      content,
      date,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      files: []
    };

    // Dosyaları kaydet
    if (files && files.length > 0) {
      const notePath = path.join(process.cwd(), 'data', 'files', 'notes', newNote.id);
      await fs.mkdir(notePath, { recursive: true });

      const savedFiles = await Promise.all(
        files.map(async (file) => {
          const fileName = file.name;
          const filePath = path.join(notePath, fileName);
          const buffer = Buffer.from(await file.arrayBuffer());
          await fs.writeFile(filePath, buffer);
          return {
            name: fileName,
            path: `/api/notes/${newNote.id}/files/${fileName}`
          };
        })
      );

      newNote.files = savedFiles;
    }

    notes.push(newNote);
    await writeNotes(notes);

    return NextResponse.json(newNote);
  } catch (error) {
    console.error('Not eklenirken hata:', error);
    return NextResponse.json(
      { error: 'Not eklenemedi' },
      { status: 500 }
    );
  }
} 
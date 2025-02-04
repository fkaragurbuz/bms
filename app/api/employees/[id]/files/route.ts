import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const BASE_UPLOAD_DIR = path.join(process.cwd(), 'data', 'files', 'employees');

// Çalışan klasörünü oluştur
async function ensureEmployeeDir(employeeId: string): Promise<string> {
  const employeeDir = path.join(BASE_UPLOAD_DIR, employeeId);
  try {
    await fs.access(employeeDir);
  } catch {
    await fs.mkdir(employeeDir, { recursive: true });
  }
  return employeeDir;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const employeeDir = await ensureEmployeeDir(id);
    const formData = await request.formData();
    const files = formData.getAll('files');
    console.log('Yüklenecek dosya sayısı:', files.length);

    const savedFiles = [];

    for (const fileEntry of files) {
      try {
        if (!(fileEntry instanceof Blob)) {
          console.error('Geçersiz dosya:', fileEntry);
          continue;
        }

        const originalName = (fileEntry as any).name;
        const timestamp = Date.now();
        const fileName = `${timestamp}-${originalName}`;
        const filePath = path.join(employeeDir, fileName);
        
        const arrayBuffer = await fileEntry.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log('Dosya kaydediliyor:', {
          originalName,
          fileName,
          filePath,
          size: buffer.length
        });

        await fs.writeFile(filePath, buffer);
        console.log('Dosya başarıyla kaydedildi:', filePath);

        savedFiles.push(fileName);
      } catch (fileError) {
        console.error('Dosya işleme hatası:', fileError);
      }
    }

    if (savedFiles.length === 0) {
      return NextResponse.json(
        { error: 'Hiçbir dosya yüklenemedi' },
        { status: 400 }
      );
    }

    console.log('Başarıyla yüklenen dosyalar:', savedFiles);
    return NextResponse.json({ files: savedFiles });
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    return NextResponse.json(
      { error: 'Dosya yüklenemedi' },
      { status: 500 }
    );
  }
}
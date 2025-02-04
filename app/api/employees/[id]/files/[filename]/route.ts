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

export async function GET(
  request: Request,
  { params }: { params: { id: string; filename: string } }
) {
  const { id, filename: encodedFilename } = params;
  const filename = decodeURIComponent(encodedFilename);
  
  try {
    const employeeDir = await ensureEmployeeDir(id);
    
    // Dizindeki dosyaları oku
    const files = await fs.readdir(employeeDir);
    
    // Timestamp'li dosya adını bul
    const timestampedFilename = files.find(file => file.endsWith(filename));
    
    if (!timestampedFilename) {
      console.error(`Dosya bulunamadı: ${filename}`);
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 404 }
      );
    }

    const filePath = path.join(employeeDir, timestampedFilename);
    console.log('Dosya okunuyor:', filePath);

    try {
      const fileBuffer = await fs.readFile(filePath);
      const headers = new Headers();
      headers.set('Content-Type', 'application/octet-stream');
      headers.set(
        'Content-Disposition', 
        `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
      );

      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      });
    } catch (err) {
      console.error(`Dosya bulunamadı (${filePath}):`, err);
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 404 }
      );
    }
  } catch (err) {
    console.error(`Dosya indirme hatası (${filename}):`, err);
    return NextResponse.json(
      { error: 'Dosya indirilemedi' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; filename: string } }
) {
  const { id, filename: encodedFilename } = params;
  const filename = decodeURIComponent(encodedFilename);
  
  try {
    const employeeDir = await ensureEmployeeDir(id);
    
    // Dizindeki dosyaları oku
    const files = await fs.readdir(employeeDir);
    
    // Timestamp'li dosya adını bul
    const timestampedFilename = files.find(file => file.endsWith(filename));
    
    if (!timestampedFilename) {
      console.error(`Dosya bulunamadı: ${filename}`);
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 404 }
      );
    }

    const filePath = path.join(employeeDir, timestampedFilename);
    console.log('Dosya siliniyor:', filePath);

    try {
      await fs.unlink(filePath);
      console.log('Dosya başarıyla silindi:', filePath);
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error(`Dosya bulunamadı (${filePath}):`, err);
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 404 }
      );
    }
  } catch (err) {
    console.error(`Dosya silme hatası (${filename}):`, err);
    return NextResponse.json(
      { error: 'Dosya silinemedi' },
      { status: 500 }
    );
  }
} 
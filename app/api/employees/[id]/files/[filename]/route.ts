import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'files', 'employees');

export async function GET(
  request: Request,
  { params }: { params: { id: string; filename: string } }
) {
  try {
    const { filename } = await params;
    const filePath = path.join(UPLOAD_DIR, filename);
    console.log('Trying to read file:', filePath);

    try {
      const fileBuffer = await fs.readFile(filePath);
      const headers = new Headers();
      headers.set('Content-Type', 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);

      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      });
    } catch (error) {
      console.error('File not found:', filePath);
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Dosya indirme hatası:', error);
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
  try {
    const { filename } = await params;
    const filePath = path.join(UPLOAD_DIR, filename);
    console.log('Trying to delete file:', filePath);

    try {
      await fs.unlink(filePath);
      console.log('File deleted successfully:', filePath);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('File not found:', filePath);
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Dosya silme hatası:', error);
    return NextResponse.json(
      { error: 'Dosya silinemedi' },
      { status: 500 }
    );
  }
} 
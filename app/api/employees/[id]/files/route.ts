import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'files', 'employees');

// Dizini oluştur
try {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
} catch (error) {
  console.error('Error creating directory:', error);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    console.log('Number of files:', files.length);

    const savedFiles = [];

    for (const fileEntry of files) {
      try {
        if (!(fileEntry instanceof Blob)) {
          console.error('Invalid file entry:', fileEntry);
          continue;
        }

        const fileName = (fileEntry as any).name;
        const filePath = path.join(UPLOAD_DIR, fileName);
        
        const arrayBuffer = await fileEntry.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log('Saving file:', {
          fileName,
          filePath,
          size: buffer.length
        });

        await fs.writeFile(filePath, buffer);
        console.log('File saved successfully:', filePath);

        savedFiles.push(fileName);
      } catch (fileError) {
        console.error('Error processing file:', fileError);
      }
    }

    if (savedFiles.length === 0) {
      return NextResponse.json(
        { error: 'Hiçbir dosya yüklenemedi' },
        { status: 400 }
      );
    }

    console.log('Successfully uploaded files:', savedFiles);
    return NextResponse.json({ files: savedFiles });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Dosya yüklenemedi' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Dosya adını benzersiz yap
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const uploadDir = path.join(process.cwd(), 'public/uploads')
    const filePath = path.join(uploadDir, fileName)

    // Dosyayı kaydet
    await writeFile(filePath, buffer)

    return NextResponse.json({
      id: timestamp.toString(),
      name: file.name,
      path: `/uploads/${fileName}`,
      uploadDate: new Date().toISOString()
    })
  } catch (error) {
    console.error('Dosya yükleme hatası:', error)
    return NextResponse.json(
      { error: 'Dosya yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
} 
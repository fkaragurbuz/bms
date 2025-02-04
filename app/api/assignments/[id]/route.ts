import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET - Görevlendirmeyi getir
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: true,
        items: {
          include: {
            inventory: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Görevlendirme bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Görevlendirme getirilirken hata:', error)
    return NextResponse.json({ error: 'Görevlendirme getirilirken bir hata oluştu' }, { status: 500 })
  }
}

// PUT - Görevlendirmeyi güncelle
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { date, items } = body

    // Önce mevcut öğeleri sil
    await prisma.assignmentItem.deleteMany({
      where: { assignmentId: parseInt(id) }
    })

    // Görevlendirmeyi güncelle ve yeni öğeleri ekle
    const assignment = await prisma.assignment.update({
      where: { id: parseInt(id) },
      data: {
        date,
        items: {
          create: items.map((item: any) => ({
            inventoryId: item.inventoryId,
            quantity: item.quantity
          }))
        }
      },
      include: {
        employee: true,
        items: {
          include: {
            inventory: true
          }
        }
      }
    })

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Görevlendirme güncellenirken hata:', error)
    return NextResponse.json({ error: 'Görevlendirme güncellenirken bir hata oluştu' }, { status: 500 })
  }
}

// DELETE - Görevlendirmeyi sil
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    await prisma.assignment.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Görevlendirme silinirken hata:', error)
    return NextResponse.json({ error: 'Görevlendirme silinirken bir hata oluştu' }, { status: 500 })
  }
} 
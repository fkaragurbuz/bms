import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET - Görevlendirmeleri getir
export async function GET() {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        employee: true,
        items: {
          include: {
            inventory: true
          }
        }
      }
    })
    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Görevlendirmeler getirilirken hata:', error)
    return NextResponse.json({ error: 'Görevlendirmeler getirilirken bir hata oluştu' }, { status: 500 })
  }
}

// POST - Yeni görevlendirme ekle
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { employeeId, date, items } = body

    const assignment = await prisma.assignment.create({
      data: {
        employeeId,
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
    console.error('Görevlendirme eklenirken hata:', error)
    return NextResponse.json({ error: 'Görevlendirme eklenirken bir hata oluştu' }, { status: 500 })
  }
} 
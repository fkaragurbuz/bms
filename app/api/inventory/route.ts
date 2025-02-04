import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET - Envanter ürünlerini getir
export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany()
    return NextResponse.json(inventory)
  } catch (error) {
    console.error('Envanter getirilirken hata:', error)
    return NextResponse.json({ error: 'Envanter getirilirken bir hata oluştu' }, { status: 500 })
  }
}

// POST - Yeni envanter ürünü ekle
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, quantity, unit } = body

    const item = await prisma.inventory.create({
      data: {
        name,
        quantity,
        unit
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Envanter ürünü eklenirken hata:', error)
    return NextResponse.json({ error: 'Envanter ürünü eklenirken bir hata oluştu' }, { status: 500 })
  }
} 
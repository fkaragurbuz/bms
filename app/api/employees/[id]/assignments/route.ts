import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ASSIGNMENTS_FILE = path.join(process.cwd(), 'data', 'assignments.json')

// Çalışana ait zimmetleri getir
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = parseInt(params.id)
    const data = JSON.parse(fs.readFileSync(ASSIGNMENTS_FILE, 'utf-8'))
    
    // Çalışana ait zimmetleri filtrele
    const employeeAssignments = data.assignments.filter(
      (assignment: any) => assignment.employeeId === employeeId
    )

    return NextResponse.json(employeeAssignments)
  } catch (error) {
    console.error('Zimmet bilgileri alınırken hata:', error)
    return NextResponse.json(
      { error: 'Zimmet bilgileri alınırken bir hata oluştu' },
      { status: 500 }
    )
  }
} 
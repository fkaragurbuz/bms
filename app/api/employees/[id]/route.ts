import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import fs_sync from 'fs'
import path from 'path'

const EMPLOYEES_FILE = path.join(process.cwd(), 'data', 'employees.json')

interface Employee {
  id: string
  fullName: string
  tcNo: string
  birthDate: string
  sgkNo: string
  startDate: string
  endDate?: string
  isActive: boolean
  phone: string
  documents: {
    id: string
    name: string
    path: string
    uploadDate: string
  }[]
}

// Çalışanları oku
async function readEmployees(): Promise<Employee[]> {
  const data = await fs.readFile(EMPLOYEES_FILE, 'utf-8')
  return JSON.parse(data)
}

// Çalışanları yaz
async function writeEmployees(data: Employee[]) {
  await fs.writeFile(EMPLOYEES_FILE, JSON.stringify(data, null, 2))
}

// Çalışan getir
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const employees = await readEmployees()
    const employee = employees.find((n) => n.id === id)
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Çalışan bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Çalışan getirme hatası:', error)
    return NextResponse.json(
      { error: 'Çalışan getirilemedi' },
      { status: 500 }
    )
  }
}

// Çalışan güncelle
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const data = await request.json()
    const {
      fullName,
      tcNo,
      birthDate,
      sgkNo,
      startDate,
      endDate,
      isActive,
      phone,
      documents = []
    } = data

    if (!fullName || !tcNo || !birthDate || !sgkNo || !startDate || !phone) {
      return NextResponse.json(
        { error: 'Tüm alanlar gerekli' },
        { status: 400 }
      )
    }

    const employees = await readEmployees()
    const employeeIndex = employees.findIndex((n) => n.id === id)

    if (employeeIndex === -1) {
      return NextResponse.json(
        { error: 'Çalışan bulunamadı' },
        { status: 404 }
      )
    }

    // TC No kontrolü (kendi TC No'su hariç)
    if (employees.some(e => e.tcNo === tcNo && e.id !== id)) {
      return NextResponse.json(
        { error: 'Bu TC kimlik numarası ile kayıtlı başka bir çalışan var' },
        { status: 400 }
      )
    }

    // Mevcut çalışanı güncelle
    const updatedEmployee: Employee = {
      ...employees[employeeIndex],
      fullName,
      tcNo,
      birthDate,
      sgkNo,
      startDate,
      endDate,
      isActive,
      phone,
      documents
    }

    employees[employeeIndex] = updatedEmployee
    await writeEmployees(employees)

    return NextResponse.json(updatedEmployee)
  } catch (error) {
    console.error('Çalışan güncelleme hatası:', error)
    return NextResponse.json(
      { error: 'Çalışan güncellenemedi' },
      { status: 500 }
    )
  }
}

// Çalışan sil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const employees = await readEmployees();
    const employeeIndex = employees.findIndex((n) => n.id === id);

    if (employeeIndex === -1) {
      return NextResponse.json(
        { error: 'Çalışan bulunamadı' },
        { status: 404 }
      );
    }

    // Çalışanın dosyalarını sil
    const employee = employees[employeeIndex];
    if (employee.documents && employee.documents.length > 0) {
      const UPLOAD_DIR = path.join(process.cwd(), 'data', 'files', 'employees');
      for (const doc of employee.documents) {
        const filePath = path.join(UPLOAD_DIR, doc.path);
        try {
          if (fs_sync.existsSync(filePath)) {
            fs_sync.unlinkSync(filePath);
          }
        } catch (error) {
          console.error('Dosya silme hatası:', error);
        }
      }
    }

    // Çalışanı sil
    employees.splice(employeeIndex, 1);
    await writeEmployees(employees);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Çalışan silme hatası:', error);
    return NextResponse.json(
      { error: 'Çalışan silinemedi' },
      { status: 500 }
    );
  }
} 
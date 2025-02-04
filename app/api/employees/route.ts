import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const EMPLOYEES_FILE = path.join(process.cwd(), 'data', 'employees.json');

interface Employee {
  id: string;
  fullName: string;
  tcNo: string;
  birthDate: string;
  sgkNo: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  phone: string;
  documents: {
    id: string;
    name: string;
    path: string;
    uploadDate: string;
  }[];
}

// Dosyanın varlığını kontrol et
async function ensureFile() {
  try {
    await fs.access(EMPLOYEES_FILE);
  } catch {
    await fs.writeFile(EMPLOYEES_FILE, '[]');
  }
}

// Çalışanları oku
async function readEmployees(): Promise<Employee[]> {
  await ensureFile();
  const data = await fs.readFile(EMPLOYEES_FILE, 'utf8');
  return JSON.parse(data);
}

// Çalışanları yaz
async function writeEmployees(employees: Employee[]) {
  await ensureFile();
  await fs.writeFile(EMPLOYEES_FILE, JSON.stringify(employees, null, 2));
}

// Tüm çalışanları getir
export async function GET() {
  try {
    const employees = await readEmployees();
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Çalışanlar getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Çalışanlar getirilemedi' },
      { status: 500 }
    );
  }
}

// Yeni çalışan ekle
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      fullName,
      tcNo,
      birthDate,
      sgkNo,
      startDate,
      isActive = true,
      phone,
      documents = []
    } = data;

    if (!fullName || !tcNo || !birthDate || !sgkNo || !startDate || !phone) {
      return NextResponse.json(
        { error: 'Tüm alanlar gerekli' },
        { status: 400 }
      );
    }

    const employees = await readEmployees();
    
    // TC No kontrolü
    if (employees.some(e => e.tcNo === tcNo)) {
      return NextResponse.json(
        { error: 'Bu TC kimlik numarası ile kayıtlı bir çalışan zaten var' },
        { status: 400 }
      );
    }

    const newEmployee: Employee = {
      id: Date.now().toString(),
      fullName,
      tcNo,
      birthDate,
      sgkNo,
      startDate,
      isActive,
      phone,
      documents
    };

    employees.push(newEmployee);
    await writeEmployees(employees);

    return NextResponse.json(newEmployee);
  } catch (error) {
    console.error('Çalışan eklenirken hata:', error);
    return NextResponse.json(
      { error: 'Çalışan eklenemedi' },
      { status: 500 }
    );
  }
} 
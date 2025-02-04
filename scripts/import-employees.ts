const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function importEmployees() {
  try {
    // Envanter verilerini oku
    const inventoryData = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data/inventory.json'), 'utf-8')
    )

    // Benzersiz çalışan listesini oluştur
    const uniqueEmployees = new Set<string>()
    inventoryData.forEach((item: any) => {
      if (item.personnel && item.personnel.trim() !== '') {
        uniqueEmployees.add(item.personnel)
      }
    })

    console.log(`${uniqueEmployees.size} çalışan bulundu.`)

    // Her çalışan için veritabanına kayıt ekle
    for (const employeeName of uniqueEmployees) {
      const employee = await prisma.employee.create({
        data: {
          id: BigInt(Date.now() + Math.floor(Math.random() * 1000)),
          name: employeeName.toString(),
          tckn: '',
          sgkNo: '',
          birthDate: new Date(),
          startDate: new Date(),
          department: '',
          position: '',
          status: 'Aktif',
          documents: []
        }
      })
      console.log(`${employee.name} eklendi.`)
    }

    console.log('Çalışanlar başarıyla aktarıldı.')
  } catch (error) {
    console.error('Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importEmployees() 
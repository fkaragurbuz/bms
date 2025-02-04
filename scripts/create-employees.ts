const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const employees = [
  "BÜŞRA GÜL",
  "TOLGA TANER",
  "MERT ÇAVDAR",
  "DOĞA EREN KAZANCI",
  "AZİME NUR BİLİCİ",
  "EGE TAYBARS",
  "ÇİĞSE YANIK",
  "SEMİH KALKAN",
  "CEYLAN DİŞBUDAK",
  "AHMET TARHAN",
  "DAĞHAN KOZANOĞLU",
  "OĞULCAN DELİKKAYA",
  "ÖZKAN EVCİ",
  "HELİN BOZDAĞ",
  "BAHTİYAR ÇAL"
]

async function createEmployees() {
  try {
    for (const name of employees) {
      const email = name.toLowerCase()
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/\s+/g, '.')
        + '@sirket.com'

      await prisma.employee.create({
        data: {
          id: BigInt(Date.now() + Math.floor(Math.random() * 1000)),
          name: name,
          email: email,
          department: 'Yazılım',
          position: 'Yazılım Geliştirici',
          phone: '',
          tckn: '',
          sgkNo: '',
          birthDate: new Date(),
          startDate: new Date(),
          status: 'Aktif',
          documents: []
        }
      })
      
      console.log(`${name} eklendi`)
    }

    console.log('Tüm çalışanlar başarıyla eklendi')
  } catch (error) {
    console.error('Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createEmployees() 
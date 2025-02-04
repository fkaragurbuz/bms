const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateRateCards() {
  try {
    // JSON dosyasını oku
    const dataFilePath = path.join(process.cwd(), 'data', 'ratecards.json')
    const fileContent = fs.readFileSync(dataFilePath, 'utf-8')
    const rateCards = JSON.parse(fileContent)

    // Admin kullanıcısını bul (varsayılan olarak ilk admin kullanıcısını alıyoruz)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'Admin' }
    })

    if (!adminUser) {
      throw new Error('Admin user not found')
    }

    // Her rate card için
    for (const card of rateCards) {
      // Rate card'ı oluştur
      await prisma.rateCard.create({
        data: {
          customerName: card.customerName,
          startDate: new Date(card.startDate),
          endDate: new Date(card.endDate),
          userId: adminUser.id,
          categories: {
            create: card.categories.map((category: any) => ({
              name: category.name,
              services: {
                create: category.services.map((service: any) => ({
                  name: service.name,
                  price: parseFloat(service.price)
                }))
              }
            }))
          }
        }
      })
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateRateCards() 
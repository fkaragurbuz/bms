const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function importData() {
  try {
    // Employees verilerini yükle
    const employeesData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/employees.json'), 'utf-8'))
    for (const employee of employeesData.employees) {
      await prisma.employee.create({
        data: {
          id: BigInt(employee.id),
          tckn: employee.tckn,
          name: employee.name,
          sgkNo: employee.sgkNo,
          birthDate: new Date(employee.birthDate),
          startDate: new Date(employee.startDate),
          department: employee.department,
          position: employee.position,
          phone: employee.phone,
          email: employee.email,
          status: employee.status,
          documents: employee.documents,
          endDate: employee.endDate ? new Date(employee.endDate) : null,
        },
      })
    }
    console.log('Employees imported successfully')

    // Inventory verilerini yükle
    const inventoryData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/inventory.json'), 'utf-8'))
    for (const item of inventoryData.inventory) {
      await prisma.inventory.create({
        data: {
          id: BigInt(item.id),
          name: `${item.materialType} - ${item.brand} ${item.model}`.trim(),
          type: item.materialType,
          brand: item.brand,
          model: item.model,
          serialNo: item.serialNumber ? String(item.serialNumber) : null,
          quantity: item.quantity,
          status: item.status,
        },
      })
    }
    console.log('Inventory imported successfully')

    // Assignments verilerini yükle
    const assignmentsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/assignments.json'), 'utf-8'))
    for (const assignment of assignmentsData.assignments) {
      const newAssignment = await prisma.assignment.create({
        data: {
          id: BigInt(assignment.id),
          employeeId: BigInt(assignment.employeeId),
          assignmentDate: new Date(assignment.assignmentDate),
          status: assignment.status,
        },
      })

      // Assignment items'ları yükle
      for (const item of assignment.items) {
        await prisma.assignmentItem.create({
          data: {
            inventoryId: BigInt(item.id),
            assignmentId: newAssignment.id,
            quantity: item.quantity,
          },
        })
      }
    }
    console.log('Assignments imported successfully')

  } catch (error) {
    console.error('Error importing data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importData() 
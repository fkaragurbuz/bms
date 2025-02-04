import { promises as fs } from 'fs'
import path from 'path'

const PROPOSALS_FILE = path.join(process.cwd(), 'data/proposals.json')

async function removeDescriptionField() {
  try {
    // Dosyayı oku
    const data = await fs.readFile(PROPOSALS_FILE, 'utf8')
    const proposals = JSON.parse(data)

    // Her tekliften description alanını kaldır
    const updatedProposals = proposals.map((proposal: any) => {
      const { description, ...rest } = proposal
      return rest
    })

    // Güncellenmiş veriyi yaz
    await fs.writeFile(
      PROPOSALS_FILE,
      JSON.stringify(updatedProposals, null, 2)
    )

    console.log('Description alanı başarıyla kaldırıldı.')
  } catch (error) {
    console.error('Hata:', error)
  }
}

removeDescriptionField() 
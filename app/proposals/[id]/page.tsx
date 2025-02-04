'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'
import { Topic } from '../add/types'
import * as XLSX from 'xlsx'
import { TDocumentDefinitions } from 'pdfmake/interfaces'
import { pdf } from '@react-pdf/renderer'
const pdfMake = require('pdfmake/build/pdfmake')
require('pdfmake/build/vfs_fonts')
import fs from 'fs'
import { PDFDownloadLink, BlobProvider } from '@react-pdf/renderer'
import ProposalPDF from './ProposalPDF'

interface Proposal {
  id: string
  customerName: string
  projectName: string
  date: string
  topics: Topic[]
  totalAmount: number
  discount?: {
    type: 'percentage' | 'amount'
    value: number
  }
  terms?: string
  showTotal: boolean
  agencyCommission?: {
    type: 'percentage' | 'amount'
    value: number
  }
}

function formatPrice(price: number): string {
  return `₺${price.toLocaleString('tr-TR', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

function calculateSubTotal(proposal: Proposal): number {
  return proposal.topics.reduce((total, topic) => 
    total + topic.categories.reduce((categoryTotal, category) => 
      categoryTotal + category.services.reduce((serviceTotal, service) => 
        serviceTotal + service.totalPrice, 0
      ), 0
    ), 0
  )
}

function calculateDiscountAmount(proposal: Proposal, subTotal: number): number {
  if (!proposal.discount) return 0

  if (proposal.discount.type === 'percentage') {
    return subTotal * (proposal.discount.value / 100)
  }
  return proposal.discount.value
}

function calculateAfterDiscount(proposal: Proposal, subtotal: number, discountAmount: number): number {
  return subtotal - discountAmount
}

function calculateAgencyCommissionAmount(proposal: Proposal, subtotal: number, afterDiscount: number): number {
  if (!proposal.agencyCommission) return 0

  if (proposal.agencyCommission.type === 'percentage') {
    return afterDiscount * (proposal.agencyCommission.value / 100)
  } else {
    return proposal.agencyCommission.value
  }
}

function calculateFinalTotal(proposal: Proposal, subTotal: number, discountAmount: number): number {
  const afterDiscount = calculateAfterDiscount(proposal, subTotal, discountAmount)
  const commissionAmount = calculateAgencyCommissionAmount(proposal, subTotal, afterDiscount)
  return afterDiscount + commissionAmount
}

export default function ProposalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isPdfLoading, setIsPdfLoading] = useState(false)

  useEffect(() => {
    const fetchProposal = async () => {
      if (!params?.id) return

      try {
        const response = await fetch(`/api/proposals/${params.id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Teklif yüklenirken bir hata oluştu')
        }

        console.log('API response:', data)
        console.log('Discount data:', data.discount)

        setProposal(data)
      } catch (err: any) {
        setError(err.message)
        console.error('Teklif yüklenirken hata:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProposal()
  }, [params?.id])

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-5xl mx-auto p-8">
          <div className="text-center">Yükleniyor...</div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="max-w-5xl mx-auto p-8">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </>
    )
  }

  if (!proposal) {
    return (
      <>
        <Header />
        <div className="max-w-5xl mx-auto p-8">
          <div className="text-center">Teklif bulunamadı</div>
        </div>
      </>
    )
  }

  const subTotal = calculateSubTotal(proposal)
  const discountAmount = calculateDiscountAmount(proposal, subTotal)
  const finalTotal = calculateFinalTotal(proposal, subTotal, discountAmount)

  const handleExcelExport = async () => {
    if (!proposal) return

    // Logo verilerini al
    try {
      const response = await fetch('/api/logo')
      const data = await response.json()
      let logoData = data.logo
      if (!logoData.startsWith('data:image')) {
        logoData = `data:image/png;base64,${data.logo}`
      }

      const workbook = XLSX.utils.book_new()
      
      // Tüm konular için tek bir veri dizisi oluştur
      const sheetData = [
        // Logo için boş satır
        [''],
        [''],
        [''],
        // Müşteri bilgileri
        [proposal.customerName, '', '', '', '', new Date(proposal.date).toLocaleDateString('tr-TR')],
        ['']
      ]

      // Her konu için verileri ekle
      proposal.topics.forEach((topic, topicIndex) => {
        // Konular arası boşluk
        if (topicIndex > 0) {
          sheetData.push([''], [''])
        }

        // Konu başlığı
        sheetData.push(
          [''],
          [topic.name, '', 'GÜN/KAŞE', 'ADET', 'BİRİM FİYAT', 'TOPLAM FİYAT']
        )

        // Kategoriler ve hizmetler
        topic.categories.forEach((category, categoryIndex) => {
          // Kategori başlığı
          sheetData.push([
            (categoryIndex + 1).toString(),
            category.name,
            '',
            '',
            '',
            formatPrice(category.services.reduce((sum, service) => sum + service.totalPrice, 0))
          ])
          
          // Hizmetler
          category.services.forEach((service, serviceIndex) => {
            sheetData.push([
              `${categoryIndex + 1}.${serviceIndex + 1}`,
              service.name,
              service.days.toString(),
              service.quantity.toString(),
              formatPrice(service.price),
              formatPrice(service.totalPrice)
            ])
          })
        })

        // Konu toplamı
        const topicTotal = topic.categories.reduce((total, category) => 
          total + category.services.reduce((sum, service) => sum + service.totalPrice, 0), 0
        )
        sheetData.push(
          [''],
          ['', '', '', '', 'TOPLAM:', formatPrice(topicTotal)]
        )

        // Tek konu varsa ve showTotal true ise indirim ve genel toplam
        if (proposal.topics.length === 1 && proposal.showTotal) {
          if (proposal.discount && proposal.discount.value > 0) {
            sheetData.push(
              ['', '', '', '', `İNDİRİM ${proposal.discount.type === 'percentage' ? `(%${proposal.discount.value})` : ''}:`, formatPrice(discountAmount)],
              ['', '', '', '', 'İNDİRİMLİ TUTAR:', formatPrice(calculateAfterDiscount(proposal, subTotal, discountAmount))]
            )
          }
          if (proposal.agencyCommission) {
            sheetData.push(
              ['', '', '', '', `AJANS KOMİSYONU ${proposal.agencyCommission.type === 'percentage' ? `(%${proposal.agencyCommission.value})` : ''}:`, 
              formatPrice(calculateAgencyCommissionAmount(proposal, subTotal, calculateAfterDiscount(proposal, subTotal, discountAmount)))]
            )
          }
          sheetData.push(['', '', '', '', 'GENEL TOPLAM:', formatPrice(finalTotal)])
        }
      })

      // Birden fazla konu varsa ve showTotal true ise genel toplam
      if (proposal.topics.length > 1 && proposal.showTotal) {
        sheetData.push(
          [''],
          [''],
          ['GENEL ÖZET'],
          [''],
          ['', '', '', '', 'TOPLAM:', formatPrice(subTotal)]
        )
        if (proposal.discount && proposal.discount.value > 0) {
          sheetData.push(
            ['', '', '', '', `İNDİRİM ${proposal.discount.type === 'percentage' ? `(%${proposal.discount.value})` : ''}:`, formatPrice(discountAmount)],
            ['', '', '', '', 'İNDİRİMLİ TUTAR:', formatPrice(calculateAfterDiscount(proposal, subTotal, discountAmount))]
          )
        }
        if (proposal.agencyCommission) {
          sheetData.push(
            ['', '', '', '', `AJANS KOMİSYONU ${proposal.agencyCommission.type === 'percentage' ? `(%${proposal.agencyCommission.value})` : ''}:`, 
            formatPrice(calculateAgencyCommissionAmount(proposal, subTotal, calculateAfterDiscount(proposal, subTotal, discountAmount)))]
          )
        }
        sheetData.push(['', '', '', '', 'GENEL TOPLAM:', formatPrice(finalTotal)])
      }

      const ws = XLSX.utils.aoa_to_sheet(sheetData)

      // Logo ekle
      try {
        const imageData = logoData.split(',')[1]
        ws['!drawing'] = {
          'logo': {
            'type': 'picture',
            'position': {
              'type': 'absoluteAnchor',
              'x': 200000,
              'y': 0,
              'width': 1500000,
              'height': 1500000
            },
            'picture': {
              'data': imageData,
              'extension': '.png'
            }
          }
        }
      } catch (error) {
        console.error('Logo eklenirken hata:', error)
      }

      // Kolon genişlikleri
      ws['!cols'] = [
        { wch: 8 },   // No
        { wch: 45 },  // Hizmet
        { wch: 12 },  // GÜN/KAŞE
        { wch: 10 },  // ADET
        { wch: 15 },  // BİRİM FİYAT
        { wch: 15 }   // TOPLAM FİYAT
      ]

      // Satır yükseklikleri
      ws['!rows'] = []
      for (let i = 0; i < sheetData.length; i++) {
        ws['!rows'][i] = { hpt: 25 }
      }

      // Hücre stilleri
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cell_address = { c: C, r: R }
          const cell_ref = XLSX.utils.encode_cell(cell_address)
          
          if (!ws[cell_ref]) {
            ws[cell_ref] = { t: 's', v: '' }
          }

          // Temel stil
          ws[cell_ref].s = {
            font: { name: 'Noto Sans', sz: 9 },
            alignment: { vertical: 'center', wrapText: true },
            border: {
              top: { style: 'thin', color: { rgb: "FFE5E7EB" } },
              bottom: { style: 'thin', color: { rgb: "FFE5E7EB" } },
              left: { style: 'thin', color: { rgb: "FFE5E7EB" } },
              right: { style: 'thin', color: { rgb: "FFE5E7EB" } }
            }
          }

          // Müşteri bilgileri
          if (R === 3) {
            ws[cell_ref].s.font = { ...ws[cell_ref].s.font, bold: true }
          }

          // Konu başlıkları
          if (ws[cell_ref]?.v === 'GÜN/KAŞE' || ws[cell_ref]?.v === 'ADET' || 
              ws[cell_ref]?.v === 'BİRİM FİYAT' || ws[cell_ref]?.v === 'TOPLAM FİYAT') {
            ws[cell_ref].s = {
              ...ws[cell_ref].s,
              fill: { type: 'pattern', patternType: 'solid', fgColor: { rgb: "FFF9FAFB" } },
              font: { ...ws[cell_ref].s.font, bold: true },
              alignment: { ...ws[cell_ref].s.alignment, horizontal: 'center' }
            }
          }

          // Kategori satırları
          if (ws[cell_ref]?.v && typeof ws[cell_ref].v === 'string' && ws[cell_ref].v.match(/^\d+$/)) {
            const nextCell = ws[XLSX.utils.encode_cell({ c: C + 1, r: R })]
            if (nextCell && !nextCell.v?.toString().includes('.')) {
              for (let i = 0; i <= 5; i++) {
                const cellRef = XLSX.utils.encode_cell({ c: i, r: R })
                ws[cellRef].s = {
                  font: { name: 'Noto Sans', sz: 9, bold: true },
                  fill: { patternType: 'solid', fgColor: { rgb: "BDD8F2" } },
                  alignment: { vertical: 'center', wrapText: true }
                }
              }
            }
          }

          // Toplam satırları
          if (ws[cell_ref]?.v === 'TOPLAM:' || 
              ws[cell_ref]?.v?.includes('İNDİRİM') || 
              ws[cell_ref]?.v?.includes('GENEL TOPLAM:')) {
            ws[cell_ref].s = {
              ...ws[cell_ref].s,
              fill: { type: 'pattern', patternType: 'solid', fgColor: { rgb: "FFF9FAFB" } },
              font: { ...ws[cell_ref].s.font, bold: true }
            }
            if (C === 4 || C === 5) {
              ws[cell_ref].s.alignment.horizontal = 'right'
            }
          }

          // Hizalamalar
          if (C === 0 || C === 2 || C === 3) {
            ws[cell_ref].s.alignment.horizontal = 'center'
          }
          if (C === 4 || C === 5) {
            ws[cell_ref].s.alignment.horizontal = 'right'
          }
        }
      }

      // Birleştirmeler
      const merges = [
        // Müşteri ismi için birleştirme
        { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }
      ]

      // Her konu için başlık birleştirmesi
      let currentRow = 5
      proposal.topics.forEach((topic, topicIndex) => {
        if (topicIndex > 0) currentRow += 2
        currentRow += 1
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 1 } })
        currentRow += topic.categories.reduce((acc, category) => acc + category.services.length + 1, 0) + 3
      })

      ws['!merges'] = merges

      XLSX.utils.book_append_sheet(workbook, ws, 'Teklif')

      // Dosya adı
      const fileName = `${proposal.customerName
        .replace(/[ğüşıöçĞÜŞİÖÇ]/g, c => ({
          'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c',
          'Ğ': 'G', 'Ü': 'U', 'Ş': 'S', 'İ': 'I', 'Ö': 'O', 'Ç': 'C'
        }[c] || c))}-${proposal.projectName
        .replace(/[ğüşıöçĞÜŞİÖÇ]/g, c => ({
          'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c',
          'Ğ': 'G', 'Ü': 'U', 'Ş': 'S', 'İ': 'I', 'Ö': 'O', 'Ç': 'C'
        }[c] || c))}.xlsx`

      XLSX.writeFile(workbook, fileName)
    } catch (error) {
      console.error('Excel oluşturulurken hata:', error)
    }
  }

  const renderPdfDownloadLink = () => {
    if (!proposal) return null;

    return (
      <BlobProvider document={<ProposalPDF proposal={proposal} />}>
        {({ blob, url, loading, error }) => {
          if (loading) {
            return (
              <button
                disabled
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-100 cursor-not-allowed"
              >
                PDF Hazırlanıyor...
              </button>
            );
          }

          if (error) {
            return (
              <button
                disabled
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 cursor-not-allowed"
              >
                PDF oluşturulamadı
              </button>
            );
          }

          return (
            <button
              onClick={() => {
                if (url) {
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${proposal.customerName}-${proposal.projectName}.pdf`;
                  link.click();
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              PDF olarak indir
            </button>
          );
        }}
      </BlobProvider>
    );
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
        <main className="max-w-5xl mx-auto p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image 
              src="/images/logo.png" 
              alt="BEBO" 
              width={120} 
              height={120}
              sizes="120px"
              priority
            />
          </div>

          {/* Ana İçerik */}
          <div className="border border-gray-300 rounded-lg p-8">
            {/* Müşteri Bilgileri */}
            <div className="flex justify-between mb-8">
              <div className="font-bold">{proposal.customerName}</div>
              <div>{new Date(proposal.date).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}</div>
            </div>

            {/* Her konu için tablo */}
            {proposal.topics.map((topic, topicIndex) => (
              <div key={topic.id || `topic-${topicIndex}`} className="mb-8">
                <table className="w-full border-collapse border border-gray-300">
                  {/* Başlık */}
                  <thead>
                    <tr>
                      <th colSpan={2} className="border border-gray-300 bg-gray-50 p-2 text-left font-bold">{topic.name}</th>
                      <th className="border border-gray-300 bg-gray-50 p-2 text-center w-24">GÜN/KAŞE</th>
                      <th className="border border-gray-300 bg-gray-50 p-2 text-center w-24">ADET</th>
                      <th className="border border-gray-300 bg-gray-50 p-2 text-center w-48">BİRİM FİYAT</th>
                      <th className="border border-gray-300 bg-gray-50 p-2 text-center w-48">TOPLAM FİYAT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topic.categories.map((category, categoryIndex) => (
                      <React.Fragment key={category.id || `category-${topicIndex}-${categoryIndex}`}>
                        {/* Kategori başlığı */}
                        <tr>
                          <td className="border border-gray-300 bg-blue-50 p-2 text-center">{categoryIndex + 1}</td>
                          <td colSpan={4} className="border border-gray-300 bg-blue-50 p-2 font-bold">{category.name}</td>
                          <td className="border border-gray-300 bg-blue-50 p-2 text-right font-bold">
                            {formatPrice(category.services.reduce((sum, service) => sum + service.totalPrice, 0))}
                          </td>
                        </tr>
                        {/* Hizmetler */}
                        {category.services.map((service, serviceIndex) => (
                          <tr key={service.id || `service-${topicIndex}-${categoryIndex}-${serviceIndex}`}>
                            <td className="border border-gray-300 p-2 text-center">{`${categoryIndex + 1}.${serviceIndex + 1}`}</td>
                            <td className="border border-gray-300 p-2">{service.name}</td>
                            <td className="border border-gray-300 p-2 text-center">{service.days}</td>
                            <td className="border border-gray-300 p-2 text-center">{service.quantity}</td>
                            <td className="border border-gray-300 p-2 text-right">{formatPrice(service.price)}</td>
                            <td className="border border-gray-300 p-2 text-right">{formatPrice(service.totalPrice)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                  {/* Konu Toplamı */}
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="border border-gray-300 bg-gray-50 p-2 text-right font-bold">TOPLAM:</td>
                      <td className="border border-gray-300 bg-gray-50 p-2 text-right font-bold">
                        {formatPrice(topic.categories.reduce((total, category) => 
                          total + category.services.reduce((sum, service) => sum + service.totalPrice, 0), 0
                        ))}
                      </td>
                    </tr>
                    {/* Tek konu için genel toplam, indirim ve ajans komisyonu */}
                    {proposal.topics.length === 1 && proposal.showTotal && (
                      <>
                        {proposal.discount && proposal.discount.value > 0 && (
                          <>
                            <tr>
                              <td colSpan={5} className="border border-gray-300 bg-gray-50 p-2 text-right font-bold">
                                İNDİRİM {proposal.discount.type === 'percentage' ? `(%${proposal.discount.value})` : ''}:
                              </td>
                              <td className="border border-gray-300 bg-gray-50 p-2 text-right font-bold">
                                {formatPrice(discountAmount)}
                              </td>
                            </tr>
                            {proposal.agencyCommission && (
                              <tr>
                                <td colSpan={5} className="border border-gray-300 bg-gray-50 p-2 text-right font-bold">
                                  İNDİRİMLİ TUTAR:
                                </td>
                                <td className="border border-gray-300 bg-gray-50 p-2 text-right font-bold">
                                  {formatPrice(calculateAfterDiscount(proposal, subTotal, discountAmount))}
                                </td>
                              </tr>
                            )}
                          </>
                        )}
                        {proposal.agencyCommission && (
                          <tr>
                            <td colSpan={5} className="border border-gray-300 bg-gray-50 p-2 text-right font-bold">
                              AJANS KOMİSYONU {proposal.agencyCommission.type === 'percentage' ? `(%${proposal.agencyCommission.value})` : ''}:
                            </td>
                            <td className="border border-gray-300 bg-gray-50 p-2 text-right font-bold">
                              {formatPrice(calculateAgencyCommissionAmount(proposal, subTotal, calculateAfterDiscount(proposal, subTotal, discountAmount)))}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan={5} className="border border-gray-300 bg-gray-50 p-2 text-right font-bold">
                            GENEL TOPLAM:
                          </td>
                          <td className="border border-gray-300 bg-gray-50 p-2 text-right font-bold">
                            {formatPrice(finalTotal)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tfoot>
                </table>
              </div>
            ))}

            {/* Genel toplam tablosu - birden fazla konu varsa ve showTotal true ise göster */}
            {proposal.topics.length > 1 && proposal.showTotal && (
              <table className="w-full border-collapse border border-gray-300 mt-8">
                <tbody>
                  {((proposal.discount && proposal.discount.value > 0) || (proposal.agencyCommission && proposal.agencyCommission.value > 0)) && (
                    <tr>
                      <td className="border border-gray-300 bg-gray-100 p-2 text-right font-bold">TOPLAM:</td>
                      <td className="border border-gray-300 bg-gray-100 p-2 w-48 font-bold text-right">
                        {formatPrice(subTotal)}
                      </td>
                    </tr>
                  )}
                  {proposal.discount && proposal.discount.value > 0 && (
                    <>
                      <tr>
                        <td className="border border-gray-300 bg-gray-100 p-2 text-right font-bold">
                          İNDİRİM {proposal.discount.type === 'percentage' ? `(%${proposal.discount.value})` : ''}:
                        </td>
                        <td className="border border-gray-300 bg-gray-100 p-2 font-bold text-right">
                          {formatPrice(discountAmount)}
                        </td>
                      </tr>
                      {proposal.agencyCommission && proposal.agencyCommission.value > 0 && (
                        <tr>
                          <td className="border border-gray-300 bg-gray-100 p-2 text-right font-bold">
                            İNDİRİMLİ TUTAR:
                          </td>
                          <td className="border border-gray-300 bg-gray-100 p-2 font-bold text-right">
                            {formatPrice(calculateAfterDiscount(proposal, subTotal, discountAmount))}
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                  {proposal.agencyCommission && proposal.agencyCommission.value > 0 && (
                    <tr>
                      <td className="border border-gray-300 bg-gray-100 p-2 text-right font-bold">
                        AJANS KOMİSYONU {proposal.agencyCommission.type === 'percentage' ? `(%${proposal.agencyCommission.value})` : ''}:
                      </td>
                      <td className="border border-gray-300 bg-gray-100 p-2 font-bold text-right">
                        {formatPrice(calculateAgencyCommissionAmount(proposal, subTotal, calculateAfterDiscount(proposal, subTotal, discountAmount)))}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="border border-gray-300 bg-gray-100 p-2 text-right font-bold">GENEL TOPLAM:</td>
                    <td className="border border-gray-300 bg-gray-100 p-2 font-bold text-right">
                      {formatPrice(finalTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* Teklif Şartları */}
            {proposal.terms && (
              <div className="mt-8 whitespace-pre-wrap">
                {proposal.terms}
              </div>
            )}

            {/* Butonlar */}
            <div className="mt-6 flex justify-end gap-2">
              {renderPdfDownloadLink()}
              <button
                onClick={handleExcelExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Excel olarak indir
              </button>
              <button
                onClick={() => router.push(`/proposals/${params.id}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Düzenle
              </button>
              <button
                onClick={() => router.push('/proposals')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Geri Dön
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
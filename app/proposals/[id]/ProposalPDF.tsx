'use client'

import { Document, Page, Text, View, StyleSheet, Image, Font, pdf } from '@react-pdf/renderer'
import { Topic } from '../add/types'
import { useEffect, useState } from 'react'

// Font kaydı
Font.register({
  family: 'Noto Sans',
  fonts: [
    { src: '/fonts/NotoSans-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/NotoSans-Bold.ttf', fontWeight: 'bold' }
  ]
})

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

// Stilleri tanımla
const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingTop: 100,
    fontFamily: 'Noto Sans'
  },
  header: {
    marginBottom: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mainContent: {
    border: '1pt solid #e5e7eb',
    padding: 8,
    borderRadius: 6
  },
  logo: {
    width: 60,
    height: 'auto'
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 9,
    fontWeight: 'bold'
  },
  table: {
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
    borderBottomWidth: 0
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    fontSize: 8,
    fontWeight: 'bold'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    fontSize: 8
  },
  categoryRow: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    fontSize: 8,
    fontWeight: 'bold'
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    fontSize: 8,
    fontWeight: 'bold'
  },
  col1: { width: '5%', padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  col2: { width: '40%', padding: 4, borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  col3: { width: '15%', padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  col4: { width: '10%', padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  col5: { 
    width: '15%', 
    padding: 2, 
    paddingTop: 4,
    paddingBottom: 4,
    textAlign: 'right', 
    borderRightWidth: 1, 
    borderRightColor: '#e5e7eb',
    fontSize: 8
  },
  col6: { 
    width: '15%', 
    padding: 2,
    paddingTop: 4,
    paddingBottom: 4,
    textAlign: 'right',
    fontSize: 8
  },
  terms: {
    marginTop: 10,
    fontSize: 9,
    whiteSpace: 'pre-wrap'
  }
})

// Yardımcı fonksiyonlar
const formatPrice = (price: number): string => {
  return `₺${price.toLocaleString('tr-TR', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

const calculateSubTotal = (proposal: Proposal): number => {
  return proposal.topics.reduce((total, topic) => 
    total + topic.categories.reduce((categoryTotal, category) => 
      categoryTotal + category.services.reduce((serviceTotal, service) => 
        serviceTotal + service.totalPrice, 0
      ), 0
    ), 0
  )
}

const calculateDiscountAmount = (proposal: Proposal, subTotal: number): number => {
  if (!proposal.discount) return 0
  return proposal.discount.type === 'percentage' 
    ? (subTotal * proposal.discount.value) / 100
    : proposal.discount.value
}

const calculateAfterDiscount = (proposal: Proposal, subTotal: number, discountAmount: number): number => {
  return subTotal - discountAmount
}

const calculateAgencyCommissionAmount = (proposal: Proposal, subTotal: number, afterDiscount: number): number => {
  if (!proposal.agencyCommission) return 0
  const baseAmount = afterDiscount
  return proposal.agencyCommission.type === 'percentage'
    ? (baseAmount * proposal.agencyCommission.value) / 100
    : proposal.agencyCommission.value
}

const calculateFinalTotal = (proposal: Proposal, subTotal: number, discountAmount: number): number => {
  const afterDiscount = calculateAfterDiscount(proposal, subTotal, discountAmount)
  const agencyCommissionAmount = calculateAgencyCommissionAmount(proposal, subTotal, afterDiscount)
  return afterDiscount + agencyCommissionAmount
}

export default function ProposalPDF({ proposal }: { proposal: Proposal }) {
  const [logoBase64, setLogoBase64] = useState<string>('')
  const [pageHeight, setPageHeight] = useState(842) // A4 default height

  useEffect(() => {
    fetch('/api/logo')
      .then(response => response.json())
      .then(data => {
        if (data.logo) {
          setLogoBase64(data.logo.startsWith('data:') ? data.logo : `data:image/png;base64,${data.logo}`)
        }
      })
      .catch(error => console.error('Logo yüklenirken hata:', error))
  }, [])

  // İçerik yüksekliğini hesapla
  useEffect(() => {
    // Her topic için yaklaşık yükseklik
    const topicsHeight = proposal.topics.reduce((height, topic) => {
      const categoriesHeight = topic.categories.reduce((catHeight, category) => {
        // Her kategori başlığı ve servisleri için yükseklik
        return catHeight + (category.services.length * 20) + 30 // Her servis 20pt, kategori başlığı 30pt
      }, 0)
      return height + categoriesHeight + 50 // Topic başlığı ve toplam için 50pt
    }, 0)

    // Diğer içerikler için yükseklik
    const otherContentHeight = 200 // Logo, müşteri bilgileri, vs.
    const termsHeight = proposal.terms ? proposal.terms.length * 0.2 : 0 // Terms için yaklaşık yükseklik
    const totalsHeight = proposal.showTotal ? 150 : 0 // Toplam, indirim, vs. için yükseklik

    // Toplam yükseklik (biraz margin ekle)
    const totalHeight = topicsHeight + otherContentHeight + termsHeight + totalsHeight + 100
    
    // Minimum A4 yüksekliği (842pt) veya hesaplanan yükseklik
    setPageHeight(Math.max(842, totalHeight))
  }, [proposal])

  const subTotal = calculateSubTotal(proposal)
  const discountAmount = calculateDiscountAmount(proposal, subTotal)
  const finalTotal = calculateFinalTotal(proposal, subTotal, discountAmount)

  return (
    <Document>
      <Page size={[595.28, pageHeight]} style={styles.page}>
        <View style={styles.header}>
          {logoBase64 && (
            <Image 
              src={logoBase64}
              style={styles.logo}
            />
          )}
        </View>
        <View style={styles.mainContent}>
          <View style={styles.customerInfo}>
            <Text>{proposal.customerName}</Text>
            <Text>{new Date(proposal.date).toLocaleDateString('tr-TR')}</Text>
          </View>

          {proposal.topics.map((topic, topicIndex) => (
            <View key={topic.id || `topic-${topicIndex}`} style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={{ ...styles.col1, ...styles.col2, width: '45%', fontWeight: 'bold' }}>{topic.name}</Text>
                <Text style={styles.col3}>GÜN/KAŞE</Text>
                <Text style={styles.col4}>ADET</Text>
                <Text style={{ ...styles.col5, textAlign: 'center' }}>BİRİM FİYAT</Text>
                <Text style={{ ...styles.col6, textAlign: 'center' }}>TOPLAM FİYAT</Text>
              </View>

              {topic.categories.map((category, categoryIndex) => (
                <View key={category.id || `category-${categoryIndex}`}>
                  <View style={styles.categoryRow}>
                    <Text style={{ ...styles.col1, fontWeight: 'bold' }}>{categoryIndex + 1}</Text>
                    <Text style={{ ...styles.col2, flex: 1 }}>{category.name}</Text>
                    <Text style={styles.col6}>
                      {formatPrice(category.services.reduce((sum, service) => sum + service.totalPrice, 0))}
                    </Text>
                  </View>

                  {category.services.map((service, serviceIndex) => (
                    <View key={service.id || `service-${serviceIndex}`} style={styles.tableRow}>
                      <Text style={styles.col1}>{`${categoryIndex + 1}.${serviceIndex + 1}`}</Text>
                      <Text style={styles.col2}>{service.name}</Text>
                      <Text style={styles.col3}>{service.days}</Text>
                      <Text style={styles.col4}>{service.quantity}</Text>
                      <Text style={styles.col5}>{formatPrice(service.price)}</Text>
                      <Text style={styles.col6}>{formatPrice(service.totalPrice)}</Text>
                    </View>
                  ))}
                </View>
              ))}

              <View style={styles.totalRow}>
                <Text style={{ ...styles.col1, flex: 1, textAlign: 'right' }}>TOPLAM:</Text>
                <Text style={styles.col6}>
                  {formatPrice(topic.categories.reduce((total, category) => 
                    total + category.services.reduce((sum, service) => sum + service.totalPrice, 0), 0
                  ))}
                </Text>
              </View>

              {/* Tek konu için genel toplam, indirim ve ajans komisyonu */}
              {proposal.topics.length === 1 && proposal.showTotal && (
                <>
                  {proposal.discount && (
                    <>
                      <View style={styles.totalRow}>
                        <Text style={{ ...styles.col1, flex: 1, textAlign: 'right' }}>
                          İNDİRİM {proposal.discount.type === 'percentage' ? `(%${proposal.discount.value})` : ''}:
                        </Text>
                        <Text style={styles.col6}>{formatPrice(discountAmount)}</Text>
                      </View>
                      {proposal.agencyCommission && (
                        <View style={styles.totalRow}>
                          <Text style={{ ...styles.col1, flex: 1, textAlign: 'right' }}>İNDİRİMLİ TUTAR:</Text>
                          <Text style={styles.col6}>
                            {formatPrice(calculateAfterDiscount(proposal, subTotal, discountAmount))}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                  {proposal.agencyCommission && (
                    <View style={styles.totalRow}>
                      <Text style={{ ...styles.col1, flex: 1, textAlign: 'right' }}>
                        AJANS KOMİSYONU {proposal.agencyCommission.type === 'percentage' ? `(%${proposal.agencyCommission.value})` : ''}:
                      </Text>
                      <Text style={styles.col6}>
                        {formatPrice(calculateAgencyCommissionAmount(proposal, subTotal, calculateAfterDiscount(proposal, subTotal, discountAmount)))}
                      </Text>
                    </View>
                  )}
                  <View style={styles.totalRow}>
                    <Text style={{ ...styles.col1, flex: 1, textAlign: 'right' }}>GENEL TOPLAM:</Text>
                    <Text style={styles.col6}>{formatPrice(finalTotal)}</Text>
                  </View>
                </>
              )}
            </View>
          ))}

          {/* Genel toplam tablosu - birden fazla konu varsa ve showTotal true ise göster */}
          {proposal.topics.length > 1 && proposal.showTotal && (
            <View style={styles.table}>
              {((proposal.discount && proposal.discount.value > 0) || (proposal.agencyCommission && proposal.agencyCommission.value > 0)) && (
                <View style={styles.totalRow}>
                  <Text style={{ ...styles.col1, flex: 1, textAlign: 'right' }}>TOPLAM:</Text>
                  <Text style={styles.col6}>{formatPrice(subTotal)}</Text>
                </View>
              )}

              {proposal.discount && proposal.discount.value > 0 && (
                <>
                  <View style={styles.totalRow}>
                    <Text style={{ ...styles.col1, flex: 1, textAlign: 'right' }}>
                      İNDİRİM {proposal.discount.type === 'percentage' ? `(%${proposal.discount.value})` : ''}:
                    </Text>
                    <Text style={styles.col6}>{formatPrice(discountAmount)}</Text>
                  </View>
                  {proposal.agencyCommission && proposal.agencyCommission.value > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={{ ...styles.col1, flex: 1, textAlign: 'right' }}>İNDİRİMLİ TUTAR:</Text>
                      <Text style={styles.col6}>
                        {formatPrice(calculateAfterDiscount(proposal, subTotal, discountAmount))}
                      </Text>
                    </View>
                  )}
                </>
              )}

              {proposal.agencyCommission && proposal.agencyCommission.value > 0 && (
                <View style={styles.totalRow}>
                  <Text style={{ ...styles.col1, flex: 1, textAlign: 'right' }}>
                    AJANS KOMİSYONU {proposal.agencyCommission.type === 'percentage' ? `(%${proposal.agencyCommission.value})` : ''}:
                  </Text>
                  <Text style={styles.col6}>
                    {formatPrice(calculateAgencyCommissionAmount(proposal, subTotal, calculateAfterDiscount(proposal, subTotal, discountAmount)))}
                  </Text>
                </View>
              )}

              <View style={styles.totalRow}>
                <Text style={{ ...styles.col1, flex: 1, textAlign: 'right', fontWeight: 'bold' }}>GENEL TOPLAM:</Text>
                <Text style={{ ...styles.col6, fontWeight: 'bold' }}>{formatPrice(finalTotal)}</Text>
              </View>
            </View>
          )}

          {proposal.terms && (
            <Text style={styles.terms}>{proposal.terms}</Text>
          )}
        </View>
      </Page>
    </Document>
  )
} 

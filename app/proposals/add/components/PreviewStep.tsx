import React, { useState, useEffect } from 'react'
import { Topic } from '../types'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface PreviewStepProps {
  data: {
    id?: string // Teklif ID'si
    customerName: string
    projectName: string
    date: string
    topics: Topic[]
    totalAmount: number
    discount?: {
      type: 'percentage' | 'amount'
      value: number
    }
    showTotal: boolean
    terms?: string
    agencyCommission?: {
      type: 'percentage' | 'amount'
      value: number
    }
    rateCardId?: string | null
    createdBy?: string
  }
  onChange: (data: any) => void
  isEditMode?: boolean // Düzenleme sayfasında olup olmadığımızı belirten prop
}

export default function PreviewStep({ data, onChange, isEditMode }: PreviewStepProps) {
  const router = useRouter()
  const [showTerms, setShowTerms] = useState(false)
  const [termsText, setTermsText] = useState(data.terms || '')
  const [error, setError] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  const handleSave = async (status: 'Taslak' | 'Revize' | 'Yeni') => {
    try {
      if (!data.customerName) {
        setError('Lütfen müşteri adını girin')
        return
      }

      // Yeni teklif olarak kaydedilirken kontrol yap
      if (status === 'Yeni') {
        // Mevcut teklifleri kontrol et
        const checkResponse = await fetch('/api/proposals')
        if (!checkResponse.ok) {
          throw new Error('Teklifler kontrol edilemedi')
        }
        
        const existingProposals = await checkResponse.json()
        
        // Aynı müşteri ve proje ismi kontrolü
        const duplicateProposal = existingProposals.find(
          (p: any) => p.customerName.toLowerCase() === data.customerName.toLowerCase() && 
                      p.projectName.toLowerCase() === data.projectName.toLowerCase()
        )

        if (duplicateProposal) {
          setNewProjectName(`${data.projectName} (Kopya)`)
          setShowErrorModal(true)
          return
        }
      }

      // Kullanıcı bilgisini localStorage'dan al
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const createdBy = user ? user.name : 'Bilinmeyen Kullanıcı'

      const proposal = {
        ...data,
        status,
        createdBy,
        terms: termsText
      }

      // Eğer düzenleme sayfasındaysak ve normal kaydetme işlemi yapılıyorsa PUT isteği yap
      const isUpdate = isEditMode && status === 'Taslak'
      const url = isUpdate ? `/api/proposals/${data.id}` : '/api/proposals'
      const method = isUpdate ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposal)
      })

      if (!response.ok) throw new Error('Teklif kaydedilemedi')

      const savedProposal = await response.json()
      router.push(`/proposals/${savedProposal.id}`)
    } catch (err) {
      setError('Teklif kaydedilirken bir hata oluştu')
      console.error(err)
    }
  }

  const saveNewProposal = async () => {
    try {
      if (!newProjectName.trim()) {
        setError('Lütfen yeni proje adı girin')
        return
      }

      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const createdBy = user ? user.name : 'Bilinmeyen Kullanıcı'

      const proposal = {
        ...data,
        projectName: newProjectName.trim(),
        status: 'Yeni',
        createdBy,
        terms: termsText
      }

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposal)
      })

      if (!response.ok) throw new Error('Teklif kaydedilemedi')

      const savedProposal = await response.json()
      router.push(`/proposals/${savedProposal.id}`)
    } catch (err) {
      setError('Teklif kaydedilirken bir hata oluştu')
      console.error(err)
    }
  }

  const calculateSubTotal = () => {
    return data.topics.reduce((total, topic) => {
      return total + topic.categories.reduce((categoryTotal, category) => {
        return categoryTotal + category.services.reduce((serviceTotal, service) => {
          return serviceTotal + service.totalPrice
        }, 0)
      }, 0)
    }, 0)
  }

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubTotal()
    if (!data.discount) return 0

    if (data.discount.type === 'percentage') {
      return subtotal * (data.discount.value / 100)
    } else {
      return data.discount.value
    }
  }

  const calculateAfterDiscount = () => {
    return calculateSubTotal() - calculateDiscountAmount()
  }

  const calculateAgencyCommissionAmount = () => {
    if (!data.agencyCommission) return 0

    // İndirim varsa indirimli tutar üzerinden, yoksa toplam tutar üzerinden hesapla
    const baseAmount = data.discount ? calculateAfterDiscount() : calculateSubTotal()

    if (data.agencyCommission.type === 'percentage') {
      return baseAmount * (data.agencyCommission.value / 100)
    } else {
      return data.agencyCommission.value
    }
  }

  const calculateFinalTotal = () => {
    const afterDiscount = calculateAfterDiscount()
    const commissionAmount = calculateAgencyCommissionAmount()
    return afterDiscount + commissionAmount
  }

  useEffect(() => {
    onChange({ ...data, terms: termsText })
  }, [termsText])

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded mb-6">
          {error}
        </div>
      )}
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
          <div className="font-bold">{data.customerName}</div>
          <div>{new Date(data.date).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}</div>
        </div>

        {/* Her konu için tablo */}
        {data.topics.map((topic, topicIndex) => (
          <div key={topic.id || topicIndex} className="mb-8">
            <table className="w-full border-collapse border border-gray-300">
              {/* Başlık */}
              <thead>
                <tr>
                  <th colSpan={2} className="border border-gray-300 bg-gray-50 p-2 text-left font-bold">{topic.name}</th>
                  <th className="border border-gray-300 bg-gray-50 p-2 text-center w-24">GÜN/KAŞE</th>
                  <th className="border border-gray-300 bg-gray-50 p-2 text-center w-24">ADET</th>
                  <th className="border border-gray-300 bg-gray-50 p-2 text-center w-34">BİRİM FİYAT</th>
                  <th className="border border-gray-300 bg-gray-50 p-2 text-center w-34">TOPLAM FİYAT</th>
                </tr>
              </thead>
              
              <tbody>
                {topic.categories.map((category, categoryIndex) => (
                  <React.Fragment key={category.id || categoryIndex}>
                    {/* Kategori başlığı */}
                    <tr>
                      <td className="border border-gray-300 bg-blue-100 p-2 text-center">
                        {categoryIndex + 1}
                      </td>
                      <td colSpan={4} className="border border-gray-300 bg-blue-100 p-2 font-bold">
                        {category.name}
                      </td>
                      <td className="border border-gray-300 bg-blue-100 p-2 font-bold text-right">
                        {(category.services.reduce((sum, service) => sum + service.totalPrice, 0)).toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY'
                        })}
                      </td>
                    </tr>

                    {/* Kategori altındaki hizmetler */}
                    {category.services.map((service, serviceIndex) => (
                      <tr key={service.id || serviceIndex}>
                        <td className="border border-gray-300 bg-white p-2 text-center w-16">
                          {`${categoryIndex + 1}.${serviceIndex + 1}`}
                        </td>
                        <td className="border border-gray-300 bg-white p-2 min-w-[400px]">
                          {service.name}
                        </td>
                        <td className="border border-gray-300 bg-white p-2 text-center">{service.days}</td>
                        <td className="border border-gray-300 bg-white p-2 text-center">{service.quantity}</td>
                        <td className="border border-gray-300 bg-white p-2 text-right">
                          {service.price.toLocaleString('tr-TR', {
                            style: 'currency',
                            currency: 'TRY'
                          })}
                        </td>
                        <td className="border border-gray-300 bg-white p-2 text-right">
                          {service.totalPrice.toLocaleString('tr-TR', {
                            style: 'currency',
                            currency: 'TRY'
                          })}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                
                {/* Konu toplamı */}
                <tr>
                  <td colSpan={5} className="border border-gray-300 bg-gray-100 p-2 text-right font-bold">
                    TOPLAM:
                  </td>
                  <td className="border border-gray-300 bg-gray-100 p-2 font-bold text-right">
                    {(topic.categories.reduce((total, category) => 
                      total + category.services.reduce((sum, service) => sum + service.totalPrice, 0), 0
                    )).toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY'
                    })}
                  </td>
                </tr>

                {/* Tek konu varsa ve showTotal true ise indirim ve genel toplam burada gösterilsin */}
                {data.topics.length === 1 && data.showTotal && (
                  <>
                    {data.discount && (
                      <>
                        <tr>
                          <td colSpan={5} className="border border-gray-300 bg-gray-100 p-2 text-right font-bold">
                            İNDİRİM {data.discount.type === 'percentage' ? `(%${data.discount.value})` : ''}:
                          </td>
                          <td className="border border-gray-300 bg-gray-100 p-2 font-bold text-right">
                            {calculateDiscountAmount().toLocaleString('tr-TR', {
                              style: 'currency',
                              currency: 'TRY'
                            })}
                          </td>
                        </tr>
                        {data.agencyCommission && (
                          <tr>
                            <td colSpan={5} className="border border-gray-300 bg-gray-100 p-2 text-right font-bold">
                              İNDİRİMLİ TUTAR:
                            </td>
                            <td className="border border-gray-300 bg-gray-100 p-2 font-bold text-right">
                              {calculateAfterDiscount().toLocaleString('tr-TR', {
                                style: 'currency',
                                currency: 'TRY'
                              })}
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                    {data.agencyCommission && (
                      <tr>
                        <td colSpan={5} className="border border-gray-300 bg-gray-100 p-2 text-right font-bold">
                          AJANS HİZMET BEDELİ {data.agencyCommission.type === 'percentage' ? `(%${data.agencyCommission.value})` : ''}:
                        </td>
                        <td className="border border-gray-300 bg-gray-100 p-2 font-bold text-right">
                          {calculateAgencyCommissionAmount().toLocaleString('tr-TR', {
                            style: 'currency',
                            currency: 'TRY'
                          })}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={5} className="border border-gray-300 bg-gray-200 p-2 text-right font-bold">
                        GENEL TOPLAM:
                      </td>
                      <td className="border border-gray-300 bg-gray-200 p-2 font-bold text-right">
                        {calculateFinalTotal().toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY'
                        })}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        ))}

        {/* Genel toplam tablosu - birden fazla konu varsa ve showTotal true ise göster */}
        {data.topics.length > 1 && data.showTotal && (
          <table className="w-full border-collapse border border-gray-300 mt-8">
            <tbody>
              <tr>
                <td className="border border-gray-300 bg-gray-100 p-2 text-right font-bold">TOPLAM:</td>
                <td className="border border-gray-300 bg-gray-100 p-2 w-48 font-bold text-right">
                  {calculateSubTotal().toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  })}
                </td>
              </tr>
              {data.discount && (
                <>
                  <tr>
                    <td className="border border-gray-300 bg-gray-100 p-2 text-right font-bold">
                      İNDİRİM {data.discount.type === 'percentage' ? `(%${data.discount.value})` : ''}:
                    </td>
                    <td className="border border-gray-300 bg-gray-100 p-2 font-bold text-right">
                      {calculateDiscountAmount().toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY'
                      })}
                    </td>
                  </tr>
                  {data.agencyCommission && (
                    <tr>
                      <td className="border border-gray-300 bg-gray-100 p-2 text-right font-bold">
                        İNDİRİMLİ TUTAR:
                      </td>
                      <td className="border border-gray-300 bg-gray-100 p-2 font-bold text-right">
                        {calculateAfterDiscount().toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY'
                        })}
                      </td>
                    </tr>
                  )}
                </>
              )}
              {data.agencyCommission && (
                <tr>
                  <td className="border border-gray-300 bg-gray-100 p-2 text-right font-bold">
                    AJANS HİZMET BEDELİ {data.agencyCommission.type === 'percentage' ? `(%${data.agencyCommission.value})` : ''}:
                  </td>
                  <td className="border border-gray-300 bg-gray-100 p-2 font-bold text-right">
                    {calculateAgencyCommissionAmount().toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY'
                    })}
                  </td>
                </tr>
              )}
              <tr>
                <td className="border border-gray-300 bg-gray-200 p-2 text-right font-bold">GENEL TOPLAM:</td>
                <td className="border border-gray-300 bg-gray-200 p-2 font-bold text-right">
                  {calculateFinalTotal().toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Teklif Şartları */}
        {showTerms && data.terms && (
          <div className="mt-8 whitespace-pre-wrap">
            {data.terms}
          </div>
        )}
      </div>

      {/* Mevcut form elemanları */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="showTotal"
            checked={data.showTotal}
            onChange={(e) => onChange({ ...data, showTotal: e.target.checked })}
          />
          <label htmlFor="showTotal">Genel toplamı göster</label>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="showTerms"
            checked={showTerms}
            onChange={(e) => setShowTerms(e.target.checked)}
          />
          <label htmlFor="showTerms">Teklif şartlarını göster</label>
        </div>

        {showTerms && (
          <div>
            <label className="block mb-2">Teklif Şartları:</label>
            <textarea
              value={data.terms}
              onChange={(e) => onChange({ ...data, terms: e.target.value })}
              className="w-full h-40 p-2 border rounded"
            />
          </div>
        )}

        {/* Kaydetme Butonları */}
        <div className="flex justify-end gap-4 mt-8">
          {isEditMode ? (
            <>
              <button
                type="button"
                onClick={() => handleSave('Yeni')}
                className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Yeni Teklif Kaydet
              </button>
              <button
                type="button"
                onClick={() => handleSave('Taslak')}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Kaydet
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleSave('Taslak')}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Kaydet
            </button>
          )}
        </div>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998]" onClick={() => setShowErrorModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
              <div className="text-red-600 mb-4 font-medium">
                "{data.projectName}" isimli proje için {data.customerName} müşterisine ait bir teklif zaten mevcut. 
                Lütfen yeni bir proje ismi giriniz.
              </div>
              <div className="mb-4">
                <label htmlFor="newProjectName" className="block text-sm font-medium text-gray-700 mb-1">
                  Yeni Proje İsmi
                </label>
                <input
                  id="newProjectName"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Yeni proje ismi giriniz"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowErrorModal(false)}
                  className="bg-gray-200 py-2 px-4 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (newProjectName.trim()) {
                      saveNewProposal()
                      setShowErrorModal(false)
                    }
                  }}
                  disabled={!newProjectName.trim()}
                  className="bg-blue-600 py-2 px-4 rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 
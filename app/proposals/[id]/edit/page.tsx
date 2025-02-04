'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'
import StepProgress from '@/components/StepProgress'
import CustomerStep from '../../add/components/CustomerStep'
import ServicesStep from '../../add/components/ServicesStep'
import PricingStep from '../../add/components/PricingStep'
import PreviewStep from '../../add/components/PreviewStep'
import { RateCard, Topic } from '../../add/types'

const steps = [
  { title: 'Müşteri ve Proje', description: 'Müşteri ve proje bilgileri' },
  { title: 'Hizmetler ve Fiyatlandırma', description: 'Hizmet seçimi ve fiyatlandırma' },
  { title: 'Önizleme', description: 'Şartlar ve son kontrol' }
]

export default function EditProposalPage() {
  const router = useRouter()
  const params = useParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rateCards, setRateCards] = useState<RateCard[]>([])
  
  const [selectedCustomerType, setSelectedCustomerType] = useState('existing')
  const [selectedRateCard, setSelectedRateCard] = useState('')
  const [newCustomerName, setNewCustomerName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [currentTopic, setCurrentTopic] = useState('')
  const [proposalDate, setProposalDate] = useState('')
  const [showTerms, setShowTerms] = useState(false)
  const [termsText, setTermsText] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<{[topicId: string]: string}>({})
  const [newCategoryNames, setNewCategoryNames] = useState<{[topicId: string]: string}>({})
  const [newServiceNames, setNewServiceNames] = useState<{[categoryId: string]: string}>({})
  const [newServiceUnits, setNewServiceUnits] = useState<{[categoryId: string]: string}>({})
  const [newServicePrices, setNewServicePrices] = useState<{[categoryId: string]: string}>({})
  const [showDiscount, setShowDiscount] = useState(false)
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage')
  const [discountValue, setDiscountValue] = useState(0)
  const [showAgencyCommission, setShowAgencyCommission] = useState(false)
  const [agencyCommissionType, setAgencyCommissionType] = useState<'percentage' | 'amount'>('percentage')
  const [agencyCommissionValue, setAgencyCommissionValue] = useState(0)

  const [formData, setFormData] = useState({
    customerName: '',
    projectName: '',
    date: '',
    topics: [],
    totalAmount: 0,
    showTotal: false,
    discount: undefined as {
      type: 'percentage' | 'amount'
      value: number
    } | undefined,
    agencyCommission: undefined as {
      type: 'percentage' | 'amount'
      value: number
    } | undefined
  })

  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [newProjectNameInput, setNewProjectNameInput] = useState('')

  // Teklifi yükle
  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const response = await fetch(`/api/proposals/${params.id}`)
        if (!response.ok) throw new Error('Teklif yüklenemedi')
        const proposal = await response.json()
        
        // Form verilerini doldur
        setFormData({
          customerName: proposal.customerName,
          projectName: proposal.projectName,
          date: proposal.date,
          topics: proposal.topics,
          totalAmount: proposal.totalAmount,
          showTotal: proposal.showTotal,
          discount: proposal.discount,
          agencyCommission: proposal.agencyCommission
        })
        
        // Müşteri bilgilerini güncelle
        setSelectedCustomerType('existing')
        setNewCustomerName(proposal.customerName)
        
        setProjectName(proposal.projectName)
        setProposalDate(proposal.date)
        setTopics(proposal.topics)
        setTermsText(proposal.terms || '')
        
        if (proposal.discount) {
          setShowDiscount(true)
          setDiscountType(proposal.discount.type)
          setDiscountValue(proposal.discount.value)
        }

        if (proposal.agencyCommission) {
          setShowAgencyCommission(true)
          setAgencyCommissionType(proposal.agencyCommission.type)
          setAgencyCommissionValue(proposal.agencyCommission.value)
        }
        
      } catch (err) {
        console.error(err)
        setError('Teklif yüklenirken bir hata oluştu')
      }
    }

    const fetchRateCards = async () => {
      try {
        const response = await fetch('/api/ratecards')
        if (!response.ok) throw new Error('Rate cardlar yüklenemedi')
        const data = await response.json()
        setRateCards(data)
        
        // Müşteriye ait rate card'ı bul ve seç
        const matchingRateCard = data.find((rc: RateCard) => rc.customerName === formData.customerName)
        if (matchingRateCard) {
          setSelectedRateCard(matchingRateCard.id)
        }
        
        setLoading(false)
      } catch (err) {
        console.error(err)
        setError('Rate cardlar yüklenirken bir hata oluştu')
        setLoading(false)
      }
    }

    fetchProposal()
    if (formData.customerName) {
      fetchRateCards()
    }
  }, [params.id, formData.customerName])

  // Toplam hesaplama fonksiyonları
  const calculateCategoryTotal = (services: any[]) => {
    return services.reduce((total, service) => total + service.totalPrice, 0)
  }

  const calculateTopicTotal = (topic: Topic) => {
    return topic.categories.reduce((total, category) => 
      total + calculateCategoryTotal(category.services), 0)
  }

  const calculateGrandTotal = () => {
    const subtotal = topics.reduce((total, topic) => total + calculateTopicTotal(topic), 0)
    
    // İndirim hesaplama
    let discountAmount = 0
    if (showDiscount && discountValue) {
      discountAmount = discountType === 'percentage' 
        ? subtotal * (discountValue / 100)
        : discountValue
    }

    // İndirimden sonraki tutar
    const afterDiscount = subtotal - discountAmount

    // Ajans komisyonu hesaplama
    let commissionAmount = 0
    if (showAgencyCommission && agencyCommissionValue) {
      // İndirim varsa indirimli tutar üzerinden, yoksa toplam tutar üzerinden hesapla
      const baseAmount = showDiscount ? afterDiscount : subtotal
      
      commissionAmount = agencyCommissionType === 'percentage'
        ? baseAmount * (agencyCommissionValue / 100)
        : agencyCommissionValue
    }

    return afterDiscount + commissionAmount
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
      return
    }
    
    if (!canProceed()) {
      return
    }
    
    try {
      const customerName = selectedCustomerType === 'existing'
        ? rateCards.find(rc => rc.id === selectedRateCard)?.customerName
        : newCustomerName

      const proposal = {
        customerName,
        projectName,
        date: proposalDate,
        topics,
        totalAmount: calculateGrandTotal(),
        discount: showDiscount && discountValue > 0 ? {
          type: discountType,
          value: discountValue
        } : undefined,
        agencyCommission: showAgencyCommission && agencyCommissionValue > 0 ? {
          type: agencyCommissionType,
          value: agencyCommissionValue
        } : undefined,
        terms: termsText,
        showTotal: formData.showTotal
      }

      console.log('API\'ye gönderilen veri:', proposal)

      const response = await fetch(`/api/proposals/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(proposal)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Teklif güncellenemedi')
      }

      router.push('/proposals')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSaveAsRevision = async () => {
    try {
      const customerName = selectedCustomerType === 'existing'
        ? rateCards.find(rc => rc.id === selectedRateCard)?.customerName
        : newCustomerName

      const proposal = {
        customerName,
        projectName: `${projectName} (Revize)`,
        date: proposalDate,
        topics,
        totalAmount: calculateGrandTotal(),
        discount: showDiscount && discountValue > 0 ? {
          type: discountType,
          value: discountValue
        } : undefined,
        agencyCommission: showAgencyCommission && agencyCommissionValue > 0 ? {
          type: agencyCommissionType,
          value: agencyCommissionValue
        } : undefined,
        terms: termsText,
        showTotal: formData.showTotal
      }

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(proposal)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Revize teklif kaydedilemedi')
      }

      router.push('/proposals')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSaveAsNew = async () => {
    try {
      // Güncel müşteri ismini al
      const currentCustomerName = selectedCustomerType === 'existing'
        ? rateCards.find((rc: RateCard) => rc.id === selectedRateCard)?.customerName
        : newCustomerName.trim()

      if (!currentCustomerName) {
        setErrorMessage('Müşteri bilgisi eksik')
        setShowErrorModal(true)
        return
      }

      // Kullanıcı bilgisini localStorage'dan al
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const createdBy = user ? user.name : 'Bilinmeyen Kullanıcı'

      // Aynı müşteri ve proje ismiyle teklif var mı kontrol et
      const checkResponse = await fetch('/api/proposals')
      if (!checkResponse.ok) {
        throw new Error('Teklifler kontrol edilemedi')
      }
      
      const existingProposals = await checkResponse.json()
      
      // Mevcut teklif dışındaki tekliflerde aynı müşteri ve proje ismi kontrolü
      const duplicateProposal = existingProposals.find(
        (p: any) => p.customerName.toLowerCase() === currentCustomerName.toLowerCase() && 
                    p.projectName.toLowerCase() === projectName.toLowerCase() &&
                    p.id !== params.id // Mevcut teklifi hariç tut
      )

      if (duplicateProposal) {
        setNewProjectNameInput(`${projectName} (Kopya)`)
        setErrorMessage(`"${projectName}" isimli proje için ${currentCustomerName} müşterisine ait bir teklif zaten mevcut. Lütfen yeni bir proje ismi giriniz.`)
        setShowErrorModal(true)
        return
      }

      // Eğer aynı isimli teklif yoksa yeni teklifi kaydet
      const proposal = {
        customerName: currentCustomerName,
        projectName: projectName,
        date: proposalDate,
        topics,
        totalAmount: calculateGrandTotal(),
        discount: showDiscount && discountValue > 0 ? {
          type: discountType,
          value: discountValue
        } : undefined,
        agencyCommission: showAgencyCommission && agencyCommissionValue > 0 ? {
          type: agencyCommissionType,
          value: agencyCommissionValue
        } : undefined,
        terms: termsText,
        showTotal: formData.showTotal,
        createdBy
      }

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(proposal)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Yeni teklif kaydedilemedi')
      }

      router.push('/proposals')

    } catch (err: any) {
      setErrorMessage(err.message || 'Teklif kaydedilirken bir hata oluştu')
      setShowErrorModal(true)
    }
  }

  const saveNewProposal = async (newProjectName: string) => {
    try {
      // Güncel müşteri ismini al
      const currentCustomerName = selectedCustomerType === 'existing'
        ? rateCards.find((rc: RateCard) => rc.id === selectedRateCard)?.customerName
        : newCustomerName.trim()

      if (!currentCustomerName) {
        throw new Error('Müşteri bilgisi eksik')
      }

      // Kullanıcı bilgisini localStorage'dan al
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const createdBy = user ? user.name : 'Bilinmeyen Kullanıcı'

      const proposal = {
        customerName: currentCustomerName,
        projectName: newProjectName,
        date: proposalDate,
        topics,
        totalAmount: calculateGrandTotal(),
        discount: showDiscount && discountValue > 0 ? {
          type: discountType,
          value: discountValue
        } : undefined,
        agencyCommission: showAgencyCommission && agencyCommissionValue > 0 ? {
          type: agencyCommissionType,
          value: agencyCommissionValue
        } : undefined,
        terms: termsText,
        showTotal: formData.showTotal,
        createdBy
      }

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(proposal)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Yeni teklif kaydedilemedi')
      }

      router.push('/proposals')
    } catch (err: any) {
      setErrorMessage(err.message)
      setShowErrorModal(true)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CustomerStep
            selectedCustomerType={selectedCustomerType}
            setSelectedCustomerType={setSelectedCustomerType}
            selectedRateCard={selectedRateCard}
            setSelectedRateCard={setSelectedRateCard}
            newCustomerName={newCustomerName}
            setNewCustomerName={setNewCustomerName}
            rateCards={rateCards}
            projectName={projectName}
            setProjectName={setProjectName}
            proposalDate={proposalDate}
            setProposalDate={setProposalDate}
          />
        )
      case 2:
        const subtotal = topics.reduce((total, topic) => total + calculateTopicTotal(topic), 0)
        const discountAmount = showDiscount && discountValue ? (
          discountType === 'percentage' ? subtotal * (discountValue / 100) : discountValue
        ) : 0

        return (
          <div className="space-y-8">
            <ServicesStep
              topics={topics}
              setTopics={setTopics}
              currentTopic={currentTopic}
              setCurrentTopic={setCurrentTopic}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              newCategoryNames={newCategoryNames}
              setNewCategoryNames={setNewCategoryNames}
              newServiceNames={newServiceNames}
              setNewServiceNames={setNewServiceNames}
              newServiceUnits={newServiceUnits}
              setNewServiceUnits={setNewServiceUnits}
              newServicePrices={newServicePrices}
              setNewServicePrices={setNewServicePrices}
              selectedRateCard={selectedRateCard}
              rateCards={rateCards}
              calculateCategoryTotal={calculateCategoryTotal}
              calculateTopicTotal={calculateTopicTotal}
            />

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fiyatlandırma</h3>
              <PricingStep
                showDiscount={showDiscount}
                setShowDiscount={setShowDiscount}
                discountType={discountType}
                setDiscountType={setDiscountType}
                discountValue={discountValue}
                setDiscountValue={setDiscountValue}
                showAgencyCommission={showAgencyCommission}
                setShowAgencyCommission={setShowAgencyCommission}
                agencyCommissionType={agencyCommissionType}
                setAgencyCommissionType={setAgencyCommissionType}
                agencyCommissionValue={agencyCommissionValue}
                setAgencyCommissionValue={setAgencyCommissionValue}
                subtotal={subtotal}
                total={calculateGrandTotal()}
                discount={discountAmount}
              />
            </div>
          </div>
        )
      case 3:
        return (
          <PreviewStep
            data={{
              id: params.id as string,
              customerName: selectedCustomerType === 'existing'
                ? rateCards.find(rc => rc.id === selectedRateCard)?.customerName || ''
                : newCustomerName,
              projectName,
              date: proposalDate,
              topics,
              totalAmount: calculateGrandTotal(),
              showTotal: formData.showTotal,
              discount: showDiscount && discountValue > 0 ? {
                type: discountType,
                value: discountValue
              } : undefined,
              agencyCommission: showAgencyCommission && agencyCommissionValue > 0 ? {
                type: agencyCommissionType,
                value: agencyCommissionValue
              } : undefined,
              terms: termsText
            }}
            onChange={(data) => {
              setFormData(data)
              setTermsText(data.terms || '')
            }}
            isEditMode={true}
          />
        )
      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        const hasCustomer = selectedCustomerType === 'existing' ? !!selectedRateCard : !!newCustomerName.trim()
        const hasProjectDetails = !!projectName.trim() && !!proposalDate
        return hasCustomer && hasProjectDetails
      case 2:
        return topics.length > 0 && topics.every(topic => 
          topic.categories.length > 0 && 
          topic.categories.every(category => category.services.length > 0)
        )
      case 3:
        return true
      default:
        return false
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">Yükleniyor...</div>
      </main>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center text-red-600">{error}</div>
      </main>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900">Teklif Düzenle</h1>
          
          <div className="mt-4">
            <StepProgress steps={steps} currentStep={currentStep} />
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            {renderStepContent()}

            <div className="mt-8 flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Geri
                </button>
              )}
              {currentStep === 4 ? (
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAsRevision}
                    className="bg-green-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Revize Teklif Kaydet
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAsNew}
                    className="bg-purple-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Yeni Teklif Kaydet
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Kaydet
                  </button>
                </div>
              ) : (
                currentStep < 3 && (
                  <button
                    type="submit"
                    className="ml-auto bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    İleri
                  </button>
                )
              )}
            </div>
          </form>
        </div>

        {/* Error Modal */}
        {showErrorModal && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998]" onClick={() => setShowErrorModal(false)} />
            <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="text-red-600 mb-4 font-medium">{errorMessage}</div>
                {errorMessage.includes('bir teklif zaten mevcut') && (
                  <div className="mb-4">
                    <label htmlFor="newProjectName" className="block text-sm font-medium text-gray-700 mb-1">
                      Yeni Proje İsmi
                    </label>
                    <input
                      id="newProjectName"
                      type="text"
                      value={newProjectNameInput}
                      onChange={(e) => setNewProjectNameInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Yeni proje ismi giriniz"
                      autoFocus
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowErrorModal(false)}
                    className="bg-gray-200 py-2 px-4 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    İptal
                  </button>
                  {errorMessage.includes('bir teklif zaten mevcut') && (
                    <button
                      type="button"
                      onClick={() => {
                        if (newProjectNameInput.trim()) {
                          saveNewProposal(newProjectNameInput.trim())
                          setShowErrorModal(false)
                        }
                      }}
                      disabled={!newProjectNameInput.trim()}
                      className="bg-blue-600 py-2 px-4 rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Kaydet
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
} 
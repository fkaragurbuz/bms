'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import StepProgress from '@/components/StepProgress'
import CustomerStep from './components/CustomerStep'
import ServicesStep from './components/ServicesStep'
import PricingStep from './components/PricingStep'
import PreviewStep from './components/PreviewStep'
import { RateCard, Topic } from './types'

interface FormData {
  customerName: string
  projectName: string
  date: string
  topics: Topic[]
  totalAmount: number
  showTotal: boolean
  discount?: {
    type: 'percentage' | 'amount'
    value: number
  }
  agencyCommission?: {
    type: 'percentage' | 'amount'
    value: number
  }
  terms: string
}

const steps = [
  { title: 'Müşteri ve Proje', description: 'Müşteri ve proje bilgileri' },
  { title: 'Hizmetler ve Fiyatlandırma', description: 'Hizmet seçimi ve fiyatlandırma' },
  { title: 'Önizleme', description: 'Şartlar ve son kontrol' }
]

export default function AddProposalPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rateCards, setRateCards] = useState<RateCard[]>([])
  
  const [selectedCustomerType, setSelectedCustomerType] = useState('existing')
  const [selectedRateCard, setSelectedRateCard] = useState('')
  const [newCustomerName, setNewCustomerName] = useState('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [currentTopic, setCurrentTopic] = useState('')
  const [proposalDate, setProposalDate] = useState(new Date().toISOString().split('T')[0])
  const [showTerms, setShowTerms] = useState(false)
  const [termsText, setTermsText] = useState(`Teklif Şartları:
1.  Teklifte yer alan tüm fiyatlar KDV hariç Türk Lirası olarak hazırlanmıştır.
2.  Teklif, geçerlilik süresi sonuna kadar geçerlidir.
3.  Ödeme, işin bitimini takip eden 30 (Otuz) takvim günü içerisinde toplam tutarın tamamı olarak gerçekleştirilecektir.`)
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
  const [projectName, setProjectName] = useState('')

  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    projectName: '',
    date: new Date().toISOString().split('T')[0],
    topics: [],
    totalAmount: 0,
    showTotal: true,
    discount: undefined,
    agencyCommission: undefined,
    terms: ''
  })

  // Rate Card'ları yükle
  useEffect(() => {
    const fetchRateCards = async () => {
      try {
        const response = await fetch('/api/ratecards')
        if (!response.ok) throw new Error('Rate cardlar yüklenemedi')
        const data = await response.json()
        setRateCards(data)
      } catch (err) {
        console.error(err)
        setError('Rate cardlar yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchRateCards()
  }, [])

  useEffect(() => {
    if (topics.length > 0) {
      setCurrentTopic(topics[0].name)
    }
  }, [topics])

  // Toplam hesaplama fonksiyonları
  const calculateCategoryTotal = useCallback((services: any[]) => {
    return services.reduce((total, service) => total + service.totalPrice, 0)
  }, [])

  const calculateTopicTotal = useCallback((topic: Topic) => {
    return topic.categories.reduce((total, category) => 
      total + calculateCategoryTotal(category.services), 0)
  }, [calculateCategoryTotal])

  const calculateGrandTotal = useCallback(() => {
    const subtotal = topics.reduce((total, topic) => total + calculateTopicTotal(topic), 0)
    
    // Önce indirim hesaplanır
    const discountAmount = showDiscount ? (discountType === 'percentage' ? 
      (subtotal * (discountValue / 100)) : discountValue) : 0
    const afterDiscount = subtotal - discountAmount

    // Ajans komisyonu, indirim varsa indirimli tutar üzerinden, yoksa toplam tutar üzerinden hesaplanır
    const commissionBaseAmount = showDiscount ? afterDiscount : subtotal
    const commissionAmount = showAgencyCommission ? (agencyCommissionType === 'percentage' ? 
      (commissionBaseAmount * (agencyCommissionValue / 100)) : agencyCommissionValue) : 0

    return afterDiscount + commissionAmount
  }, [
    topics,
    showDiscount,
    discountType,
    discountValue,
    showAgencyCommission,
    agencyCommissionType,
    agencyCommissionValue,
    calculateTopicTotal
  ])

  useEffect(() => {
    // formData'yı güncelle
    const subtotal = topics.reduce((total, topic) => total + calculateTopicTotal(topic), 0)
    
    // Önce indirim hesaplanır
    const discountAmount = showDiscount ? (discountType === 'percentage' ? 
      (subtotal * (discountValue / 100)) : discountValue) : 0
    const afterDiscount = subtotal - discountAmount

    // Ajans komisyonu, indirim varsa indirimli tutar üzerinden, yoksa toplam tutar üzerinden hesaplanır
    const commissionBaseAmount = showDiscount ? afterDiscount : subtotal
    const commissionAmount = showAgencyCommission ? (agencyCommissionType === 'percentage' ? 
      (commissionBaseAmount * (agencyCommissionValue / 100)) : agencyCommissionValue) : 0

    const finalTotal = afterDiscount + commissionAmount

    setFormData(prevData => ({
      ...prevData,
      customerName: selectedCustomerType === 'existing'
        ? rateCards.find(rc => rc.id === selectedRateCard)?.customerName || ''
        : newCustomerName,
      date: proposalDate,
      topics,
      totalAmount: finalTotal,
      discount: showDiscount ? {
        type: discountType,
        value: discountValue
      } : undefined,
      agencyCommission: showAgencyCommission ? {
        type: agencyCommissionType,
        value: agencyCommissionValue
      } : undefined,
      terms: termsText
    }))
  }, [
    selectedCustomerType,
    selectedRateCard,
    newCustomerName,
    proposalDate,
    topics,
    showDiscount,
    discountType,
    discountValue,
    showAgencyCommission,
    agencyCommissionType,
    agencyCommissionValue,
    termsText,
    calculateTopicTotal,
    rateCards
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (currentStep < 3) {
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

      if (!customerName) {
        setError('Lütfen müşteri adını girin')
        return
      }

      // Kullanıcı bilgisini localStorage'dan al
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const createdBy = user ? user.name : 'Bilinmeyen Kullanıcı'

      const proposal = {
        customerName,
        projectName,
        date: proposalDate,
        status: 'Taslak',
        totalAmount: calculateGrandTotal(),
        description: '',
        terms: termsText,
        createdBy,
        topics,
        showTotal: true,
        discount: showDiscount ? {
          type: discountType,
          value: discountValue
        } : undefined,
        agencyCommission: showAgencyCommission ? {
          type: agencyCommissionType,
          value: agencyCommissionValue
        } : undefined,
        rateCardId: selectedCustomerType === 'existing' ? selectedRateCard : null
      }

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposal)
      })

      if (!response.ok) throw new Error('Teklif oluşturulamadı')

      const newProposal = await response.json()
      router.push('/proposals')
    } catch (err) {
      setError('Teklif oluşturulurken bir hata oluştu')
      console.error(err)
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
        const discountAmount = showDiscount ? (discountType === 'percentage' ? 
          (subtotal * (discountValue / 100)) : discountValue) : 0
        const afterDiscount = subtotal - discountAmount
        const commissionBaseAmount = showDiscount ? afterDiscount : subtotal
        const commissionAmount = showAgencyCommission ? (agencyCommissionType === 'percentage' ? 
          (commissionBaseAmount * (agencyCommissionValue / 100)) : agencyCommissionValue) : 0
        const finalTotal = afterDiscount + commissionAmount

        return (
          <div className="space-y-8">
            <ServicesStep
              topics={topics}
              setTopics={setTopics}
              currentTopic={currentTopic}
              setCurrentTopic={setCurrentTopic}
              selectedRateCard={selectedRateCard}
              rateCards={rateCards}
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
                total={finalTotal}
                discount={discountAmount}
              />
            </div>
          </div>
        )
      case 3:
        return (
          <PreviewStep
            data={{
              customerName: selectedCustomerType === 'existing'
                ? rateCards.find(rc => rc.id === selectedRateCard)?.customerName || ''
                : newCustomerName,
              projectName,
              date: proposalDate,
              topics,
              totalAmount: calculateGrandTotal(),
              showTotal: formData.showTotal,
              discount: showDiscount ? {
                type: discountType,
                value: discountValue
              } : undefined,
              agencyCommission: showAgencyCommission ? {
                type: agencyCommissionType,
                value: agencyCommissionValue
              } : undefined,
              terms: termsText
            }}
            onChange={(data) => {
              setFormData(data)
              setTermsText(data.terms || '')
            }}
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
        return !!termsText.trim() // Şartlar boş olmamalı
      default:
        return false
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">Yükleniyor...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <StepProgress steps={steps} currentStep={currentStep} />
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {renderStepContent()}

        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded ${
              currentStep === 1
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            Geri
          </button>

          {currentStep < 3 && (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className={`px-6 py-2 rounded ${
                !canProceed()
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              İleri
            </button>
          )}
        </div>
      </main>
    </div>
  )
} 
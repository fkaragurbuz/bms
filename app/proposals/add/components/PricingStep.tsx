interface PricingStepProps {
  showDiscount: boolean
  setShowDiscount: (show: boolean) => void
  discountType: 'percentage' | 'amount'
  setDiscountType: (type: 'percentage' | 'amount') => void
  discountValue: number
  setDiscountValue: (value: number) => void
  showAgencyCommission: boolean
  setShowAgencyCommission: (show: boolean) => void
  agencyCommissionType: 'percentage' | 'amount'
  setAgencyCommissionType: (type: 'percentage' | 'amount') => void
  agencyCommissionValue: number
  setAgencyCommissionValue: (value: number) => void
  subtotal: number
  total: number
  discount: number
}

export default function PricingStep({
  showDiscount,
  setShowDiscount,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  showAgencyCommission,
  setShowAgencyCommission,
  agencyCommissionType,
  setAgencyCommissionType,
  agencyCommissionValue,
  setAgencyCommissionValue,
  subtotal,
  total,
  discount
}: PricingStepProps) {
  // İndirimli tutarı hesapla
  const afterDiscount = subtotal - discount

  // Ajans komisyonunu hesapla (indirim varsa indirimli tutar üzerinden)
  const calculateAgencyCommission = () => {
    if (!showAgencyCommission || !agencyCommissionValue) return 0
    const baseAmount = showDiscount ? afterDiscount : subtotal
    
    if (agencyCommissionType === 'percentage') {
      return baseAmount * (agencyCommissionValue / 100)
    }
    return agencyCommissionValue
  }

  const agencyCommission = calculateAgencyCommission()
  const finalTotal = afterDiscount + agencyCommission

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Fiyatlandırma</h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <label className="inline-flex items-center min-w-[180px]">
                <input
                  type="checkbox"
                  checked={showDiscount}
                  onChange={(e) => {
                    setShowDiscount(e.target.checked)
                    if (!e.target.checked) {
                      setDiscountValue(0)
                    }
                  }}
                  className="mr-2"
                />
                İndirim Uygula
              </label>
              {showDiscount && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as 'percentage' | 'amount')
                    }
                    className="p-2 border rounded w-28"
                  >
                    <option value="percentage">Yüzde</option>
                    <option value="amount">Tutar</option>
                  </select>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) =>
                      setDiscountValue(parseFloat(e.target.value) || 0)
                    }
                    placeholder={
                      discountType === 'percentage' ? 'İndirim %' : 'İndirim Tutarı'
                    }
                    className="w-full sm:w-36 p-2 border rounded"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <label className="inline-flex items-center min-w-[180px]">
                <input
                  type="checkbox"
                  checked={showAgencyCommission}
                  onChange={(e) => {
                    setShowAgencyCommission(e.target.checked)
                    if (!e.target.checked) {
                      setAgencyCommissionValue(0)
                    }
                  }}
                  className="mr-2"
                />
                Ajans Hizmet Bedeli
              </label>
              {showAgencyCommission && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={agencyCommissionType}
                    onChange={(e) =>
                      setAgencyCommissionType(e.target.value as 'percentage' | 'amount')
                    }
                    className="p-2 border rounded w-28"
                  >
                    <option value="percentage">Yüzde</option>
                    <option value="amount">Tutar</option>
                  </select>
                  <input
                    type="number"
                    value={agencyCommissionValue}
                    onChange={(e) =>
                      setAgencyCommissionValue(parseFloat(e.target.value) || 0)
                    }
                    placeholder={
                      agencyCommissionType === 'percentage' ? 'Komisyon %' : 'Komisyon Tutarı'
                    }
                    className="w-full sm:w-36 p-2 border rounded"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Ara Toplam:</span>
              <span>
                {subtotal.toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY'
                })}
              </span>
            </div>
            {showDiscount && (
              <div className="flex justify-between text-red-500">
                <span>İndirim:</span>
                <span>
                  -
                  {discount.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  })}
                </span>
              </div>
            )}
            {showDiscount && (
              <div className="flex justify-between font-medium">
                <span>İndirimli Tutar:</span>
                <span>
                  {afterDiscount.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  })}
                </span>
              </div>
            )}
            {showAgencyCommission && (
              <div className="flex justify-between text-blue-500">
                <span>Ajans Hizmet Bedeli{showDiscount ? ' (İndirimli Tutar Üzerinden)' : ''}:</span>
                <span>
                  +
                  {agencyCommission.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between font-medium text-lg">
              <span>Genel Toplam:</span>
              <span>
                {finalTotal.toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
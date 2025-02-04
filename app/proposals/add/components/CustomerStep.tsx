import { RateCard } from '../types'

interface CustomerStepProps {
  selectedCustomerType: string
  setSelectedCustomerType: (type: string) => void
  selectedRateCard: string
  setSelectedRateCard: (id: string) => void
  newCustomerName: string
  setNewCustomerName: (name: string) => void
  rateCards: RateCard[]
  projectName: string
  setProjectName: (name: string) => void
  proposalDate: string
  setProposalDate: (date: string) => void
}

export default function CustomerStep({
  selectedCustomerType,
  setSelectedCustomerType,
  selectedRateCard,
  setSelectedRateCard,
  newCustomerName,
  setNewCustomerName,
  rateCards,
  projectName,
  setProjectName,
  proposalDate,
  setProposalDate
}: CustomerStepProps) {
  return (
    <div className="space-y-6">
      {/* Müşteri Seçimi */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Müşteri Bilgileri</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="existing"
                checked={selectedCustomerType === 'existing'}
                onChange={(e) => setSelectedCustomerType(e.target.value)}
                className="mr-2"
              />
              Mevcut Müşteri
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="new"
                checked={selectedCustomerType === 'new'}
                onChange={(e) => setSelectedCustomerType(e.target.value)}
                className="mr-2"
              />
              Yeni Müşteri
            </label>
          </div>

          {selectedCustomerType === 'existing' ? (
            <select
              value={selectedRateCard}
              onChange={(e) => setSelectedRateCard(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Müşteri Seçin</option>
              {rateCards.map((rc) => (
                <option key={rc.id} value={rc.id}>
                  {rc.customerName}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="Müşteri Adı"
              className="w-full p-2 border rounded"
            />
          )}
        </div>
      </div>

      {/* Proje Detayları */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Proje Detayları</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proje Adı
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Proje Adı"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teklif Tarihi
            </label>
            <input
              type="date"
              value={proposalDate}
              onChange={(e) => setProposalDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>
    </div>
  )
} 
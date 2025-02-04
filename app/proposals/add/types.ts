export interface RateCard {
  id: string;
  customerName: string;
  categories: Category[];
}

export interface Category {
  id: string;
  name: string;
  services: Service[];
}

export interface Service {
  id: string;
  name: string;
  unit: string;
  price: number;
  days: number;
  quantity: number;
  totalPrice: number;
}

export interface Topic {
  id: string;
  name: string;
  categories: {
    id: string;
    name: string;
    isCustom?: boolean;
    services: {
      id: string;
      name: string;
      unit: string;
      price: number;
      days: number;
      quantity: number;
      totalPrice: number;
      isCustom?: boolean;
    }[];
  }[];
}

export interface Proposal {
  id?: string
  customerName: string
  projectName: string
  date: string
  topics: Topic[]
  totalAmount: number
  discount?: {
    type: 'percentage' | 'amount'
    value: number
  }
  agencyCommission?: {
    type: 'percentage' | 'amount'
    value: number
  }
  terms?: string
  showTotal: boolean
} 
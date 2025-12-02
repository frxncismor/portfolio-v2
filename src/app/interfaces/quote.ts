export interface ProjectType {
  id: string;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
}

export interface Enhancement {
  id: string;
  name: string;
  description?: string;
  icon: string;
  price: number;
}

export type Currency = 'USD' | 'MXN';

export interface QuoteCalculation {
  basePrice: number;
  modulesPrice: number;
  enhancementsPrice: number;
  subtotal: number;
  deliveryDays: number;
}

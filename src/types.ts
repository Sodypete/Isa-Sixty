/**
 * Types and interfaces for the Isaiah Sixty Creations catering order system.
 */

export type FoodCategory =
  | 'Meats'
  | 'Pastries'
  | 'Rice'
  | 'Sides'
  | 'Small chops'
  | 'Soups'
  | 'Swallows';

export interface PortionOption {
  id: string; // Identifier for this portion, e.g. '1.5kg', '1kg', '0.5kg'
  label: string; // Display label
  unit: string; // Formatted unit string
  price: number; // Price in CAD
  isCustomPrice?: boolean; // Optional estimate indicator
}

export interface MenuItem {
  id: string; // Unique identifier
  name: string; // Item name
  category: FoodCategory; // Food category group
  unit: string; // Quantity/portion unit (e.g., "2 litres", "1 doz")
  price: number; // Price in CAD
  isCustomPrice?: boolean; // Indicates if the price is a default estimate
  description?: string; // Optional item description
  imageUrl?: string; // Optional image URL
  portions?: PortionOption[]; // Selectable portion variants
}

export interface CartItem {
  menuItem: MenuItem; // Reference to the menu item
  quantity: number; // Selected quantity
}

export interface CardDetails {
  cardNumber: string; // Credit card number
  expiryDate: string; // Expiry MM/YY
  cvv: string; // Card security code
  cardholderName: string; // Name on the card
}

export interface OrderDetails {
  id: string; // Generated order confirmation number
  customerName: string; // Name of client
  customerEmail: string; // Email for updates and invoicing
  customerPhone: string; // Phone number
  eventDate: string; // Catering event or pickup/delivery date
  eventTime: string; // Setup/delivery target time
  orderType: 'delivery' | 'pickup'; // Order fulfillment type
  deliveryAddress?: string; // Address if delivery is selected
  specialInstructions: string; // Chef notes or dietary specifications
  isDepositPaid: boolean; // Tracking checkmark: deposit status
  isFullPaymentMade: boolean; // Tracking checkmark: full payment status
  paymentMethod: 'card' | 'interac' | null; // Chosen payment pipeline
  interacRefNumber?: string; // Interac e-Transfer reference number
  cardDetails: CardDetails; // Holds entered card details if applicable
  isChinChinOnly?: boolean; // True when order contains only Chin Chin
  subtotal?: number; // Cart subtotal before shipping/delivery
  shippingFee?: number; // Calculated shipping fee
  totalAmount?: number; // Total payable amount
  shippingStreet?: string; // Shipping street address
  shippingCity?: string; // Shipping city
  shippingState?: string; // Shipping state or province
  shippingPostalCode?: string; // Shipping postal or zip code
}

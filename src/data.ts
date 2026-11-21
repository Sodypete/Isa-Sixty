/**
 * Data file containing the structured menu for Isaiah Sixty Creations.
 */
import { MenuItem, FoodCategory } from './types';
import afangSoupImg from './assets/images/Menu/Afang Soup.jpg';
import bunsImg from './assets/images/Menu/Buns .jpg';
import chickenImg from './assets/images/Menu/Chicken .jpg';
import chickenPieImg from './assets/images/Menu/Chicken Pie.jpg';
import ebaImg from './assets/images/Menu/Eba.jpg';
import egusiSoupImg from './assets/images/Menu/Eguisi Soup.jpg';
import eggRollImg from './assets/images/Menu/Egg roll.jpg';
import friedRiceImg from './assets/images/Menu/Fried Rice.jpeg';
import goatMeatImg from './assets/images/Menu/Goat Meat.jpg';
import meatpieImg from './assets/images/Menu/Meatpie.jpg';
import moinmoinImg from './assets/images/Menu/Moinmoin.jpeg';
import pepperedChickenImg from './assets/images/Menu/Peppered Chicken.jpg';
import poundoYamImg from './assets/images/Menu/Poundo Yam.jpg';
import samosaImg from './assets/images/Menu/Samosa.jpg';
import sausageRollImg from './assets/images/Menu/Sausage Roll.jpg';
import springRollsImg from './assets/images/Menu/Spring rolls .jpg';
import vegetableSoupImg from './assets/images/Menu/Vegetable Soup.jpeg';
import whiteRiceImg from './assets/images/Menu/White rice.jpg';
import friedFishImg from './assets/images/Menu/Fried Fish.jpg';
import puffPuffImg from './assets/images/Menu/Puff-Puff.jpg';
import turkeyImg from './assets/images/Menu/Turkey.jpg';
import chinChinImg from './assets/images/Menu/Chin Chin.jpg';
import chinChin300gImg from './assets/images/Menu/Chin 300g.jpeg';
import chinChin700gImg from './assets/images/Menu/Chin 700g.jpeg';
import chinChin1500gImg from './assets/images/Menu/Chin 1500g.jpeg';
import chinChinAllSizesImg from './assets/images/Menu/Chin All 3.jpeg';

// Export categories to preserve order and grouping in the UI
export const CATEGORIES: { name: FoodCategory; icon: string; description: string }[] = [
  {
    name: 'Meats',
    icon: 'Beef',
    description: 'Seasoned meat and poultry dishes'
  },
  {
    name: 'Rice',
    icon: 'ChefHat',
    description: 'West African rice favorites'
  },
  {
    name: 'Soups',
    icon: 'Soup',
    description: 'Traditional homemade soups'
  },
  {
    name: 'Small chops',
    icon: 'Cookie',
    description: 'Finger foods and party snacks'
  },
  {
    name: 'Pastries',
    icon: 'Croissant',
    description: 'Fresh baked pies and rolls'
  },
  {
    name: 'Sides',
    icon: 'Utensils',
    description: 'Side dishes to complete your meal'
  },
  {
    name: 'Swallows',
    icon: 'CircleDot',
    description: 'Traditional swallows for soups'
  }
];

// Complete menu item listings as detailed by the user
export const MENU_ITEMS: MenuItem[] = [
  // MEATS
  {
    id: 'meat-goat',
    name: 'Goatmeat',
    category: 'Meats',
    unit: '2 litres',
    price: 150.00,
    description: 'Tender goat meat slow-cooked with peppers, onions, and spices.',
    imageUrl: goatMeatImg
  },
  {
    id: 'meat-chicken',
    name: 'Chicken',
    category: 'Meats',
    unit: '1 doz',
    price: 40.00,
    description: 'Seasoned chicken pieces, grilled or fried.',
    imageUrl: chickenImg
  },
  {
    id: 'meat-turkey',
    name: 'Turkey',
    category: 'Meats',
    unit: '1 doz',
    price: 41.00,
    description: 'Crispy seasoned turkey wings and drumettes.',
    imageUrl: turkeyImg
  },
  {
    id: 'meat-fish',
    name: 'Fried Fish',
    category: 'Meats',
    unit: '1 doz',
    price: 60.00,
    description: 'Seasoned fish cutlets, fried until crispy on the outside.',
    imageUrl: friedFishImg
  },

  // PASTRIES
  {
    id: 'pastry-sausage-roll',
    name: 'Sausage Roll',
    category: 'Pastries',
    unit: '0.5 dozen',
    price: 12.50,
    description: 'Golden puff pastry filled with seasoned sausage meat.',
    imageUrl: sausageRollImg
  },
  {
    id: 'pastry-buns',
    name: 'Buns',
    category: 'Pastries',
    unit: '1 dozen',
    price: 15.00,
    description: 'Sweet fried buns, crispy outside and soft inside.',
    imageUrl: bunsImg
  },
  {
    id: 'pastry-meat-pie',
    name: 'Meat Pie',
    category: 'Pastries',
    unit: '0.5 dozen',
    price: 25.00,
    description: 'Flaky pastry filled with seasoned minced beef, potatoes, and carrots.',
    imageUrl: meatpieImg
  },
  {
    id: 'pastry-chicken-pie',
    name: 'Chicken Pie',
    category: 'Pastries',
    unit: '0.5 dozen',
    price: 30.00,
    description: 'Flaky pastry filled with seasoned chicken and vegetables.',
    imageUrl: chickenPieImg
  },

  // RICE
  {
    id: 'rice-jollof',
    name: 'Jollof Rice',
    category: 'Rice',
    unit: '1 liter',
    price: 60.00,
    description: 'Classic smoky Jollof rice cooked in a seasoned tomato and pepper base.'
  },
  {
    id: 'rice-fried',
    name: 'Fried Rice',
    category: 'Rice',
    unit: '1 liter',
    price: 80.00,
    description: 'Rice stir-fried with mixed vegetables, liver, and chicken.',
    imageUrl: friedRiceImg
  },

  // SIDES
  {
    id: 'side-moinmoin',
    name: 'Moinmoin',
    category: 'Sides',
    unit: '1 dozen',
    price: 36.00,
    description: 'Steamed bean pudding made with peppers, onions, and boiled eggs.',
    imageUrl: moinmoinImg
  },
  {
    id: 'side-white-rice',
    name: 'White Rice',
    category: 'Sides',
    unit: '1 tray',
    price: 45.00,
    isCustomPrice: true,
    description: 'Fluffy steamed white rice, great with stews and soups.',
    imageUrl: whiteRiceImg
  },

  // SMALL CHOPS
  {
    id: 'chops-chin-chin',
    name: 'Chin Chin',
    category: 'Small chops',
    unit: '300g',
    price: 17.50,
    description: 'Crispy fried pastry snack seasoned with nutmeg and vanilla. Available in 300g, 700g, and 1500g.',
    imageUrl: chinChinImg,
    portions: [
      { id: '300g', label: '300g', unit: '300g pouch', price: 17.50 },
      { id: '700g', label: '700g', unit: '700g jar', price: 27.50 },
      { id: '1500g', label: '1500g', unit: '1500g (1.5kg) tub', price: 48.50 }
    ]
  },
  {
    id: 'chops-spring-roll',
    name: 'Spring Roll',
    category: 'Small chops',
    unit: '1 dozen',
    price: 24.00,
    description: 'Crispy fried rolls filled with seasoned vegetables and chicken.',
    imageUrl: springRollsImg
  },
  {
    id: 'chops-samosa',
    name: 'Samosa',
    category: 'Small chops',
    unit: '1 dozen',
    price: 24.00,
    description: 'Crispy pastry triangles filled with spiced minced beef and onions.',
    imageUrl: samosaImg
  },
  {
    id: 'chops-puff-puff',
    name: 'Puff-Puff',
    category: 'Small chops',
    unit: '1 tray (40 balls)',
    price: 25.00,
    description: 'Sweet, golden fried dough balls.',
    imageUrl: puffPuffImg
  },
  {
    id: 'chops-peppered-chicken',
    name: 'Peppered Chicken',
    category: 'Small chops',
    unit: '1 dozen',
    price: 30.00,
    description: 'Fried chicken pieces tossed in spicy pepper sauce.',
    imageUrl: pepperedChickenImg
  },
  {
    id: 'chops-egg-roll',
    name: 'Egg Roll',
    category: 'Small chops',
    unit: '1 dozen',
    price: 36.00,
    description: 'Fried dough roll with a whole boiled egg inside.',
    imageUrl: eggRollImg
  },

  // SOUPS
  {
    id: 'soup-vegetable',
    name: 'Vegetable Soup',
    category: 'Soups',
    unit: '2 litres',
    price: 100.00,
    description: 'Leafy vegetable soup cooked with meat, fish, and seasonings.',
    imageUrl: vegetableSoupImg
  },
  {
    id: 'soup-egusi',
    name: 'Egusi Soup',
    category: 'Soups',
    unit: '2 litres',
    price: 80.00,
    description: 'Traditional soup made with ground melon seeds, spinach, and meat.',
    imageUrl: egusiSoupImg
  },
  {
    id: 'soup-afang',
    name: 'Afang Soup',
    category: 'Soups',
    unit: '2 litres',
    price: 90.00,
    description: 'Hearty soup made with shredded afang leaves, spinach, and assorted meat.',
    imageUrl: afangSoupImg
  },

  // SWALLOWS
  {
    id: 'swallow-eba',
    name: 'Eba',
    category: 'Swallows',
    unit: '1 roll',
    price: 6.00,
    isCustomPrice: true,
    description: 'Smooth swallow made from cassava flakes (garri).',
    imageUrl: ebaImg
  },
  {
    id: 'swallow-poundo',
    name: 'Poundo Yam',
    category: 'Swallows',
    unit: '1 roll',
    price: 8.00,
    isCustomPrice: true,
    description: 'Soft, smooth swallow made from yam flour.',
    imageUrl: poundoYamImg
  },
  {
    id: 'swallow-semo',
    name: 'Semo',
    category: 'Swallows',
    unit: '1 roll',
    price: 7.00,
    isCustomPrice: true,
    description: 'Smooth swallow made from semolina.'
  }
];

export interface ChinChinPictureItem {
  id: string;
  url: string;
  title: string;
  caption: string;
  dateAdded?: string;
  isUserAdded?: boolean;
}

export interface ChinChinSizeSpecification {
  id: '300g' | '700g' | '1500g';
  weight: string; // '300g', '700g', '1500g'
  header: string; // Header for this size
  subHeader: string;
  badge: string;
  price: number;
  servings: string;
  packaging: string;
  highlights: string[];
  description: string;
  defaultPictures: ChinChinPictureItem[];
}

export const CHIN_CHIN_SIZES_DATA: ChinChinSizeSpecification[] = [
  {
    id: '300g',
    weight: '300g',
    header: '300g Snack Pack',
    subHeader: 'Single or couple snack',
    badge: '300g',
    price: 17.50,
    servings: '1 - 2 people',
    packaging: 'Pouch bag (300g)',
    highlights: [
      'Resealable bag keeps snacks fresh and crunchy',
      'Great for quick snacking and gifts',
      'Freshly made with butter, nutmeg, and vanilla'
    ],
    description: 'Crunchy bite-sized pastry bites seasoned with real butter, nutmeg, and vanilla.',
    defaultPictures: [
      {
        id: 'pic-300g-comparison',
        url: chinChin300gImg,
        title: '300g Bag Size Comparison',
        caption: '300g pouch bag shown beside a standard 15 oz can for size comparison.'
      },
      {
        id: 'pic-all-sizes-1',
        url: chinChinAllSizesImg,
        title: 'All Sizes Together',
        caption: 'All three bag sizes (300g, 700g, 1500g) side by side in one picture.'
      }
    ]
  },
  {
    id: '700g',
    weight: '700g',
    header: '700g Family Bag',
    subHeader: 'Medium sharing size',
    badge: '700g',
    price: 27.50,
    servings: '4 - 6 people',
    packaging: 'Medium bag (700g)',
    highlights: [
      'Great for sharing at home or the office',
      'Airtight bag keeps snacks crunchy for weeks',
      'Eligible for nationwide shipping'
    ],
    description: 'Packed in a secure bag to stay fresh and crunchy. Great for family sharing.',
    defaultPictures: [
      {
        id: 'pic-700g-comparison',
        url: chinChin700gImg,
        title: '700g Bag Size Comparison',
        caption: '700g bag shown beside a standard 15 oz can for size comparison.'
      },
      {
        id: 'pic-all-sizes-2',
        url: chinChinAllSizesImg,
        title: 'All Sizes Together',
        caption: 'All three bag sizes (300g, 700g, 1500g) side by side in one picture.'
      }
    ]
  },
  {
    id: '1500g',
    weight: '1500g',
    header: '1500g Party Bag (1.5 kg)',
    subHeader: 'Large party size (1.5 kg)',
    badge: '1500g',
    price: 48.50,
    servings: '10 - 15 people',
    packaging: 'Jumbo bag (1500g / 1.5kg)',
    highlights: [
      'Best value for parties, events, and birthdays',
      'Feeds 10 to 15 people',
      'Eligible for nationwide shipping'
    ],
    description: 'Our largest size for parties, birthdays, weddings, church events, and family gatherings.',
    defaultPictures: [
      {
        id: 'pic-1500g-comparison',
        url: chinChin1500gImg,
        title: '1500g Bag Size Comparison',
        caption: '1500g jumbo bag shown beside a standard 15 oz can for size comparison.'
      },
      {
        id: 'pic-all-sizes-3',
        url: chinChinAllSizesImg,
        title: 'All Sizes Together',
        caption: 'All three bag sizes (300g, 700g, 1500g) side by side in one picture.'
      }
    ]
  }
];


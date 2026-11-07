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
import chinChinImg from './assets/images/Menu/Chin Chin.jpg';

// Export categories to preserve order and grouping in the UI
export const CATEGORIES: { name: FoodCategory; icon: string; description: string }[] = [
  {
    name: 'Meats',
    icon: 'Beef',
    description: 'Succulent, richly seasoned meat and poultry dishes'
  },
  {
    name: 'Rice',
    icon: 'ChefHat',
    description: 'Flavorful West African signature rice delicacies'
  },
  {
    name: 'Soups',
    icon: 'Soup',
    description: 'Traditional, nutritious, slow-simmered rich soups'
  },
  {
    name: 'Small chops',
    icon: 'Cookie',
    description: 'Delectable, bite-sized party favorites and appetizers'
  },
  {
    name: 'Pastries',
    icon: 'Croissant',
    description: 'Golden, freshly baked sweet and savory pastries'
  },
  {
    name: 'Sides',
    icon: 'Utensils',
    description: 'Perfect accompaniments to round out your feast'
  },
  {
    name: 'Swallows',
    icon: 'CircleDot',
    description: 'Authentic dough-like accompaniments for soups'
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
    description: 'Tender goatmeat chunks, slow-cooked in a rich, aromatic blend of peppers, onions, and local spices.',
    imageUrl: goatMeatImg
  },
  {
    id: 'meat-chicken',
    name: 'Chicken',
    category: 'Meats',
    unit: '1 doz',
    price: 40.00,
    description: 'Flavor-infused chicken parts, seasoned with garlic, ginger, and herbs, grilled or fried to golden perfection.',
    imageUrl: chickenImg
  },
  {
    id: 'meat-turkey',
    name: 'Turkey',
    category: 'Meats',
    unit: '1 doz',
    price: 41.00,
    description: 'Crispy yet juicy seasoned turkey wings and drumettes, marinated in a special chef blend of savory spices.'
  },
  {
    id: 'meat-fish',
    name: 'Fried Fish',
    category: 'Meats',
    unit: '1 doz',
    price: 60.00,
    description: 'Marinated fish cutlets, coated in seasoned batter and deep-fried until wonderfully crispy outside and flaky inside.',
    imageUrl: friedFishImg
  },

  // PASTRIES
  {
    id: 'pastry-sausage-roll',
    name: 'Sausage Roll',
    category: 'Pastries',
    unit: '0.5 dozen',
    price: 12.50,
    description: 'Flaky golden puff pastry rolled around seasoned, spiced minced sausage meat, baked fresh.',
    imageUrl: sausageRollImg
  },
  {
    id: 'pastry-buns',
    name: 'Buns',
    category: 'Pastries',
    unit: '1 dozen',
    price: 15.00,
    description: 'Classic West African buns, sweet and crunchy on the outside, soft and cake-like on the inside.',
    imageUrl: bunsImg
  },
  {
    id: 'pastry-meat-pie',
    name: 'Meat Pie',
    category: 'Pastries',
    unit: '0.5 dozen',
    price: 25.00,
    description: 'Buttery, crumbly shortcrust pastry cases generously filled with seasoned minced beef, potatoes, and carrots.',
    imageUrl: meatpieImg
  },
  {
    id: 'pastry-chicken-pie',
    name: 'Chicken Pie',
    category: 'Pastries',
    unit: '0.5 dozen',
    price: 30.00,
    description: 'Rich, golden crust encasing a creamy filling of seasoned shredded chicken breasts and mixed garden vegetables.',
    imageUrl: chickenPieImg
  },

  // RICE
  {
    id: 'rice-jollof',
    name: 'Jollof Rice',
    category: 'Rice',
    unit: '1 liter',
    price: 60.00,
    description: 'Authentic smoky Jollof rice cooked in a robust tomato, red bell pepper, and scotch bonnet base with fine spices.'
  },
  {
    id: 'rice-fried',
    name: 'Fried Rice',
    category: 'Rice',
    unit: '1 liter',
    price: 80.00,
    description: 'Fragrant parboiled rice stir-fried with sweet peas, carrots, sweet corn, green peppers, liver, and rich stock.',
    imageUrl: friedRiceImg
  },

  // SIDES
  {
    id: 'side-moinmoin',
    name: 'Moinmoin',
    category: 'Sides',
    unit: '1 dozen',
    price: 36.00,
    description: 'Nutritious steamed bean pudding crafted from pureed peeled beans, red peppers, onions, and boiled eggs.',
    imageUrl: moinmoinImg
  },
  {
    id: 'side-white-rice',
    name: 'White Rice',
    category: 'Sides',
    unit: '1 tray',
    price: 45.00,
    isCustomPrice: true,
    description: 'Perfectly parboiled, fluffy, hot long-grain white rice, ready to pair with any of our savory stews and soups.',
    imageUrl: whiteRiceImg
  },

  // SMALL CHOPS
  {
    id: 'chops-chin-chin',
    name: 'Chin Chin',
    category: 'Small chops',
    unit: '1.5kg',
    price: 40.00,
    description: 'Crispy, golden-fried crunchy West African pastry bites delicately flavored with nutmeg, sweet cream, and pure vanilla. Perfect for events and party snacking.',
    imageUrl: chinChinImg,
    portions: [
      { id: '1.5kg', label: '1.5kg', unit: '1.5kg', price: 40.00 },
      { id: '1kg', label: '1kg', unit: '1kg', price: 28.00 },
      { id: '0.5kg', label: '0.5kg', unit: '0.5kg', price: 16.00 }
    ]
  },
  {
    id: 'chops-spring-roll',
    name: 'Spring Roll',
    category: 'Small chops',
    unit: '1 dozen',
    price: 24.00,
    description: 'Crispy pastry sheets hand-rolled with a savory stir-fried shredded vegetable and minced protein filling.',
    imageUrl: springRollsImg
  },
  {
    id: 'chops-samosa',
    name: 'Samosa',
    category: 'Small chops',
    unit: '1 dozen',
    price: 24.00,
    description: 'Delectably crisp, triangular pastry pockets packed with a spicy minced beef, pea, and onion mixture.',
    imageUrl: samosaImg
  },
  {
    id: 'chops-puff-puff',
    name: 'Puff-Puff',
    category: 'Small chops',
    unit: '1 tray (40 balls)',
    price: 25.00,
    description: 'Irresistibly sweet, spongy, and golden deep-fried yeast dough balls, a beloved crowd-pleasing snack.'
  },
  {
    id: 'chops-peppered-chicken',
    name: 'Peppered Chicken',
    category: 'Small chops',
    unit: '1 dozen',
    price: 30.00,
    description: 'Mini fried chicken pieces tossed in a hot, sweet, and sticky habanero-bell pepper sauce blend.',
    imageUrl: pepperedChickenImg
  },
  {
    id: 'chops-egg-roll',
    name: 'Egg Roll',
    category: 'Small chops',
    unit: '1 dozen',
    price: 36.00,
    description: 'Soft, fried dough rolls wrapping a whole hard-boiled egg in the center, satisfyingly thick and savory.',
    imageUrl: eggRollImg
  },

  // SOUPS
  {
    id: 'soup-vegetable',
    name: 'Vegetable Soup',
    category: 'Soups',
    unit: '2 litres',
    price: 100.00,
    description: 'A nourishing traditional soup cooked with assorted fresh local leafy vegetables, stock fish, and rich seasonings.',
    imageUrl: vegetableSoupImg
  },
  {
    id: 'soup-egusi',
    name: 'Egusi Soup',
    category: 'Soups',
    unit: '2 litres',
    price: 80.00,
    description: 'Rich soup thickened with ground melon seeds, cooked with chopped spinach, stock fish, and premium local spices.',
    imageUrl: egusiSoupImg
  },
  {
    id: 'soup-afang',
    name: 'Afang Soup',
    category: 'Soups',
    unit: '2 litres',
    price: 90.00,
    description: 'An authentic Efik soup made with shredded Afang (wild spinach) leaves, water leaves, and generous assorted meats.',
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
    description: 'Smooth, dense swallow prepared from premium pan-fried cassava flakes (Garri) hydrated in steaming hot water.',
    imageUrl: ebaImg
  },
  {
    id: 'swallow-poundo',
    name: 'Poundo Yam',
    category: 'Swallows',
    unit: '1 roll',
    price: 8.00,
    isCustomPrice: true,
    description: 'Soft, stretchy, pillowy white swallow kneaded to absolute perfection from real dehydrated sweet white yam.',
    imageUrl: poundoYamImg
  },
  {
    id: 'swallow-semo',
    name: 'Semo',
    category: 'Swallows',
    unit: '1 roll',
    price: 7.00,
    isCustomPrice: true,
    description: 'Delicately textured, smooth semolina swallow prepared carefully to avoid lumps, pairing perfectly with egusi.'
  }
];

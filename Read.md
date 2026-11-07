# Isaiah Sixty Creations Catering Platform - System Overview

Welcome to the **Isaiah Sixty Creations Catering** web application! This document provides a clear, comprehensive breakdown of all features, components, modules, and underlying systems designed to power this premium catering and event booking platform.

---

## 1. Core Application Architecture & Overview
The application is built as a modern, high-performance single-page application (SPA) using React, TypeScript, and Tailwind CSS. It is structured to deliver an immersive, elegant client experience while maintaining robust administrative controls and seamless data persistence.

- **Frontend Framework**: React 18+ with Vite for rapid bundling and lightning-fast page loads.
- **Styling Engine**: Tailwind CSS, using a sophisticated warm neutral palette, responsive grid layouts, and custom typography pairings.
- **Animations**: Framer Motion (`motion/react`) for smooth, professional entry transitions, interactive card hover effects, and modal popups.
- **Icons**: Lucide React icon library for crisp, scalable vector iconography across all navigation and category markers.

---

## 2. Key User-Facing Features & Modules

### 🍽️ Interactive Culinary Menu & Gallery
- **Categorized Menu Navigation**: Customers can easily browse offerings grouped by *Meats, Rice, Soups (Vegetable, Egusi, Afang), Small Chops, Pastries, Sides, and Swallows*.
- **Real High-Resolution Menu Imagery**: Integrated real photography for authentic menu items (such as Vegetable Soup, Egusi Soup, Afang Soup, Samosa, Sausage Rolls, Buns, Chicken, Fried Rice, Meat Pie, Chicken Pie, Spring Rolls, Moinmoin, White Rice, and Eba) with doubled frame heights for vibrant visual appeal.
- **Detailed Item Cards**: Each menu card displays pricing, portion units (e.g., liters, dozens, trays), appetizing descriptions, and quick-add actions.

### 🛒 Smart Cart & Event Quote Calculator
- **Custom Quantity & Portion Adjustments**: Real-time calculation of totals based on event scale and guest counts.
- **Catering Estimate Generator**: Automatically computes estimated food requirements and total costs in CAD, preparing itemized quotes for weddings, birthdays, corporate functions, and banquets.

### 📅 Event Booking & Consultation Wizard
- **Step-by-Step Booking Form**: Allows clients to select event types (Wedding, Corporate, Birthday, Private Banquet), specify guest counts, choose event dates, and submit special dietary requirements.
- **Instant Confirmation & Reference ID**: Generates secure tracking reference IDs for every inquiry or booking submitted.

---

## 3. Administrative & Management Systems

### 🔒 Admin Google Workspace Portal (`/admin`)
- **Secure Access Point**: Accessible via a dedicated footer portal link (`🔒 Admin Google Workspace Portal`) with client-side routing.
- **Order & Booking Management**: Allows staff and administrators to view incoming catering requests, track payment statuses, update order fulfillment stages (Pending, Confirmed, Preparing, Delivered), and manage event notes.
- **Menu Inventory Control**: Real-time capability to adjust prices, update descriptions, toggle item availability, and manage culinary assets.

---

## 4. Technical Systems & Data Persistence

### ☁️ Cloud & Authentication Readiness
- **Firebase Integration**: Configured with Firebase Authentication and Firestore blueprint structures for secure user sign-in and cloud-backed data synchronization.
- **Google Workspace API Support**: Built-in hooks for Google Workspace integrations (such as Calendar syncing for event scheduling and Sheets for order logging).

### 📁 Asset Management & Media Pipeline
- **Organized Directory Structure**: Static culinary photography is securely stored in `/src/assets/images/Menu/` and bundled cleanly through Vite.
- **Fallback Protection**: Graceful fallback placeholders with geometric plating rings and category icons if custom imagery is loading.

---

## 5. Responsive Design & User Experience (UX)
- **Mobile-First Responsiveness**: Fully optimized for smartphones, tablets, and wide desktop displays with touch-friendly targets (minimum 44px).
- **Smooth Navigation**: Sticky header with quick links to Menu, About, Gallery, Booking, and Admin Portal.
- **Professional Craftsmanship**: Adheres to strict "Anti-Slop" design principles featuring generous negative space, sophisticated neutrals, and WCAG-compliant contrast ratios.

---

## 6. How to Update the Announcement Banner
A vibrant, animated announcement banner is located at the top of the application to highlight sales or special events. 

To update the text in this banner:
1. Open the `/src/App.tsx` file.
2. Search for `ANNOUNCEMENT BANNER` to locate the banner code.
3. Update the text wrapped in the `<p>` tag. The default structure looks like this:
   ```tsx
   <p className="text-sm font-medium tracking-wide">
     <span className="font-bold text-amber-100">Special Offer:</span> Book your wedding catering this month and receive a complimentary assorted pastry platter!
   </p>
   ```
4. Simply replace `"Special Offer:"` and `"Book your wedding catering..."` with your new announcement content.
5. Save the file and the app will automatically reflect your changes.

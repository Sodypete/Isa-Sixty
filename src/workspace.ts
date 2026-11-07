/**
 * Isaiah Sixty Creations - Google Workspace Integration Helper
 *
 * This utility houses the OAuth authentication state listener, Google Sheets syncing,
 * Google Calendar event booking, and Gmail receipt email dispatching.
 * All API interactions are direct Google REST API fetch requests authorized using the Bearer token.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App only once to avoid duplication errors
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Setup the Google Auth Provider with specific Workspace scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/gmail.send');

// In-memory cache for the OAuth access token (never stored in local/sessionStorage for security)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initializes the Firebase Auth listener to monitor login state.
 * Passes the active user and cached token to callbacks when loaded.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Listen to Auth changes
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // If we have a user and cached token, trigger success
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Clear cached token if not signing in
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      // No user found, clear cache
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Prompts the Google OAuth login popup via Firebase Auth
 * to authorize Sheets, Calendar, and Gmail scopes.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google OAuth provider.');
    }

    // Cache the retrieved token in-memory
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('OAuth Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Returns the currently cached access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Logs out the active user and clears the token cache
 */
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Encodes strings into safe base64url format required by the Gmail REST API
 */
const encodeBase64Url = (str: string): string => {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * Dispatches order receipt emails via the Gmail API
 * - One email to the customer with order receipt details
 * - One email to the owner (isaiahsixtycreations@gmail.com) with instructions and details
 */
export const sendOrderEmails = async (
  accessToken: string,
  orderDetails: {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    eventDate: string;
    eventTime: string;
    orderType: string;
    deliveryAddress?: string;
    specialInstructions?: string;
    isDepositPaid: boolean;
    isFullPaymentMade: boolean;
    itemsText: string;
    billingHtml: string;
  }
) => {
  // Define payment status label
  const paymentStatus = orderDetails.isFullPaymentMade
    ? 'FULLY PAID'
    : orderDetails.isDepositPaid
      ? '80% DEPOSIT PAID (Balance due)'
      : 'PENDING PAYMENT';

  // Format delivery address HTML
  const deliveryAddressHtml = orderDetails.deliveryAddress
    ? `<p style="margin: 4px 0;"><b>Delivery Address:</b> ${orderDetails.deliveryAddress}</p>`
    : '';

  // 1. Customer Receipt Email Content
  const customerSubject = `Order Receipt - Isaiah Sixty Creations [${orderDetails.id}]`;
  const customerBodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; rounded: 12px; color: #333;">
      <h2 style="color: #8B5E34; border-bottom: 2px solid #8B5E34; padding-bottom: 10px; margin-top: 0;">Isaiah Sixty Creations</h2>
      <p style="font-size: 14px; line-height: 1.5;">Dear Valued Customer,</p>
      <p style="font-size: 14px; line-height: 1.5;">Your order is as follows:</p>
      
      <div style="background-color: #fdfbf7; border: 1px solid #f5efeb; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin-top: 0; color: #4B2F1D; font-size: 15px;">Order Summary [${orderDetails.id}]</h3>
        <p style="margin: 4px 0; font-size: 13px;"><b>Customer Name:</b> ${orderDetails.customerName}</p>
        <p style="margin: 4px 0; font-size: 13px;"><b>Contact Phone:</b> ${orderDetails.customerPhone}</p>
        <p style="margin: 4px 0; font-size: 13px;"><b>Fulfillment:</b> ${orderDetails.orderType.toUpperCase()}</p>
        <p style="margin: 4px 0; font-size: 13px;"><b>Date & Time:</b> ${orderDetails.eventDate} @ ${orderDetails.eventTime}</p>
        ${deliveryAddressHtml}
        
        <h4 style="border-top: 1px dashed #eaeaea; padding-top: 10px; margin-bottom: 8px; color: #4B2F1D; font-size: 13px;">Ordered Items:</h4>
        <pre style="font-family: monospace; font-size: 12px; white-space: pre-wrap; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #eaeaea; margin: 0;">${orderDetails.itemsText}</pre>
        
        <div style="border-top: 1px dashed #eaeaea; padding-top: 10px; margin-top: 15px;">
          ${orderDetails.billingHtml}
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #065f46; font-weight: bold;">Payment Status: ${paymentStatus}</p>
        </div>
      </div>
      
      <p style="font-size: 14px; line-height: 1.5; margin-top: 20px;">Have a delicious day,<br><b>Isaiah Sixty Creations.</b></p>
    </div>
  `;

  // 2. Owner Alert Email Content
  const ownerSubject = `${orderDetails.id}, ${orderDetails.customerName}`;
  const formattedSpecialInstructions = orderDetails.specialInstructions 
    ? `<p style="color: #991b1b; background-color: #fef2f2; border: 1px solid #fca5a5; padding: 12px; border-radius: 6px; font-size: 14px;"><b>SPECIAL INSTRUCTIONS: ${orderDetails.specialInstructions.toUpperCase()}</b></p>`
    : '<p style="color: #6b7280; font-size: 13px;">No special instructions specified.</p>';

  const ownerBodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; color: #333;">
      <h2 style="color: #1F2937; border-bottom: 2px solid #8B5E34; padding-bottom: 10px; margin-top: 0;">New Order Booking Received!</h2>
      <p style="font-size: 14px;">A new catering event has been booked. Details below:</p>
      
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="margin: 4px 0; font-size: 13px;"><b>Order ID:</b> ${orderDetails.id}</p>
        <p style="margin: 4px 0; font-size: 13px;"><b>Customer Name:</b> ${orderDetails.customerName}</p>
        <p style="margin: 4px 0; font-size: 13px;"><b>Customer Email:</b> ${orderDetails.customerEmail}</p>
        <p style="margin: 4px 0; font-size: 13px;"><b>Customer Phone:</b> ${orderDetails.customerPhone}</p>
        <p style="margin: 4px 0; font-size: 13px;"><b>Fulfillment:</b> ${orderDetails.orderType.toUpperCase()}</p>
        <p style="margin: 4px 0; font-size: 13px;"><b>Order Date & Time:</b> <b>${orderDetails.eventDate} @ ${orderDetails.eventTime}</b></p>
        ${deliveryAddressHtml}
        
        <h4 style="border-top: 1px dashed #e5e7eb; padding-top: 10px; margin-bottom: 8px;">Ordered Items:</h4>
        <pre style="font-family: monospace; font-size: 12px; white-space: pre-wrap; background: #fff; padding: 10px; border: 1px solid #e5e7eb; margin: 0;">${orderDetails.itemsText}</pre>
        
        <div style="border-top: 1px dashed #e5e7eb; padding-top: 10px; margin-top: 15px;">
          ${orderDetails.billingHtml}
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #065f46; font-weight: bold;">Payment Status: ${paymentStatus}</p>
        </div>
      </div>
      
      <h3 style="color: #1F2937; font-size: 14px; margin-top: 20px;">Chef & Dietary Customizations:</h3>
      ${formattedSpecialInstructions}
      
      <p style="font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 25px;">
        This is an automated system sync from your Isaiah Sixty Creations Catering dashboard.
      </p>
    </div>
  `;

  // Dispatch email to Customer
  const customerEmailRaw = [
    `To: ${orderDetails.customerEmail}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${customerSubject}`,
    '',
    customerBodyHtml
  ].join('\r\n');

  await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodeBase64Url(customerEmailRaw) })
  });

  // Dispatch email copy to Owner
  const ownerEmailRaw = [
    'To: isaiahsixtycreations@gmail.com',
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${ownerSubject}`,
    '',
    ownerBodyHtml
  ].join('\r\n');

  await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodeBase64Url(ownerEmailRaw) })
  });
};

/**
 * Searches for an existing "Isaiah Sixty Creations Orders" spreadsheet.
 * If not found, creates one with headers and returns the Spreadsheet ID.
 */
export const getOrCreateSpreadsheet = async (accessToken: string): Promise<string> => {
  // First, check localStorage cache
  const cachedId = localStorage.getItem('isc_spreadsheet_id');
  if (cachedId) {
    try {
      // Validate cached spreadsheet exists
      const testRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cachedId}?fields=spreadsheetId`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (testRes.ok) return cachedId;
    } catch (e) {
      console.warn('Cached spreadsheet invalid, searching/recreating...');
    }
  }

  // Query Google Drive to search for existing spreadsheet
  try {
    const searchRes = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=name%3D'Isaiah%20Sixty%20Creations%20Orders'%20and%20mimeType%3D'application%2Fvnd.google-apps.spreadsheet'%20and%20trashed%3Dfalse",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        const foundId = data.files[0].id;
        localStorage.setItem('isc_spreadsheet_id', foundId);
        return foundId;
      }
    }
  } catch (err) {
    console.error('Error listing spreadsheet from Drive:', err);
  }

  // Create new Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title: 'Isaiah Sixty Creations Orders' }
    })
  });

  if (!createRes.ok) {
    throw new Error('Failed to create Google Sheet for catering logs.');
  }

  const sheetData = await createRes.json();
  const newSpreadsheetId = sheetData.spreadsheetId;

  // Add Row 1 headers
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${newSpreadsheetId}/values/Sheet1!A1:J1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: 'Sheet1!A1:J1',
      majorDimension: 'ROWS',
      values: [
        [
          'Order Number',
          'Category',
          'Amount Ordered',
          'Item Ordered',
          'Amount Paid',
          'Payment Status',
          'Date Ordered',
          'Time Ordered',
          'Order Date',
          'Order Time'
        ]
      ]
    })
  });

  localStorage.setItem('isc_spreadsheet_id', newSpreadsheetId);
  return newSpreadsheetId;
};

/**
 * Checks if the month has changed, compiles a monthly summary formula if needed,
 * and appends the new order row to Google Sheets.
 */
export const appendOrderToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  order: {
    id: string;
    categories: string;
    quantities: string;
    items: string;
    amountPaid: number;
    paymentStatus: string;
    dateOrdered: string;
    timeOrdered: string;
    orderDate: string;
    orderTime: string;
  }
) => {
  // 1. Check for monthly transition and insert SUM formula if month changed
  try {
    const listRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:J5000`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (listRes.ok) {
      const data = await listRes.json();
      const rows = data.values || [];
      
      if (rows.length > 0) {
        // Find last order row that isn't a summary
        let lastOrderRowIdx = -1;
        for (let i = rows.length - 1; i >= 0; i--) {
          if (!rows[i][0]?.startsWith('SUMMARY')) {
            lastOrderRowIdx = i;
            break;
          }
        }

        if (lastOrderRowIdx !== -1) {
          const lastOrderRow = rows[lastOrderRowIdx];
          const lastOrderDateStr = lastOrderRow[6]; // G: Date Ordered
          
          if (lastOrderDateStr) {
            const lastDate = new Date(lastOrderDateStr);
            const newDate = new Date(order.dateOrdered);

            const lastMonthYear = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`;
            const newMonthYear = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;

            if (lastMonthYear !== newMonthYear) {
              // Compile rows belonging to previous month
              let startRow = -1;
              let endRow = -1;
              const itemCounts: Record<string, number> = {};

              for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (row[0]?.startsWith('SUMMARY')) continue;
                const rDateStr = row[6];
                if (rDateStr) {
                  const rDate = new Date(rDateStr);
                  const rMonthYear = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}`;
                  if (rMonthYear === lastMonthYear) {
                    if (startRow === -1) startRow = i + 2; // Rows are 1-indexed, and Header is row 1
                    endRow = i + 2;

                    // Tabulate item counts to find most ordered
                    const itemsStr = row[3]; // Column D
                    const qtysStr = row[2]; // Column C
                    if (itemsStr && qtysStr) {
                      const items = itemsStr.split(',').map((s: string) => s.trim());
                      const qtys = qtysStr.split(',').map((s: string) => parseInt(s.trim()) || 1);
                      for (let k = 0; k < items.length; k++) {
                        const itemName = items[k];
                        const qty = qtys[k] || 1;
                        itemCounts[itemName] = (itemCounts[itemName] || 0) + qty;
                      }
                    }
                  }
                }
              }

              if (startRow !== -1 && endRow !== -1) {
                let mostOrderedItem = 'None';
                let maxQty = 0;
                for (const [item, qty] of Object.entries(itemCounts)) {
                  if (qty > maxQty) {
                    maxQty = qty;
                    mostOrderedItem = item;
                  }
                }

                const monthName = lastDate.toLocaleString('default', { month: 'long', year: 'numeric' });

                // Construct Monthly Summary formula row
                const summaryRow = [
                  `SUMMARY - ${monthName}`,
                  'Monthly Summary',
                  `${maxQty} units`,
                  `Most Ordered: ${mostOrderedItem}`,
                  `=SUM(E${startRow}:E${endRow})`,
                  'SUMMARY COMPLETE',
                  lastOrderDateStr,
                  '23:59',
                  '',
                  ''
                ];

                await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:J:append?valueInputOption=USER_ENTERED`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    range: 'Sheet1!A:J',
                    majorDimension: 'ROWS',
                    values: [summaryRow]
                  })
                });
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error generating monthly summary:', err);
  }

  // 2. Append the new order row
  const rowValue = [
    order.id,
    order.categories,
    order.quantities,
    order.items,
    order.amountPaid,
    order.paymentStatus,
    order.dateOrdered,
    order.timeOrdered,
    order.orderDate,
    order.orderTime
  ];

  const appendRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:J:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: 'Sheet1!A:J',
      majorDimension: 'ROWS',
      values: [rowValue]
    })
  });

  if (!appendRes.ok) {
    throw new Error('Failed to append catering row to Google Sheets.');
  }
};

/**
 * Creates a Booking Event on the user's Google Calendar
 */
export const createCalendarEvent = async (
  accessToken: string,
  order: {
    id: string;
    customerName: string;
    items: string;
    orderDate: string;
    orderTime: string;
    orderType: string;
    deliveryAddress?: string;
    specialInstructions?: string;
  }
) => {
  // Parse target date and time
  const startDateTimeStr = `${order.orderDate}T${order.orderTime}:00`;
  const startDateTime = new Date(startDateTimeStr);
  
  // Default to 1 hour duration
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

  // Format date strings in timezone-neutral format
  const formatISO = (d: Date) => {
    return d.toISOString().replace(/\.\d+Z$/, '');
  };

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Construct description body
  const description = [
    `Order Reference: ${order.id}`,
    `Fulfillment: ${order.orderType.toUpperCase()}`,
    order.deliveryAddress ? `Address: ${order.deliveryAddress}` : '',
    `Items Ordered: ${order.items}`,
    order.specialInstructions ? `Special Instructions: ${order.specialInstructions}` : ''
  ].filter(Boolean).join('\n');

  const eventBody = {
    summary: `Order ${order.id} - ${order.customerName}`,
    description,
    location: order.deliveryAddress || 'Kitchen Pickup',
    start: {
      dateTime: formatISO(startDateTime),
      timeZone: userTimeZone
    },
    end: {
      dateTime: formatISO(endDateTime),
      timeZone: userTimeZone
    }
  };

  const calendarRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventBody)
  });

  if (!calendarRes.ok) {
    throw new Error('Failed to create catering booking on Google Calendar.');
  }
};

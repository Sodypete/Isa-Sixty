import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };
import { sendOrderEmails, getOrCreateSpreadsheet, appendOrderToSheet, createCalendarEvent } from "./src/google-api.ts";

/**
 * Initialize Firebase on the server-side using the same applet configuration.
 * This lets us securely query and persist Google Workspace credentials and order logs.
 */
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support parsing JSON body requests (order submissions and admin settings)
  app.use(express.json());

  // In-memory fallback stores if Firestore is not provisioned
  let memSettings: { accessToken: string | null; email: string | null; expiresAt: number | null; spreadsheetId: string | null } = {
    accessToken: null,
    email: null,
    expiresAt: null,
    spreadsheetId: null
  };
  const memOrders: any[] = [];

  // Circuit-breaker for Firestore when unprovisioned/unreachable in Node.js:
  // Firebase Web SDK's setDoc/updateDoc queue offline writes indefinitely without rejecting.
  let firestoreOfflineUntil = 0;
  let firestoreCheckedAt = 0;

  function stripUndefined<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  async function runFirestoreOp<T>(op: () => Promise<T>, timeoutMs = 1500, isWrite = false): Promise<T> {
    if (Date.now() < firestoreOfflineUntil) {
      throw new Error("Firestore temporarily bypassed (offline)");
    }

    // Before queuing any write, verify Firestore is reachable via a read so the SDK doesn't
    // open an endless background Write retry stream if the database isn't provisioned.
    if (isWrite && Date.now() - firestoreCheckedAt > 60_000) {
      await runFirestoreOp(() => getDoc(doc(db, "settings", "google_workspace")), timeoutMs, false);
      firestoreCheckedAt = Date.now();
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        op(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("Firestore operation timed out")), timeoutMs);
        })
      ]);
      firestoreCheckedAt = Date.now();
      return result;
    } catch (err: any) {
      const msg = String(err?.message || err || "");
      if (
        msg.includes("timed out") ||
        msg.includes("offline") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("NOT_FOUND") ||
        msg.includes("PERMISSION_DENIED") ||
        err?.code === "not-found" ||
        err?.code === "unavailable"
      ) {
        firestoreOfflineUntil = Date.now() + 5 * 60_000;
      }
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /**
   * Helper function to check and retrieve the Google Access Token from Firestore (with memory fallback).
   */
  async function getGoogleToken() {
    if (memSettings.accessToken && memSettings.expiresAt) {
      const isMemExpired = Date.now() + 5 * 60 * 1000 > memSettings.expiresAt;
      if (!isMemExpired) {
        return {
          accessToken: memSettings.accessToken,
          email: memSettings.email,
          spreadsheetId: memSettings.spreadsheetId || null
        };
      }
    }

    try {
      const docRef = doc(db, "settings", "google_workspace");
      const docSnap = await runFirestoreOp(() => getDoc(docRef));
      if (!docSnap.exists()) {
        return null;
      }
      const data = docSnap.data();
      if (!data.accessToken || !data.expiresAt) return null;
      
      const isExpired = Date.now() + 5 * 60 * 1000 > data.expiresAt;
      if (isExpired) return null;
      
      return {
        accessToken: data.accessToken,
        email: data.email,
        spreadsheetId: data.spreadsheetId || null
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Helper function to execute the Google Workspace synchronization flow.
   * Books event to Sheets, records to Calendar, and emails via Gmail.
   */
  async function syncOrderToWorkspace(accessToken: string, orderDetails: any, cachedSpreadsheetId: string | null) {
    // A. Resolve or create the Google Spreadsheet
    const sheetId = await getOrCreateSpreadsheet(accessToken, cachedSpreadsheetId, async (newId) => {
      memSettings.spreadsheetId = newId;
      try {
        const docRef = doc(db, "settings", "google_workspace");
        await runFirestoreOp(() => setDoc(docRef, { spreadsheetId: newId }, { merge: true }), 1500, true);
      } catch (e) {
        // Fallback handled
      }
    });

    // B. Append order details to Sheet
    await appendOrderToSheet(accessToken, sheetId, {
      id: orderDetails.id,
      categories: orderDetails.categories || "",
      quantities: orderDetails.quantities || "",
      items: orderDetails.items || "",
      amountPaid: Number(orderDetails.amountPaid) || 0,
      paymentStatus: orderDetails.paymentStatus || "PENDING",
      dateOrdered: orderDetails.dateOrdered || new Date().toISOString().split("T")[0],
      timeOrdered: orderDetails.timeOrdered || "12:00",
      orderDate: orderDetails.orderDate || "",
      orderTime: orderDetails.orderTime || ""
    });

    // C. Book Event on Google Calendar
    await createCalendarEvent(accessToken, {
      id: orderDetails.id,
      customerName: orderDetails.customerName,
      items: orderDetails.items,
      orderDate: orderDetails.orderDate,
      orderTime: orderDetails.orderTime,
      orderType: orderDetails.orderType,
      deliveryAddress: orderDetails.deliveryAddress,
      interacRefNumber: orderDetails.interacRefNumber,
      specialInstructions: orderDetails.specialInstructions,
      isChicagoLocalPickup: orderDetails.isChicagoLocalPickup,
      pickupAddressNote: orderDetails.pickupAddressNote
    });

    // D. Dispatch customer receipt & owner notice via Gmail
    await sendOrderEmails(accessToken, orderDetails);
  }

  // API Route: Checks active Owner Google Connection Status
  app.get("/api/admin/status", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "google_workspace");
      const docSnap = await runFirestoreOp(() => getDoc(docRef));
      if (!docSnap.exists()) {
        return res.json({ 
          connected: !!(memSettings.accessToken && memSettings.expiresAt && Date.now() < memSettings.expiresAt), 
          email: memSettings.email || null, 
          expiresAt: memSettings.expiresAt || null, 
          spreadsheetId: memSettings.spreadsheetId || null 
        });
      }
      const data = docSnap.data();
      const connected = data.accessToken && data.expiresAt && Date.now() < data.expiresAt;
      res.json({
        connected: !!connected,
        email: data.email || null,
        expiresAt: data.expiresAt || null,
        spreadsheetId: data.spreadsheetId || null
      });
    } catch (error: any) {
      res.json({ 
        connected: !!(memSettings.accessToken && memSettings.expiresAt && Date.now() < memSettings.expiresAt), 
        email: memSettings.email || null, 
        expiresAt: memSettings.expiresAt || null, 
        spreadsheetId: memSettings.spreadsheetId || null 
      });
    }
  });

  // API Route: Saves Google Access Token securely to Firestore from Owner Sign-In
  app.post("/api/admin/save-token", async (req, res) => {
    try {
      const { accessToken, email, expiresAt } = req.body;
      memSettings.accessToken = accessToken;
      memSettings.email = email;
      memSettings.expiresAt = expiresAt;
      if (req.body.spreadsheetId) memSettings.spreadsheetId = req.body.spreadsheetId;

      try {
        const docRef = doc(db, "settings", "google_workspace");
        await runFirestoreOp(() => setDoc(docRef, {
          accessToken,
          email,
          expiresAt,
          spreadsheetId: req.body.spreadsheetId || null
        }, { merge: true }), 1500, true);
      } catch (e) {
        // Fallback stored in memory
      }
      res.json({ status: "ok" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Disconnects the linked Workspace Google connection
  app.post("/api/admin/disconnect", async (req, res) => {
    try {
      memSettings.accessToken = null;
      memSettings.email = null;
      memSettings.expiresAt = null;

      try {
        const docRef = doc(db, "settings", "google_workspace");
        await runFirestoreOp(() => setDoc(docRef, {
          accessToken: null,
          email: null,
          expiresAt: null
        }, { merge: true }), 1500, true);
      } catch (e) {
        // Fallback updated
      }
      res.json({ status: "ok" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Returns recent 50 order logs and their sync status
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, orderBy("createdAt", "desc"), limit(50));
      const querySnapshot = await runFirestoreOp(() => getDocs(q));
      const orders: any[] = [];
      querySnapshot.forEach((docSnap) => {
        orders.push(docSnap.data());
      });
      res.json({ orders });
    } catch (error: any) {
      // Fallback to in-memory orders if Firestore is not provisioned or index missing
      const sorted = [...memOrders].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      res.json({ orders: sorted.slice(0, 50) });
    }
  });

  // API Route: Allows owner to manually re-sync failed orders
  app.post("/api/admin/sync-order", async (req, res) => {
    try {
      const { orderId } = req.body;
      let orderData: any = memOrders.find(o => o.id === orderId) || null;
      const orderDocRef = doc(db, "orders", orderId);

      if (!orderData) {
        try {
          const orderSnap = await runFirestoreOp(() => getDoc(orderDocRef));
          if (orderSnap.exists()) {
            orderData = orderSnap.data();
          }
        } catch (e) {
          // Fallback already checked memOrders
        }
      }

      if (!orderData) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const tokenInfo = await getGoogleToken();
      if (!tokenInfo) {
        return res.status(400).json({ error: "Google Workspace credentials are offline or expired. Please re-authenticate first." });
      }

      await syncOrderToWorkspace(tokenInfo.accessToken, orderData, tokenInfo.spreadsheetId);

      const memIdx = memOrders.findIndex(o => o.id === orderId);
      if (memIdx !== -1) {
        memOrders[memIdx].syncStatus = "synced";
        memOrders[memIdx].syncedAt = Date.now();
        memOrders[memIdx].syncError = null;
      }

      try {
        await runFirestoreOp(() => updateDoc(orderDocRef, {
          syncStatus: "synced",
          syncedAt: Date.now(),
          syncError: null
        }), 1500, true);
      } catch (e) {}

      res.json({ status: "ok" });
    } catch (error: any) {
      console.error("Manual Workspace sync failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Helper: Backend shipping & Chicago local pickup calculation for Chin Chin orders
  function calculateChinChinShippingBackend(orderDetails: any) {
    if (!orderDetails?.isChinChinOnly) {
      return {};
    }

    const subtotal = Number(orderDetails.subtotal) || 0;
    // - Free shipping for all orders over $100 ($100+)
    // - Shipping charges of $10 apply for Orders < $100
    const shippingFee = subtotal > 0 && subtotal < 100 ? 10.0 : 0.0;
    const totalAmount = subtotal + shippingFee;

    const locationText = [
      orderDetails.shippingCity,
      orderDetails.deliveryAddress,
      orderDetails.shippingState
    ]
      .filter(Boolean)
      .join(' ');
    const isChicagoLocation = /\bchicago\b/i.test(locationText);

    if (isChicagoLocation) {
      const pickupAddressNote =
        'Shipping location is Chicago: all pickups will be local and the address will be sent when your order is confirmed.';
      return {
        orderType: 'pickup',
        subtotal,
        shippingFee,
        totalAmount,
        isChicagoLocalPickup: true,
        pickupAddressNote,
        backendShippingLogic: {
          isChinChinOnly: true,
          subtotal,
          shippingFee,
          freeShippingQualified: subtotal >= 100,
          isChicagoLocation: true,
          fulfillmentMode: 'local_pickup',
          pickupAddressNote
        }
      };
    }

    return {
      subtotal,
      shippingFee,
      totalAmount,
      isChicagoLocalPickup: false,
      backendShippingLogic: {
        isChinChinOnly: true,
        subtotal,
        shippingFee,
        freeShippingQualified: subtotal >= 100,
        isChicagoLocation: false,
        fulfillmentMode: 'shipping'
      }
    };
  }

  // API Route: Processes incoming order submissions from customers
  app.post("/api/submit-order", async (req, res) => {
    try {
      const orderDetails = req.body;
      const orderId = orderDetails.id || `ISC-${Date.now()}`;
      const shippingBackendMeta = calculateChinChinShippingBackend(orderDetails);

      const newOrder = stripUndefined({
        ...orderDetails,
        ...shippingBackendMeta,
        id: orderId,
        syncStatus: "pending",
        createdAt: Date.now()
      });

      // Push to in-memory orders
      memOrders.unshift(newOrder);

      // 1. Log order to database first so customer records are never lost
      try {
        const orderDocRef = doc(db, "orders", orderId);
        await runFirestoreOp(() => setDoc(orderDocRef, newOrder), 1500, true);
      } catch (dbErr) {
        // Firestore unprovisioned/offline fallback handled by memOrders
      }

      // 2. Fetch active Google access token
      const tokenInfo = await getGoogleToken();
      if (!tokenInfo) {
        // Fallback: order is saved for manual sync
        const memIdx = memOrders.findIndex(o => o.id === orderId);
        if (memIdx !== -1) {
          memOrders[memIdx].syncStatus = "failed";
          memOrders[memIdx].syncError = "Google connection expired. Saved for later manual sync by owner.";
        }

        try {
          const orderDocRef = doc(db, "orders", orderId);
          await runFirestoreOp(() => updateDoc(orderDocRef, {
            syncStatus: "failed",
            syncError: "Google connection expired. Saved for later manual sync by owner."
          }), 1500, true);
        } catch (e) {}

        return res.json({
          status: "ok",
          synced: false,
          error: "Order received successfully! Google Workspace integration is temporarily offline. Owner will sync details shortly."
        });
      }

      // 3. Perform asynchronous Workspace Sync
      try {
        await syncOrderToWorkspace(tokenInfo.accessToken, newOrder, tokenInfo.spreadsheetId);

        const memIdx = memOrders.findIndex(o => o.id === orderId);
        if (memIdx !== -1) {
          memOrders[memIdx].syncStatus = "synced";
          memOrders[memIdx].syncedAt = Date.now();
          memOrders[memIdx].syncError = null;
        }

        try {
          const orderDocRef = doc(db, "orders", orderId);
          await runFirestoreOp(() => updateDoc(orderDocRef, {
            syncStatus: "synced",
            syncedAt: Date.now(),
            syncError: null
          }), 1500, true);
        } catch (e) {}

        res.json({ status: "ok", synced: true });
      } catch (syncErr: any) {
        console.error("Workspace sync failed during checkout:", syncErr);

        if (syncErr.message?.includes("401") || syncErr.status === 401) {
          memSettings.expiresAt = 0;
          try {
            const docRef = doc(db, "settings", "google_workspace");
            await runFirestoreOp(() => updateDoc(docRef, { expiresAt: 0 }), 1500, true);
          } catch (e) {}
        }

        const memIdx = memOrders.findIndex(o => o.id === orderId);
        if (memIdx !== -1) {
          memOrders[memIdx].syncStatus = "failed";
          memOrders[memIdx].syncError = syncErr.message || "Unknown Google Sync Error";
        }

        try {
          const orderDocRef = doc(db, "orders", orderId);
          await runFirestoreOp(() => updateDoc(orderDocRef, {
            syncStatus: "failed",
            syncError: syncErr.message || "Unknown Google Sync Error"
          }), 1500, true);
        } catch (e) {}

        res.json({
          status: "ok",
          synced: false,
          error: "Order logged safely, but Google Workspace sync encountered an error: " + syncErr.message
        });
      }
    } catch (error: any) {
      console.error("Order submission failed:", error);
      res.status(500).json({ error: "Failed to process order: " + error.message });
    }
  });

  // Mount Vite development server middleware OR serve static build files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

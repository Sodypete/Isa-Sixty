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

  /**
   * Helper function to check and retrieve the Google Access Token from Firestore (with memory fallback).
   */
  async function getGoogleToken() {
    try {
      const docRef = doc(db, "settings", "google_workspace");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        if (memSettings.accessToken) {
          return {
            accessToken: memSettings.accessToken,
            email: memSettings.email,
            spreadsheetId: memSettings.spreadsheetId || null
          };
        }
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
      if (memSettings.accessToken) {
        return {
          accessToken: memSettings.accessToken,
          email: memSettings.email,
          spreadsheetId: memSettings.spreadsheetId || null
        };
      }
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
        await setDoc(docRef, { spreadsheetId: newId }, { merge: true });
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
      specialInstructions: orderDetails.specialInstructions
    });

    // D. Dispatch customer receipt & owner notice via Gmail
    await sendOrderEmails(accessToken, orderDetails);
  }

  // API Route: Checks active Owner Google Connection Status
  app.get("/api/admin/status", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "google_workspace");
      const docSnap = await getDoc(docRef);
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
        await setDoc(docRef, {
          accessToken,
          email,
          expiresAt,
          spreadsheetId: req.body.spreadsheetId || null
        }, { merge: true });
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
        await setDoc(docRef, {
          accessToken: null,
          email: null,
          expiresAt: null
        }, { merge: true });
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
      const querySnapshot = await getDocs(q);
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
      const orderDocRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderDocRef);
      if (!orderSnap.exists()) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const orderData = orderSnap.data();
      const tokenInfo = await getGoogleToken();
      if (!tokenInfo) {
        return res.status(400).json({ error: "Google Workspace credentials are offline or expired. Please re-authenticate first." });
      }

      await syncOrderToWorkspace(tokenInfo.accessToken, orderData, tokenInfo.spreadsheetId);
      await updateDoc(orderDocRef, {
        syncStatus: "synced",
        syncedAt: Date.now(),
        syncError: null
      });

      res.json({ status: "ok" });
    } catch (error: any) {
      console.error("Manual Workspace sync failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Processes incoming order submissions from customers
  app.post("/api/submit-order", async (req, res) => {
    try {
      const orderDetails = req.body;
      const orderId = orderDetails.id || `ISC-${Date.now()}`;
      
      const newOrder = {
        ...orderDetails,
        id: orderId,
        syncStatus: "pending",
        createdAt: Date.now()
      };

      // Push to in-memory orders
      memOrders.unshift(newOrder);

      // 1. Log order to database first so customer records are never lost
      try {
        const orderDocRef = doc(db, "orders", orderId);
        await setDoc(orderDocRef, newOrder);
      } catch (dbErr) {
        // Firestore unprovisioned fallback handled by memOrders
      }

      // 2. Fetch active Google access token
      const tokenInfo = await getGoogleToken();
      if (!tokenInfo) {
        // Fallback: order is saved for manual sync
        try {
          const orderDocRef = doc(db, "orders", orderId);
          await updateDoc(orderDocRef, {
            syncStatus: "failed",
            syncError: "Google connection expired. Saved for later manual sync by owner."
          });
        } catch (e) {}
        
        const memIdx = memOrders.findIndex(o => o.id === orderId);
        if (memIdx !== -1) {
          memOrders[memIdx].syncStatus = "failed";
          memOrders[memIdx].syncError = "Google connection expired. Saved for later manual sync by owner.";
        }

        return res.json({
          status: "ok",
          synced: false,
          error: "Order received successfully! Google Workspace integration is temporarily offline. Owner will sync details shortly."
        });
      }

      // 3. Perform asynchronous Workspace Sync
      try {
        await syncOrderToWorkspace(tokenInfo.accessToken, newOrder, tokenInfo.spreadsheetId);
        try {
          const orderDocRef = doc(db, "orders", orderId);
          await updateDoc(orderDocRef, {
            syncStatus: "synced",
            syncedAt: Date.now(),
            syncError: null
          });
        } catch (e) {}

        const memIdx = memOrders.findIndex(o => o.id === orderId);
        if (memIdx !== -1) {
          memOrders[memIdx].syncStatus = "synced";
          memOrders[memIdx].syncedAt = Date.now();
          memOrders[memIdx].syncError = null;
        }

        res.json({ status: "ok", synced: true });
      } catch (syncErr: any) {
        console.error("Workspace sync failed during checkout:", syncErr);

        if (syncErr.message?.includes("401") || syncErr.status === 401) {
          memSettings.expiresAt = 0;
          try {
            const docRef = doc(db, "settings", "google_workspace");
            await updateDoc(docRef, { expiresAt: 0 });
          } catch (e) {}
        }

        try {
          const orderDocRef = doc(db, "orders", orderId);
          await updateDoc(orderDocRef, {
            syncStatus: "failed",
            syncError: syncErr.message || "Unknown Google Sync Error"
          });
        } catch (e) {}

        const memIdx = memOrders.findIndex(o => o.id === orderId);
        if (memIdx !== -1) {
          memOrders[memIdx].syncStatus = "failed";
          memOrders[memIdx].syncError = syncErr.message || "Unknown Google Sync Error";
        }

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

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Power, 
  ExternalLink, FileSpreadsheet, Calendar as CalendarIcon, 
  Mail, Lock, Database, ArrowLeft, ShieldCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import { googleSignIn } from '../workspace';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventDate: string;
  eventTime: string;
  orderType: string;
  items: string;
  amountPaid: number;
  paymentStatus: string;
  syncStatus: string;
  syncError?: string;
  createdAt: number;
}

interface ConnectionStatus {
  connected: boolean;
  email: string | null;
  expiresAt: number | null;
  spreadsheetId: string | null;
}

export default function AdminDashboard() {
  // --- STATE ---
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    email: null,
    expiresAt: null,
    spreadsheetId: null
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isSyncingOrderId, setIsSyncingOrderId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- DATA FETCHING ---
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch admin status:', e);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchOrders();
  }, []);

  // --- ACTIONS ---
  
  // Handles linking the Owner's Google account to the backend
  const handleConnect = async () => {
    setIsConnecting(true);
    setNotice(null);
    try {
      // 1. Fire Google Login Popup via Firebase SDK
      const authResult = await googleSignIn();
      if (!authResult) {
        throw new Error('Google Sign-In dismissed or failed.');
      }

      // 2. Transmit the temporary access token to the server to store in Firestore
      const saveRes = await fetch('/api/admin/save-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authResult.accessToken,
          email: authResult.user.email,
          expiresAt: Date.now() + 3500 * 1000 // Valid for 1 hour
        })
      });

      if (!saveRes.ok) {
        throw new Error('Failed to save authentication credentials on the server.');
      }

      // 3. Update UI states and notify owner of successful connection
      await fetchStatus();
      setNotice({ type: 'success', message: `Connected successfully to Google Workspace (${authResult.user.email})` });
    } catch (err: any) {
      console.error('Connection failed:', err);
      setNotice({ type: 'error', message: err.message || 'Authentication failed.' });
    } finally {
      setIsConnecting(false);
    }
  };

  // Handles disconnecting the Google link on the backend
  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Workspace synchronization? Customer orders will not log automatically until reconnected.')) {
      return;
    }
    setNotice(null);
    try {
      const res = await fetch('/api/admin/disconnect', { method: 'POST' });
      if (res.ok) {
        await fetchStatus();
        setNotice({ type: 'success', message: 'Successfully disconnected Google Workspace from the backend.' });
      } else {
        throw new Error('Disconnect request rejected by server.');
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    }
  };

  // Handles manually retrying workspace sync for a failed order
  const handleSyncOrder = async (orderId: string) => {
    setIsSyncingOrderId(orderId);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/sync-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (res.ok) {
        setNotice({ type: 'success', message: `Order ${orderId} synced to Google Workspace successfully!` });
        await fetchOrders();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Server rejected synchronization request.');
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: `Sync failed for ${orderId}: ${err.message}` });
    } finally {
      setIsSyncingOrderId(null);
    }
  };

  // Helper to calculate token remaining duration
  const getRemainingTimeText = () => {
    if (!status.expiresAt) return '';
    const diff = status.expiresAt - Date.now();
    if (diff <= 0) return 'Expired';
    const mins = Math.ceil(diff / 60000);
    return `${mins} minutes remaining`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* TOP BAR / NAVIGATION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-[#8B5E34] text-white p-2.5 rounded-xl shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Isaiah Sixty Creations</h1>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workspace Management Portal</p>
            </div>
          </div>
          
          <a 
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = '';
              window.location.pathname = '/';
            }}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#8B5E34] hover:text-[#a67341] bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            View Customer Site
          </a>
        </div>

        {/* NOTIFICATION TOAST */}
        {notice && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
            notice.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {notice.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="text-sm font-medium">{notice.message}</div>
          </div>
        )}

        {/* BENTO DASHBOARD CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* CARD 1: GOOGLE INTEGRATION STATUS */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-[#8B5E34]" />
                Google Workspace Connection
              </h2>
              {isLoadingStatus ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
              ) : status.connected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Sync
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Disconnected
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500">Connected Account</p>
                <p className="text-sm font-bold text-slate-800 mt-1 truncate">
                  {status.connected ? status.email : 'None Linked'}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500">Session Remaining</p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {status.connected ? getRemainingTimeText() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <p className="text-xs text-slate-500 max-w-md">
                Connecting authorizes this server to automatically synchronize customer reservations into your <b>Google Sheets</b> logs, schedule catering periods in your <b>Google Calendar</b>, and send email receipts with your <b>Gmail</b>.
              </p>
              <div className="flex gap-3">
                {status.connected && (
                  <button
                    onClick={handleDisconnect}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-lg transition-colors bg-white"
                  >
                    <Power className="w-4 h-4" />
                    Disconnect
                  </button>
                )}
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#8B5E34] hover:bg-[#724C29] px-5 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
                  {status.connected ? 'Refresh Connection' : 'Connect Owner Account'}
                </button>
              </div>
            </div>
          </div>

          {/* CARD 2: QUICK METRICS / SHEET ACCESSIBILITY */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#8B5E34]" />
                Spreadsheet Logs
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                Your catering logs are maintained in a Google Sheet titled <b>"Isaiah Sixty Creations Orders"</b> in your Google Drive.
              </p>
            </div>

            {status.spreadsheetId ? (
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Spreadsheet ID</span>
                <span className="text-xs font-mono text-slate-700 mt-1 block truncate">{status.spreadsheetId}</span>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-xs text-slate-400 font-medium">Spreadsheet is created upon first sync.</span>
              </div>
            )}

            {status.spreadsheetId ? (
              <a
                href={`https://docs.google.com/spreadsheets/d/${status.spreadsheetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                <span>Open Google Sheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button
                disabled
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 py-2.5 rounded-lg border border-slate-200 cursor-not-allowed"
              >
                <span>No Spreadsheet Generated</span>
              </button>
            )}
          </div>

        </div>

        {/* ORDER LOGS GRID */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Customer Submissions</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time catering order tracker with Google synchronization audit</p>
            </div>
            <button
              onClick={fetchOrders}
              disabled={isLoadingOrders}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors bg-white disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoadingOrders ? (
            <div className="py-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-[#8B5E34] mx-auto" />
              <p className="text-xs text-slate-400 mt-3 font-semibold">Loading orders history...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Database className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-500">No catering orders registered yet.</p>
              <p className="text-xs text-slate-400">Customer checkouts will automatically log here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                    <th className="px-6 py-3.5">Order Info</th>
                    <th className="px-6 py-3.5">Date & Time</th>
                    <th className="px-6 py-3.5">Total Amount</th>
                    <th className="px-6 py-3.5">Workspace Sync</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {orders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const formattedDate = new Date(order.createdAt).toLocaleString();
                    const isSynced = order.syncStatus === 'synced';
                    
                    return (
                      <React.Fragment key={order.id}>
                        <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50/20' : ''}`}>
                          
                          {/* Order Info column */}
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{order.id}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{order.customerName}</div>
                            <div className="text-[10px] font-semibold text-[#8B5E34] uppercase tracking-wide mt-1">
                              {order.orderType}
                            </div>
                          </td>

                          {/* Event Date & Time */}
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-800">{order.eventDate}</div>
                            <div className="text-xs text-slate-500 mt-0.5">@ {order.eventTime}</div>
                          </td>

                          {/* Total Value / Payment status */}
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">${order.amountPaid.toFixed(2)}</div>
                            <div className="text-[10px] font-bold text-emerald-700 mt-1 uppercase">
                              {order.paymentStatus}
                            </div>
                          </td>

                          {/* Synchronization status */}
                          <td className="px-6 py-4">
                            {isSynced ? (
                              <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                  Synced
                                </span>
                                <div className="flex items-center gap-1.5 text-slate-400">
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" title="Sheets Synced" />
                                  <CalendarIcon className="w-3.5 h-3.5 text-blue-600" title="Calendar Booked" />
                                  <Mail className="w-3.5 h-3.5 text-[#8B5E34]" title="Gmail Receipt Sent" />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                                  <XCircle className="w-3.5 h-3.5 text-amber-500" />
                                  Pending Sync
                                </span>
                                {order.syncError && (
                                  <div className="text-[10px] text-rose-600 max-w-xs truncate font-medium" title={order.syncError}>
                                    {order.syncError}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Actions column */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isSynced && (
                                <button
                                  onClick={() => handleSyncOrder(order.id)}
                                  disabled={isSyncingOrderId === order.id}
                                  className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                >
                                  {isSyncingOrderId === order.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-3 h-3" />
                                  )}
                                  <span>Sync</span>
                                </button>
                              )}
                              <button
                                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors bg-white"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>

                        </tr>

                        {/* EXPANDED BREAKDOWN DRAWER */}
                        {isExpanded && (
                          <tr className="bg-slate-50/40 border-l-4 border-l-[#8B5E34]">
                            <td colSpan={5} className="px-6 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
                                <div>
                                  <p className="font-bold text-slate-900 text-sm mb-2">Customer Details</p>
                                  <p className="mt-1"><b>Name:</b> {order.customerName}</p>
                                  <p className="mt-1"><b>Email:</b> {order.customerEmail}</p>
                                  <p className="mt-1"><b>Phone:</b> {order.customerPhone}</p>
                                  <p className="mt-1"><b>Logged In System:</b> {formattedDate}</p>
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-sm mb-2">Ordered Menu Items</p>
                                  <pre className="font-mono text-slate-700 bg-white border border-slate-200 p-3 rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
                                    {order.items}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

'use client';

import React, { useEffect, Suspense } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { HugeiconsIcon } from '@hugeicons/react';
import { useSearchParams } from 'next/navigation';
import { 
  Search01Icon, 
  FilterIcon, 
  ViewIcon,
  Download01Icon,
  MoreHorizontalIcon,
  ShoppingBag01Icon,
  Tick02Icon,
  Clock01Icon,
  Cancel01Icon,
  QrCode01Icon,
  Edit01Icon,
  PrinterIcon,
  Mail01Icon,
  Delete02Icon
} from '@hugeicons/core-free-icons';
import styles from '../Admin.module.css';
import StatCard from '../../../components/admin/StatCard';
import { Dollar01Icon, ShoppingBagIcon } from '@hugeicons/core-free-icons';
import { supabase } from '../../../lib/supabase';
import { StatCardSkeleton, TableRowSkeleton } from '../../../components/admin/Skeleton';

interface OrderItem {
  id: number;
  product_title: string;
  quantity: number;
  price: number;
  image_url: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  notes: string;
  amount: string;
  status: string;
  payment_status: string;
  date: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  consignment_id?: string;
  tracking_code?: string;
  courier_status?: string;
  items?: OrderItem[];
}


const mockOrders = [
  { id: '#ORD-7342', customer: 'Alex Johnson', date: '2024-04-29', amount: '৳2,450', status: 'Delivered', payment: 'Paid' },
  { id: '#ORD-7341', customer: 'Sarah Miller', date: '2024-04-29', amount: '৳1,200', status: 'Processing', payment: 'Paid' },
  { id: '#ORD-7340', customer: 'James Wilson', date: '2024-04-28', amount: '৳850', status: 'Shipped', payment: 'Paid' },
  { id: '#ORD-7339', customer: 'Emily Brown', date: '2024-04-28', amount: '৳3,100', status: 'Pending', payment: 'Unpaid' },
  { id: '#ORD-7338', customer: 'Michael Chen', date: '2024-04-27', amount: '৳1,500', status: 'Delivered', payment: 'Paid' },
  { id: '#ORD-7337', customer: 'Sophia Garcia', date: '2024-04-27', amount: '৳950', status: 'Cancelled', payment: 'Refunded' },
  { id: '#ORD-7336', customer: 'David Lee', date: '2024-04-26', amount: '৳2,100', status: 'Delivered', payment: 'Paid' },
];

const getStatusClass = (status: string) => {
  switch (status) {
    case 'New order':
    case 'Pending': 
      return styles.statusPending;
    case 'Order conform':
    case 'Processing': 
      return styles.statusProcessing;
    case 'No response':
    case 'Shipped': 
      return styles.statusShipped;
    case 'Delivered': 
      return styles.statusSuccess;
    case 'Cancelled': 
      return styles.statusCancelled;
    default: 
      return '';
  }
};

const AdminOrdersPageContent: React.FC = () => {
  const searchParams = useSearchParams();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterStatus, setFilterStatus] = React.useState<string>('All');
  const [searchQuery, setSearchQuery] = React.useState<string>(searchParams.get('q') || '');
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = React.useState<string>('');
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);

  // Edit Mode States
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const [editAddress, setEditAddress] = React.useState('');
  const [editNotes, setEditNotes] = React.useState('');
  const [editPaymentStatus, setEditPaymentStatus] = React.useState('');
  const [editSubtotal, setEditSubtotal] = React.useState<number>(0);
  const [editShippingCost, setEditShippingCost] = React.useState<number>(0);
  const [editTotal, setEditTotal] = React.useState<number>(0);
  const [editItems, setEditItems] = React.useState<OrderItem[]>([]);

  // SteadFast Courier States
  const [steadfastBalance, setSteadfastBalance] = React.useState<number | null>(null);
  const [sendingToSteadfast, setSendingToSteadfast] = React.useState(false);
  const [trackingLoading, setTrackingLoading] = React.useState(false);
  const [trackingDetails, setTrackingDetails] = React.useState<any>(null);

  const fetchSteadfastBalance = async () => {
    try {
      const res = await fetch('/api/courier/steadfast/balance');
      const data = await res.json();
      if (data && (data.current_balance !== undefined || data.balance !== undefined)) {
        setSteadfastBalance(data.current_balance ?? data.balance);
      }
    } catch (e) {
      console.error('Failed to fetch Steadfast balance:', e);
    }
  };

  const handleSendToSteadfast = async (order: Order) => {
    setSendingToSteadfast(true);
    try {
      const cleanInvoice = order.id.replace('#ORD-', 'INV-');
      const payload = {
        invoice: cleanInvoice,
        recipient_name: order.customer_name,
        recipient_phone: order.customer_phone,
        recipient_address: order.address || 'Dhaka, Bangladesh',
        cod_amount: order.total,
        note: order.notes || '',
      };

      const res = await fetch('/api/courier/steadfast/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.status === 200 && data.consignment) {
        const consignment = data.consignment;
        const rawId = order.id.replace('#ORD-', '');
        
        // Update database if fields exist or local state
        await supabase
          .from('orders')
          .update({
            status: 'Processing',
            consignment_id: consignment.consignment_id,
            tracking_code: consignment.tracking_code,
            courier_status: consignment.status || 'in_review',
          })
          .eq('id', rawId);

        const updatedOrder: Order = {
          ...order,
          status: 'Processing',
          consignment_id: consignment.consignment_id,
          tracking_code: consignment.tracking_code,
          courier_status: consignment.status || 'in_review',
        };

        setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);
        alert(`SteadFast Order Created Successfully!\nConsignment ID: ${consignment.consignment_id}\nTracking Code: ${consignment.tracking_code}`);
        fetchSteadfastBalance();
      } else {
        alert(`SteadFast Error: ${data.message || data.errors?.recipient_phone?.[0] || 'Order creation failed'}`);
      }
    } catch (err: any) {
      alert(`Error creating SteadFast order: ${err.message}`);
    } finally {
      setSendingToSteadfast(false);
    }
  };

  const handleFetchTrackingStatus = async (consignment_id?: string, invoice?: string) => {
    setTrackingLoading(true);
    setTrackingDetails(null);
    try {
      let query = '';
      if (consignment_id) query = `consignment_id=${consignment_id}`;
      else if (invoice) query = `invoice=${invoice.replace('#ORD-', 'INV-')}`;

      if (!query) return;

      const res = await fetch(`/api/courier/steadfast/status?${query}`);
      const data = await res.json();
      if (data.status === 200 || data.delivery_status) {
        setTrackingDetails(data);
      } else {
        alert(data.message || 'Tracking details not found');
      }
    } catch (e: any) {
      alert(`Failed to fetch tracking: ${e.message}`);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleReturnRequest = async (order: Order) => {
    if (!confirm(`Are you sure you want to mark Order ${order.id} as Returned / Return Requested?`)) return;
    try {
      const rawId = order.id.replace('#ORD-', '');
      await supabase
        .from('orders')
        .update({
          status: 'Cancelled',
          courier_status: 'returned',
        })
        .eq('id', rawId);

      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Cancelled', courier_status: 'returned' } : o));
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(prev => prev ? { ...prev, status: 'Cancelled', courier_status: 'returned' } : null);
      }
      alert('Order marked as Return Requested.');
    } catch (e: any) {
      alert(`Return request error: ${e.message}`);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders: Order[] = data.map(o => ({
        id: `#ORD-${o.id}`,
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        address: o.address,
        notes: o.notes,
        amount: `৳${o.total}`,
        status: o.status,
        payment_status: o.payment_status,
        date: new Date(o.created_at).toISOString().split('T')[0],
        total: o.total,
        subtotal: o.subtotal || (o.total - o.shipping_cost),
        shipping_cost: o.shipping_cost,
        consignment_id: o.consignment_id,
        tracking_code: o.tracking_code,
        courier_status: o.courier_status
      }));

      setOrders(formattedOrders);
      return formattedOrders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const init = async () => {
      fetchSteadfastBalance();
      const allOrders = await fetchOrders();
      const orderId = searchParams.get('id');
      if (orderId && allOrders) {
        const order = allOrders.find(o => o.id === `#ORD-${orderId}`);
        if (order) {
          openOrderDetail(order);
        }
      }
    };
    init();
  }, [searchParams]);


  const openOrderDetail = async (order: Order) => {
    setSelectedOrder(order);
    try {
      const orderId = order.id.replace('#ORD-', '');
      const { data: items, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;

      setSelectedOrder(prev => prev ? { ...prev, items } : null);
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
  };


  const updateItemPrice = (index: number, val: number) => {
    setEditItems(prev => {
      const copy = [...prev];
      copy[index].price = val;
      const newSubtotal = copy.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      setEditSubtotal(newSubtotal);
      setEditTotal(newSubtotal + editShippingCost);
      return copy;
    });
  };

  const updateItemQuantity = (index: number, val: number) => {
    setEditItems(prev => {
      const copy = [...prev];
      copy[index].quantity = val;
      const newSubtotal = copy.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      setEditSubtotal(newSubtotal);
      setEditTotal(newSubtotal + editShippingCost);
      return copy;
    });
  };

  const updateItemTitle = (index: number, val: string) => {
    setEditItems(prev => {
      const copy = [...prev];
      copy[index].product_title = val;
      return copy;
    });
  };

  const handleShippingCostChange = (val: number) => {
    setEditShippingCost(val);
    setEditTotal(editSubtotal + val);
  };

  const handleSubtotalChange = (val: number) => {
    setEditSubtotal(val);
    setEditTotal(val + editShippingCost);
  };

  const pendingOrdersCount = orders.filter(o => o.status === 'New order' || o.status === 'Pending').length;
  const completedOrdersCount = orders.filter(o => o.status === 'Delivered').length;
  const totalRevenue = orders.reduce((acc, o) => acc + (o.status !== 'Cancelled' ? o.total : 0), 0);

  // Sync search with URL

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'All' || 
                          order.status === filterStatus ||
                          (filterStatus === 'New order' && order.status === 'Pending') ||
                          (filterStatus === 'Order conform' && order.status === 'Processing') ||
                          (filterStatus === 'No response' && order.status === 'Shipped');
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         order.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });


  const closeOrderDetail = () => {
    setSelectedOrder(null);
    setUpdatingStatus('');
    setIsEditing(false);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !updatingStatus) return;
    
    try {
      const orderId = selectedOrder.id.replace('#ORD-', '');
      const { error } = await supabase
        .from('orders')
        .update({ status: updatingStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id ? { ...order, status: updatingStatus } : order
      ));
      
      setSelectedOrder(prev => prev ? { ...prev, status: updatingStatus } : null);
      alert(`Order ${selectedOrder.id} status updated to ${updatingStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    }
  };

  const handleSaveEdits = async () => {
    if (!selectedOrder) return;
    try {
      const orderId = selectedOrder.id.replace('#ORD-', '');
      
      // Update orders table
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          customer_name: editName,
          customer_phone: editPhone,
          address: editAddress,
          notes: editNotes,
          payment_status: editPaymentStatus,
          subtotal: editSubtotal,
          shipping_cost: editShippingCost,
          total: editTotal
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Update order items in DB
      if (editItems.length > 0) {
        for (const item of editItems) {
          const { error: itemError } = await supabase
            .from('order_items')
            .update({
              product_title: item.product_title,
              price: item.price,
              quantity: item.quantity
            })
            .eq('id', item.id);
          
          if (itemError) throw itemError;
        }
      }

      // Update local state for all orders
      const updatedOrder = {
        ...selectedOrder,
        customer_name: editName,
        customer_phone: editPhone,
        address: editAddress,
        notes: editNotes,
        payment_status: editPaymentStatus,
        subtotal: editSubtotal,
        shipping_cost: editShippingCost,
        total: editTotal,
        amount: `৳${editTotal}`,
        items: editItems
      };

      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id ? updatedOrder : order
      ));
      
      setSelectedOrder(updatedOrder);
      setIsEditing(false);
      alert('Order details updated successfully.');
    } catch (error) {
      console.error('Error saving order edits:', error);
      alert('Failed to save changes.');
    }
  };


  const handleCancelOrder = async (id: string) => {
    if (confirm(`Are you sure you want to cancel order ${id}?`)) {
      try {
        const orderId = id.replace('#ORD-', '');
        const { error } = await supabase
          .from('orders')
          .update({ status: 'Cancelled' })
          .eq('id', orderId);

        if (error) throw error;

        setOrders(prev => prev.map(order => 
          order.id === id ? { ...order, status: 'Cancelled' } : order
        ));
        alert(`Order ${id} has been cancelled.`);
      } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Failed to cancel order.');
      }
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (confirm(`Are you sure you want to permanently delete order ${id}?`)) {
      try {
        const orderId = id.replace('#ORD-', '');
        
        // 1. Delete order items first
        const { error: itemsError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', orderId);
          
        if (itemsError) throw itemsError;
        
        // 2. Delete the order
        const { error: orderError } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);
          
        if (orderError) throw orderError;

        // 3. Update local state
        setOrders(prev => prev.filter(order => order.id !== id));
        
        // 4. Close details modal if open
        if (selectedOrder?.id === id) {
          setSelectedOrder(null);
        }
        
        alert(`Order ${id} has been permanently deleted.`);
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order.');
      }
    }
  };


  const handlePrintInvoice = (order: any) => {
    const invoiceWindow = window.open('', '_blank', 'width=800,height=900');
    if (!invoiceWindow) return;

    const invoiceHTML = `
      <html>
        <head>
          <title>Invoice - ${order.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #ff5a00; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 800; color: #ff5a00; }
            .invoice-info { text-align: right; }
            .details { display: flex; justify-content: space-between; margin-top: 40px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 40px; }
            .table th { text-align: left; background: #f9f9f9; padding: 12px; border-bottom: 1px solid #eee; }
            .table td { padding: 12px; border-bottom: 1px solid #eee; }
            .totals { margin-top: 40px; text-align: right; }
            .totals div { margin-bottom: 10px; font-size: 14px; }
            .grand-total { font-size: 20px; font-weight: 800; color: #ff5a00; border-top: 1px solid #eee; padding-top: 10px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Nittonotonbd</div>
            <div class="invoice-info">
              <h2 style="margin: 0;">INVOICE</h2>
              <p>Order ID: ${order.id}</p>
              <p>Date: ${order.date}</p>
            </div>
          </div>
          <div class="details">
            <div>
              <h4 style="color: #666; margin-bottom: 10px;">BILL TO:</h4>
              <p><strong>${order.customer_name}</strong></p>
              <p>${order.address || 'N/A'}</p>
              <p>Phone: ${order.customer_phone}</p>
            </div>
            <div style="text-align: right;">
              <h4 style="color: #666; margin-bottom: 10px;">PAYMENT:</h4>
              <p>Method: Online Payment</p>
              <p>Status: ${order.payment_status}</p>
            </div>

          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Premium Wireless Headphones</td>
                <td>1</td>
                <td>${order.amount}</td>
                <td>${order.amount}</td>
              </tr>
            </tbody>
          </table>
          <div class="totals">
            <div>Subtotal: ${order.amount}</div>
            <div>Shipping: ৳60</div>
            <div class="grand-total">Grand Total: ${order.amount}</div>
          </div>
          <div style="margin-top: 60px; text-align: center; color: #999; font-size: 12px;">
            Thank you for shopping with Nittonotonbd!
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 100);
            }
          </script>
        </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
  };

  const handleExportCSV = () => {
    // CSV Headers
    const headers = ['Order ID', 'Customer', 'Date', 'Amount', 'Payment Status', 'Order Status'];
    
    // Format rows
    const rows = filteredOrders.map(order => [
      order.id,
      order.customer_name,
      order.date,
      order.total.toString(),
      order.payment_status,
      order.status
    ]);


    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nittonotonbd-orders-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={closeOrderDetail}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.sectionTitle}>Order Details: {selectedOrder.id}</h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  className={styles.secondaryBtn}
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                    } else {
                      setIsEditing(true);
                      setEditName(selectedOrder.customer_name);
                      setEditPhone(selectedOrder.customer_phone);
                      setEditAddress(selectedOrder.address || '');
                      setEditNotes(selectedOrder.notes || '');
                      setEditPaymentStatus(selectedOrder.payment_status);
                      setEditSubtotal(selectedOrder.subtotal || (selectedOrder.total - selectedOrder.shipping_cost));
                      setEditShippingCost(selectedOrder.shipping_cost);
                      setEditTotal(selectedOrder.total);
                      setEditItems(selectedOrder.items ? selectedOrder.items.map(item => ({ ...item })) : []);
                    }
                  }}
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Order'}
                </button>
                {!isEditing && (
                  <button
                    className={styles.secondaryBtn}
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '13px', 
                      color: '#ef4444', 
                      borderColor: '#fca5a5',
                      backgroundColor: '#fef2f2'
                    }}
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                  >
                    Delete Order
                  </button>
                )}
                <button className={styles.iconBtn} onClick={closeOrderDetail}>
                  <HugeiconsIcon icon={Cancel01Icon} size={24} />
                </button>
              </div>
            </div>
            <div className={styles.modalBody}>
              {isEditing ? (
                <div>
                  <div className={styles.detailsGrid} style={{ marginBottom: '24px' }}>
                    <div className={styles.formGroup} style={{ marginBottom: '12px' }}>
                      <label className={styles.formLabel}>Customer Name</label>
                      <input 
                        type="text" 
                        className={styles.input} 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)} 
                      />
                    </div>
                    <div className={styles.formGroup} style={{ marginBottom: '12px' }}>
                      <label className={styles.formLabel}>Customer Phone</label>
                      <input 
                        type="text" 
                        className={styles.input} 
                        value={editPhone} 
                        onChange={(e) => setEditPhone(e.target.value)} 
                      />
                    </div>
                    <div className={styles.formGroup} style={{ marginBottom: '12px', gridColumn: 'span 2' }}>
                      <label className={styles.formLabel}>Shipping Address</label>
                      <textarea 
                        className={styles.textarea} 
                        style={{ minHeight: '60px' }}
                        value={editAddress} 
                        onChange={(e) => setEditAddress(e.target.value)} 
                      />
                    </div>
                    <div className={styles.formGroup} style={{ marginBottom: '12px' }}>
                      <label className={styles.formLabel}>কালার কোড (Color Code)</label>
                      <input 
                        type="text" 
                        className={styles.input} 
                        value={editNotes} 
                        onChange={(e) => setEditNotes(e.target.value)} 
                      />
                    </div>
                    <div className={styles.formGroup} style={{ marginBottom: '12px' }}>
                      <label className={styles.formLabel}>Payment Status</label>
                      <select 
                        className={styles.select} 
                        value={editPaymentStatus} 
                        onChange={(e) => setEditPaymentStatus(e.target.value)}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.orderItemsTable} style={{ marginTop: '16px', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px' }}>EDIT ORDER ITEMS</h4>
                    {editItems.map((item, index) => (
                      <div key={item.id} className={styles.itemRow} style={{ alignItems: 'center' }}>
                        <div className={styles.itemInfo} style={{ flex: 2 }}>
                          <div 
                            className={styles.productThumb} 
                            style={{ width: '40px', height: '40px', backgroundImage: `url(${item.image_url})`, backgroundSize: 'cover', flexShrink: 0 }}
                          ></div>
                          <div className={styles.itemDetails} style={{ width: '100%' }}>
                            <input 
                              type="text" 
                              className={styles.input} 
                              style={{ padding: '6px 10px', fontSize: '13px' }}
                              value={item.product_title} 
                              onChange={(e) => updateItemTitle(index, e.target.value)} 
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <div style={{ width: '80px' }}>
                            <label style={{ fontSize: '10px', color: 'var(--text-gray)', display: 'block' }}>Price</label>
                            <input 
                              type="number" 
                              className={styles.input} 
                              style={{ padding: '6px 10px', fontSize: '13px', textAlign: 'right' }}
                              value={item.price} 
                              onChange={(e) => updateItemPrice(index, Number(e.target.value))} 
                            />
                          </div>
                          <div style={{ width: '60px' }}>
                            <label style={{ fontSize: '10px', color: 'var(--text-gray)', display: 'block' }}>Qty</label>
                            <input 
                              type="number" 
                              className={styles.input} 
                              style={{ padding: '6px 10px', fontSize: '13px', textAlign: 'center' }}
                              value={item.quantity} 
                              onChange={(e) => updateItemQuantity(index, Number(e.target.value))} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.summarySection} style={{ marginTop: '24px' }}>
                    <div className={styles.summaryRow} style={{ alignItems: 'center', marginBottom: '8px' }}>
                      <span>Subtotal</span>
                      <input 
                        type="number" 
                        className={styles.input} 
                        style={{ width: '120px', padding: '6px 10px', fontSize: '13px', textAlign: 'right' }}
                        value={editSubtotal} 
                        onChange={(e) => handleSubtotalChange(Number(e.target.value))} 
                      />
                    </div>
                    <div className={styles.summaryRow} style={{ alignItems: 'center', marginBottom: '8px' }}>
                      <span>Shipping Fee</span>
                      <input 
                        type="number" 
                        className={styles.input} 
                        style={{ width: '120px', padding: '6px 10px', fontSize: '13px', textAlign: 'right' }}
                        value={editShippingCost} 
                        onChange={(e) => handleShippingCostChange(Number(e.target.value))} 
                      />
                    </div>
                    <div className={`${styles.summaryRow} ${styles.summaryTotal}`} style={{ alignItems: 'center' }}>
                      <span>Grand Total</span>
                      <input 
                        type="number" 
                        className={styles.input} 
                        style={{ width: '120px', padding: '6px 10px', fontSize: '15px', fontWeight: 'bold', textAlign: 'right', color: 'var(--primary-color)' }}
                        value={editTotal} 
                        onChange={(e) => setEditTotal(Number(e.target.value))} 
                      />
                    </div>
                  </div>

                  <div className={styles.btnGroup} style={{ marginTop: '24px' }}>
                    <button 
                      className={styles.primaryBtn} 
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={handleSaveEdits}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div className={styles.detailsGrid} style={{ flex: 1, marginBottom: 0 }}>
                      <div className={styles.detailItem}>
                        <h4>Customer Info</h4>
                        <p>{selectedOrder.customer_name}</p>
                        <p style={{ fontWeight: '400', fontSize: '14px', color: 'var(--text-gray)' }}>{selectedOrder.customer_phone}</p>
                      </div>
                      <div className={styles.detailItem}>
                        <h4>Shipping Address</h4>
                        <p style={{ fontWeight: '400', fontSize: '14px' }}>
                          {selectedOrder.address || 'No address provided'}
                        </p>
                      </div>
                      <div className={styles.detailItem}>
                        <h4>কালার কোড (Color Code)</h4>
                        <p style={{ fontWeight: '600', color: '#ff5a00' }}>
                          {selectedOrder.notes || 'No color code specified'}
                        </p>
                      </div>
                      <div className={styles.detailItem}>
                        <h4>Payment Status</h4>
                        <p>{selectedOrder.payment_status}</p>
                      </div>

                      <div className={styles.detailItem}>
                        <h4>Order Status</h4>
                        <span className={`${styles.status} ${getStatusClass(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>

                    <div className={styles.qrCodeContainer}>
                      <div className={styles.qrPlaceholder}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selectedOrder.id)}`} 
                          alt="QR Code"
                          style={{ width: '100%', height: '100%', padding: '4px' }}
                        />
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-light)' }}>SCAN ORDER</span>
                    </div>
                  </div>

                  <div className={styles.orderItemsTable}>
                    <h4 style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px' }}>ORDER ITEMS</h4>
                    {selectedOrder.items?.map((item: any) => (
                      <div key={item.id} className={styles.itemRow}>
                        <div className={styles.itemInfo}>
                          <div 
                            className={styles.productThumb} 
                            style={{ width: '50px', height: '50px', backgroundImage: `url(${item.image_url})`, backgroundSize: 'cover' }}
                          ></div>
                          <div className={styles.itemDetails}>
                            <span className={styles.itemName}>{item.product_title}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '600' }}>৳{item.price}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>Qty: {item.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.summarySection}>
                    <div className={styles.summaryRow}>
                      <span>Subtotal</span>
                      <span>৳{selectedOrder.subtotal || (selectedOrder.total - selectedOrder.shipping_cost)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Shipping Fee</span>
                      <span>৳{selectedOrder.shipping_cost}</span>
                    </div>

                    <div className={styles.summaryRow}>
                      <span>Discount</span>
                      <span style={{ color: '#ef4444' }}>-৳0</span>
                    </div>
                    <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                      <span>Grand Total</span>
                      <span>{selectedOrder.amount}</span>
                    </div>
                  </div>

                  {/* SteadFast Courier Action Card */}
                  <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🚚 SteadFast Courier Integration
                      </h4>
                      {selectedOrder.consignment_id && (
                        <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '600' }}>
                          ID: {selectedOrder.consignment_id}
                        </span>
                      )}
                    </div>

                    {selectedOrder.consignment_id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '13px', color: '#475569' }}>
                          <strong>Tracking Code:</strong> {selectedOrder.tracking_code || 'N/A'}<br />
                          <strong>Courier Status:</strong> <span style={{ textTransform: 'capitalize', color: '#0284c7', fontWeight: '600' }}>{selectedOrder.courier_status || 'In Transit'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            className={styles.secondaryBtn}
                            style={{ fontSize: '13px', padding: '6px 12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none' }}
                            onClick={() => handleFetchTrackingStatus(selectedOrder.consignment_id, selectedOrder.id)}
                            disabled={trackingLoading}
                          >
                            {trackingLoading ? 'Fetching Status...' : '🔍 Check Live Status'}
                          </button>
                          <button
                            className={styles.secondaryBtn}
                            style={{ fontSize: '13px', padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
                            onClick={() => handleReturnRequest(selectedOrder)}
                          >
                            🔄 Return Request
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                          Order hasn't been sent to SteadFast courier yet.
                        </p>
                        <button
                          className={styles.primaryBtn}
                          style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap', backgroundColor: '#ff5a00' }}
                          onClick={() => handleSendToSteadfast(selectedOrder)}
                          disabled={sendingToSteadfast}
                        >
                          {sendingToSteadfast ? 'Sending Order...' : '🚀 Send to SteadFast'}
                        </button>
                      </div>
                    )}

                    {trackingDetails && (
                      <div style={{ marginTop: '14px', padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                        <strong style={{ color: '#0f172a' }}>Live Delivery Info:</strong>
                        <pre style={{ margin: '6px 0 0 0', fontSize: '12px', whiteSpace: 'pre-wrap', color: '#334155' }}>
                          {JSON.stringify(trackingDetails, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className={styles.minimalSection}>
                    <h4 style={{ fontSize: '13px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px' }}>Update Order Status</h4>
                    <div className={styles.statusToggleGroup}>
                      {['New order', 'Order conform', 'No response', 'Delivered', 'Cancelled'].map((status) => (
                        <button
                          key={status}
                          className={`${styles.statusToggleButton} ${(updatingStatus || selectedOrder.status) === status ? styles.statusToggleButtonActive : ''}`}
                          onClick={() => setUpdatingStatus(status)}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    {updatingStatus && updatingStatus !== selectedOrder.status && (
                      <button 
                        className={styles.primaryBtn} 
                        style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
                        onClick={handleStatusUpdate}
                      >
                        Confirm Status Change
                      </button>
                    )}
                  </div>

                  <div className={styles.btnGroup} style={{ marginTop: '32px', borderTop: '1px solid var(--bg-light)', paddingTop: '20px' }}>
                    <button className={styles.secondaryBtn} onClick={closeOrderDetail} style={{ width: '100%', justifyContent: 'center' }}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Orders Management</h1>
          <p className={styles.pageSubtitle}>
            {filterStatus === 'All' 
              ? "Track and manage your customer orders and shipments." 
              : `Showing ${filterStatus} orders.`}
          </p>
        </div>
        <div className={styles.headerActions}>
          {filterStatus !== 'All' && (
            <button className={styles.secondaryBtn} onClick={() => setFilterStatus('All')}>
              Show All Orders
            </button>
          )}
          <button className={styles.secondaryBtn} onClick={handleExportCSV}>
            <HugeiconsIcon icon={Download01Icon} size={20} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard 
              label="New Orders" 
              value={pendingOrdersCount.toString()} 
              icon={Clock01Icon} 
              trend="" 
              trendUp={true} 
              color="#f59e0b" 
              onClick={() => setFilterStatus('New order')}
            />
            <StatCard 
              label="Completed Orders" 
              value={completedOrdersCount.toString()} 
              icon={Tick02Icon} 
              trend="" 
              trendUp={true} 
              color="#10b981" 
              onClick={() => setFilterStatus('Delivered')}
            />
            <StatCard 
              label="Total Revenue" 
              value={`৳${totalRevenue.toLocaleString()}`} 
              icon={Dollar01Icon} 
              trend="" 
              trendUp={true} 
              color="#ff5a00" 
            />
            <StatCard 
              label="SteadFast COD Balance" 
              value={steadfastBalance !== null ? `৳${steadfastBalance.toLocaleString()}` : 'Check Live'} 
              icon={Dollar01Icon} 
              trend="Live Balance" 
              trendUp={true} 
              color="#0284c7" 
              onClick={fetchSteadfastBalance}
            />
          </>
        )}
      </div>


      <div className={styles.filterBar}>
        <div className={styles.searchContainer}>
          <HugeiconsIcon icon={Search01Icon} size={18} color="var(--text-light)" />
          <input 
            type="text" 
            placeholder="Search by Order ID, Customer..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <select 
            className={styles.select} 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="New order">New order</option>
            <option value="Order conform">Order conform</option>
            <option value="No response">No response</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select className={styles.select}>
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>Today</option>
            <option>Custom Range</option>
          </select>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={7} />
                ))
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (

                  <tr key={order.id}>
                    <td 
                      style={{ fontWeight: '600', color: 'var(--primary-color)', cursor: 'pointer' }}
                      onClick={() => openOrderDetail(order)}
                    >
                      {order.id}
                    </td>
                    <td>{order.customer_name}</td>
                    <td>{order.date}</td>
                    <td>{order.amount}</td>
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>{order.payment_status}</span>
                    </td>

                    <td>
                      <span className={`${styles.status} ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionBtns} style={{ position: 'relative' }}>
                        <button 
                          className={styles.actionBtn} 
                          title="View Details"
                          onClick={() => openOrderDetail(order)}
                        >
                          <HugeiconsIcon icon={ViewIcon} size={18} />
                        </button>

                        <button 
                          className={styles.actionBtn} 
                          title="More Actions"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === order.id ? null : order.id);
                          }}
                        >
                          <HugeiconsIcon icon={MoreHorizontalIcon} size={18} />
                        </button>

                        {activeMenu === order.id && (
                          <div className={styles.actionDropdown} onClick={(e) => e.stopPropagation()}>
                             <button 
                               className={styles.actionDropdownItem}
                               onClick={() => {
                                 openOrderDetail(order);
                                 setActiveMenu(null);
                               }}
                             >
                               <HugeiconsIcon icon={Edit01Icon} size={16} />
                               <span>Edit Order</span>
                             </button>

                            <button 
                              className={styles.actionDropdownItem}
                              onClick={() => {
                                handlePrintInvoice(order);
                                setActiveMenu(null);
                              }}
                            >
                              <HugeiconsIcon icon={PrinterIcon} size={16} />
                              <span>Print Invoice</span>
                            </button>
                            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }}></div>
                            {!order.consignment_id ? (
                              <button 
                                className={styles.actionDropdownItem}
                                style={{ color: '#ff5a00' }}
                                onClick={() => {
                                  handleSendToSteadfast(order);
                                  setActiveMenu(null);
                                }}
                              >
                                🚀 <span>Send to SteadFast</span>
                              </button>
                            ) : (
                              <button 
                                className={styles.actionDropdownItem}
                                style={{ color: '#0284c7' }}
                                onClick={() => {
                                  handleFetchTrackingStatus(order.consignment_id, order.id);
                                  setActiveMenu(null);
                                }}
                              >
                                🔍 <span>Check Tracking</span>
                              </button>
                            )}
                            <button 
                              className={styles.actionDropdownItem}
                              onClick={() => {
                                handleReturnRequest(order);
                                setActiveMenu(null);
                              }}
                            >
                              🔄 <span>Return Request</span>
                            </button>
                            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }}></div>
                            <button 
                              className={styles.actionDropdownItem}
                              onClick={() => {
                                handleCancelOrder(order.id);
                                setActiveMenu(null);
                              }}
                            >
                              <HugeiconsIcon icon={Cancel01Icon} size={16} />
                              <span>Cancel Order</span>
                            </button>
                            <button 
                              className={`${styles.actionDropdownItem} ${styles.actionDropdownItemDanger}`}
                              onClick={() => {
                                handleDeleteOrder(order.id);
                                setActiveMenu(null);
                              }}
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={16} />
                              <span>Delete Order</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
                    No {filterStatus} orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Order List */}
        <div className={styles.mobileOrderList}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading orders...</div>
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderCardHeader}>
                  <div>
                    <div className={styles.orderCardId} onClick={() => openOrderDetail(order)}>{order.id}</div>
                    <div className={styles.orderCardDate}>{order.date}</div>
                  </div>
                  <span className={`${styles.status} ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className={styles.orderCardBody}>
                  <div className={styles.orderCardItem}>
                    <h4>Customer</h4>
                    <p>{order.customer_name}</p>
                  </div>
                  <div className={styles.orderCardItem}>
                    <h4>Amount</h4>
                    <p>{order.amount}</p>
                  </div>
                  <div className={styles.orderCardItem}>
                    <h4>Payment</h4>
                    <p style={{ fontSize: '13px' }}>{order.payment_status}</p>
                  </div>
                </div>

                <div className={styles.orderCardActions}>
                  <button className={styles.mobileActionBtn} onClick={() => openOrderDetail(order)}>
                    <HugeiconsIcon icon={ViewIcon} size={16} />
                    <span>View</span>
                  </button>
                  <button 
                    className={styles.mobileActionBtn}
                    onClick={() => {
                      handlePrintInvoice(order);
                    }}
                  >
                    <HugeiconsIcon icon={PrinterIcon} size={16} />
                    <span>Invoice</span>
                  </button>
                  <button 
                    className={styles.mobileActionBtn}
                    onClick={() => handleCancelOrder(order.id)}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={16} />
                    <span>Cancel</span>
                  </button>
                  <button 
                    className={`${styles.mobileActionBtn} ${styles.actionDropdownItemDanger}`}
                    onClick={() => handleDeleteOrder(order.id)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
              No {filterStatus} orders found.
            </div>
          )}
        </div>
        
        <div className={styles.pagination}>
          <p style={{ color: 'var(--text-gray)', fontSize: '14px' }}>
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
          <div className={styles.paginationActions}>
            <button className={styles.select} disabled>Previous</button>
            <button className={styles.select} style={{ backgroundColor: 'var(--primary-color)', color: 'white', borderColor: 'var(--primary-color)' }}>1</button>
            <button className={styles.select}>Next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const AdminOrdersPage: React.FC = () => {
  return (
    <Suspense fallback={
      <AdminLayout>
        <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-gray)' }}>
          <div className={styles.loader} style={{ margin: '0 auto 20px', width: '32px', height: '32px' }}></div>
          <p>Loading Orders...</p>
        </div>
      </AdminLayout>
    }>
      <AdminOrdersPageContent />
    </Suspense>
  );
};

export default AdminOrdersPage;

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import AdminLayout from '../../../../components/admin/AdminLayout';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  DeliveryTruck01Icon, 
  Search01Icon, 
  ViewIcon,
  RefreshIcon
} from '@hugeicons/core-free-icons';
import styles from '../../Admin.module.css';
import { supabase } from '../../../../lib/supabase';
import { TableRowSkeleton } from '../../../../components/admin/Skeleton';

interface Shipment {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  total: number;
  status: string;
  consignment_id?: string;
  tracking_code?: string;
  courier_status?: string;
  created_at: string;
}

function CourierShipmentsContent() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments(data || []);
    } catch (e) {
      console.error('Error fetching shipments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleSendToSteadfast = async (order: Shipment) => {
    setSendingId(order.id);
    try {
      const cleanInvoice = `INV-${order.id}`;
      const payload = {
        invoice: cleanInvoice,
        recipient_name: order.customer_name,
        recipient_phone: order.customer_phone,
        recipient_address: order.address || 'Dhaka, Bangladesh',
        cod_amount: order.total,
        note: '',
      };

      const res = await fetch('/api/courier/steadfast/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.status === 200 && data.consignment) {
        const consignment = data.consignment;
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'Processing',
            consignment_id: String(consignment.consignment_id),
            tracking_code: consignment.tracking_code,
            courier_status: consignment.status || 'in_review',
          })
          .eq('id', order.id);

        if (updateError) {
          console.error('Failed to update order in DB:', updateError);
          alert(`SteadFast Order Created, but DB update failed: ${updateError.message}`);
        } else {
          alert(`SteadFast Shipment Created Successfully!\nConsignment ID: ${consignment.consignment_id}`);
        }
        fetchShipments();
      } else {
        alert(`SteadFast Error: ${data.message || 'Order creation failed'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSendingId(null);
    }
  };

  const filtered = shipments.filter(s => 
    s.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id?.toString().includes(searchQuery) ||
    s.consignment_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>📦 Courier Shipments</h1>
          <p className={styles.pageSubtitle}>Manage and dispatch customer parcels to Steadfast Courier.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondaryBtn} onClick={fetchShipments}>
            <HugeiconsIcon icon={RefreshIcon} size={18} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchContainer}>
          <HugeiconsIcon icon={Search01Icon} size={18} color="var(--text-light)" />
          <input 
            type="text" 
            placeholder="Search shipments by customer name, order ID or consignment ID..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Recipient</th>
                <th>Address</th>
                <th>COD Amount</th>
                <th>Consignment ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={6} />
                ))
              ) : filtered.length > 0 ? (
                filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>#ORD-{s.id}</td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{s.customer_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{s.customer_phone}</div>
                    </td>
                    <td style={{ maxWidth: '200px', fontSize: '13px' }}>{s.address || 'Dhaka'}</td>
                    <td style={{ fontWeight: '600' }}>৳{s.total}</td>
                    <td>
                      {s.consignment_id ? (
                        <span style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '600', fontSize: '12px' }}>
                          {s.consignment_id}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Not Created</span>
                      )}
                    </td>
                    <td>
                      {!s.consignment_id ? (
                        <button
                          className={styles.primaryBtn}
                          style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#ff5a00' }}
                          onClick={() => handleSendToSteadfast(s)}
                          disabled={sendingId === s.id}
                        >
                          {sendingId === s.id ? 'Sending...' : '🚀 Send to Courier'}
                        </button>
                      ) : (
                        <span style={{ color: '#0284c7', fontSize: '13px', fontWeight: '500' }}>Dispatched</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No shipments available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function CourierShipmentsPage() {
  return (
    <Suspense fallback={<div>Loading Shipments...</div>}>
      <CourierShipmentsContent />
    </Suspense>
  );
}

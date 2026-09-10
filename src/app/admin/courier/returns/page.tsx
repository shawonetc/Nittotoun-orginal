'use client';

import React, { useEffect, useState, Suspense } from 'react';
import AdminLayout from '../../../../components/admin/AdminLayout';
import { HugeiconsIcon } from '@hugeicons/react';
import { RefreshIcon, Search01Icon } from '@hugeicons/core-free-icons';
import styles from '../../Admin.module.css';
import { supabase } from '../../../../lib/supabase';
import { TableRowSkeleton } from '../../../../components/admin/Skeleton';

interface ReturnOrder {
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

function CourierReturnsContent() {
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'Cancelled')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReturns(data || []);
    } catch (e) {
      console.error('Error fetching returned orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const filtered = returns.filter(r => 
    r.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id?.toString().includes(searchQuery) ||
    r.consignment_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className={styles.sectionHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex' }}>
              <HugeiconsIcon icon={RefreshIcon} size={26} />
            </div>
            <h1 className={styles.pageTitle} style={{ margin: 0 }}>Returned & Cancelled Orders</h1>
          </div>
          <p className={styles.pageSubtitle} style={{ marginTop: '4px' }}>
            View all return requests and cancelled shipments processed by Steadfast Courier.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondaryBtn} onClick={fetchReturns}>
            <HugeiconsIcon icon={RefreshIcon} size={18} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchContainer}>
          <HugeiconsIcon icon={Search01Icon} size={18} color="var(--text-light)" />
          <input 
            type="text" 
            placeholder="Search returned orders..." 
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
                <th>Customer</th>
                <th>Phone</th>
                <th>Consignment ID</th>
                <th>Amount</th>
                <th>Return Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={6} />
                ))
              ) : filtered.length > 0 ? (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>#ORD-{r.id}</td>
                    <td>{r.customer_name}</td>
                    <td>{r.customer_phone}</td>
                    <td>{r.consignment_id || 'N/A'}</td>
                    <td>৳{r.total}</td>
                    <td>
                      <span className={`${styles.status} ${styles.statusCancelled}`}>
                        {r.courier_status === 'returned' ? 'Returned' : 'Cancelled'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No return orders found.
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

export default function CourierReturnsPage() {
  return (
    <Suspense fallback={<div>Loading Returns...</div>}>
      <CourierReturnsContent />
    </Suspense>
  );
}

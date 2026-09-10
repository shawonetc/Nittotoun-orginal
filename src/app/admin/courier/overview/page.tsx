'use client';

import React, { useEffect, useState, Suspense } from 'react';
import AdminLayout from '../../../../components/admin/AdminLayout';
import StatCard from '../../../../components/admin/StatCard';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Dollar01Icon, 
  DeliveryTruck01Icon, 
  Location01Icon, 
  RefreshIcon,
  Search01Icon,
  ViewIcon,
  Tick02Icon,
  Clock01Icon
} from '@hugeicons/core-free-icons';
import styles from '../../Admin.module.css';
import { supabase } from '../../../../lib/supabase';
import { StatCardSkeleton, TableRowSkeleton } from '../../../../components/admin/Skeleton';

interface CourierShipment {
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

function CourierOverviewContent() {
  const [shipments, setShipments] = useState<CourierShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCourierData = async () => {
    setLoading(true);
    try {
      // 1. Fetch balance
      const res = await fetch('/api/courier/steadfast/balance');
      const bData = await res.json();
      if (bData && (bData.current_balance !== undefined || bData.balance !== undefined)) {
        setBalance(bData.current_balance ?? bData.balance);
      }

      // 2. Fetch orders with courier tracking or all orders
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments(data || []);
    } catch (e) {
      console.error('Error fetching courier overview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourierData();
  }, []);

  const dispatchedCount = shipments.filter(s => s.consignment_id).length;
  const pendingCourierCount = shipments.filter(s => !s.consignment_id && s.status !== 'Cancelled').length;
  const returnedCount = shipments.filter(s => s.status === 'Cancelled' || s.courier_status === 'returned').length;

  const filteredShipments = shipments.filter(s => 
    s.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id?.toString().includes(searchQuery) ||
    s.consignment_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>🚚 Steadfast Courier Overview</h1>
          <p className={styles.pageSubtitle}>Monitor your Steadfast deliveries, COD balance, and dispatch performance.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondaryBtn} onClick={fetchCourierData}>
            🔄 Refresh Data
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard 
              label="SteadFast COD Balance" 
              value={balance !== null ? `৳${balance.toLocaleString()}` : 'Check Live'} 
              icon={Dollar01Icon} 
              trend="Current Balance" 
              trendUp={true} 
              color="#0284c7" 
              onClick={fetchCourierData}
            />
            <StatCard 
              label="Dispatched Parcels" 
              value={dispatchedCount.toString()} 
              icon={DeliveryTruck01Icon} 
              trend="In Steadfast" 
              trendUp={true} 
              color="#10b981" 
            />
            <StatCard 
              label="Pending Dispatch" 
              value={pendingCourierCount.toString()} 
              icon={Clock01Icon} 
              trend="Ready to Send" 
              trendUp={false} 
              color="#f59e0b" 
            />
            <StatCard 
              label="Returned / Cancelled" 
              value={returnedCount.toString()} 
              icon={RefreshIcon} 
              trend="Returns" 
              trendUp={false} 
              color="#ef4444" 
            />
          </>
        )}
      </div>

      <div className={styles.filterBar} style={{ marginTop: '24px' }}>
        <div className={styles.searchContainer}>
          <HugeiconsIcon icon={Search01Icon} size={18} color="var(--text-light)" />
          <input 
            type="text" 
            placeholder="Search by Order ID, Consignment ID, Customer..." 
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
                <th>Consignment ID</th>
                <th>Tracking Code</th>
                <th>COD Amount</th>
                <th>Courier Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={6} />
                ))
              ) : filteredShipments.length > 0 ? (
                filteredShipments.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>#ORD-{s.id}</td>
                    <td>
                      <div>{s.customer_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{s.customer_phone}</div>
                    </td>
                    <td>{s.consignment_id ? <span style={{ fontWeight: '600', color: '#15803d' }}>{s.consignment_id}</span> : <span style={{ color: '#94a3b8' }}>Not Dispatched</span>}</td>
                    <td>{s.tracking_code || 'N/A'}</td>
                    <td>৳{s.total}</td>
                    <td>
                      <span className={`${styles.status} ${s.consignment_id ? styles.statusProcessing : styles.statusPending}`}>
                        {s.courier_status || (s.consignment_id ? 'In Transit' : 'Pending')}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No shipments found.
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

export default function CourierOverviewPage() {
  return (
    <Suspense fallback={<div>Loading Courier Overview...</div>}>
      <CourierOverviewContent />
    </Suspense>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

const statusLabels = { pending: 'قيد المراجعة', approved: 'معتمد', suspended: 'موقوف' };

export default function MerchantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [stats, setStats] = useState(null);
  const [commissionInput, setCommissionInput] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get(`/merchants/${id}`);
    setMerchant(data.merchant);
    setStats(data.stats);
    setCommissionInput(String(data.merchant.commissionRate));
  };

  useEffect(() => {
    load();
  }, [id]);

  const changeStatus = async (status) => {
    setError('');
    try {
      await api.put(`/merchants/${id}/status`, {
        status,
        suspensionReason: status === 'suspended' ? suspensionReason : undefined,
      });
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'حدث خطأ');
    }
  };

  const saveCommission = async () => {
    setError('');
    try {
      await api.put(`/merchants/${id}/commission`, { commissionRate: Number(commissionInput) });
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'حدث خطأ');
    }
  };

  if (!merchant) return <p>...جارٍ التحميل</p>;

  return (
    <div>
      <button onClick={() => navigate('/merchants')} style={styles.backBtn}>
        ← الرجوع للتجار
      </button>

      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0 }}>{merchant.businessName}</h1>
          {merchant.storeName && (
            <p style={{ color: '#0F172A', margin: '2px 0', fontSize: 13, fontWeight: 600 }}>
              اسم المتجر: {merchant.storeName}
            </p>
          )}
          <p style={{ color: '#64748B', margin: '4px 0' }}>
            {merchant.user?.name} — {merchant.user?.email} — {merchant.user?.phone || 'بدون رقم'}
          </p>
        </div>
        <span style={styles.statusBadge}>{statusLabels[merchant.status]}</span>
      </div>

      {error && <p style={{ color: '#DC2626' }}>{error}</p>}

      <div style={styles.statsGrid}>
        <StatCard label="عدد المنتجات" value={stats.productsCount} />
        <StatCard label="قيد المراجعة" value={stats.pendingProductsCount} />
        <StatCard label="عدد الطلبات" value={stats.ordersCount} />
        <StatCard label="إجمالي المبيعات" value={`${stats.totalSales} ج.م`} />
        <StatCard label="إجمالي عمولة MYBRAND" value={`${stats.totalCommission} ج.م`} accent />
        <StatCard label="صافي مستحق التاجر" value={`${stats.totalMerchantAmount} ج.م`} accent />
      </div>

      <div style={styles.row}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>حالة التاجر</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button style={styles.actionBtn} onClick={() => changeStatus('approved')} disabled={merchant.status === 'approved'}>
              ✓ قبول / تفعيل
            </button>
            <button style={{ ...styles.actionBtn, background: '#DC2626' }} onClick={() => changeStatus('suspended')} disabled={merchant.status === 'suspended'}>
              ⏸ إيقاف
            </button>
          </div>
          {merchant.status !== 'suspended' && (
            <input
              placeholder="سبب الإيقاف (اختياري - يظهر للتاجر لو تم الإيقاف)"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              style={styles.input}
            />
          )}
          {merchant.suspensionReason && (
            <p style={{ fontSize: 13, color: '#DC2626', marginTop: 8 }}>آخر سبب إيقاف: {merchant.suspensionReason}</p>
          )}
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>نسبة عمولة MYBRAND</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              min="0"
              max="100"
              value={commissionInput}
              onChange={(e) => setCommissionInput(e.target.value)}
              style={{ ...styles.input, width: 100 }}
            />
            <span style={{ alignSelf: 'center' }}>%</span>
            <button style={styles.actionBtn} onClick={saveCommission}>
              حفظ
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>
            تُطبَّق هذه النسبة على كل منتجات التاجر ما لم يكن للمنتج عمولة مخصصة.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={styles.statCard}>
      <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 0', color: accent ? '#D4AF37' : '#0F172A' }}>{value}</p>
    </div>
  );
}

const styles = {
  backBtn: { background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', marginBottom: 12, fontSize: 13 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  statusBadge: { padding: '4px 12px', borderRadius: 999, background: '#F1F5F9', fontSize: 13, fontWeight: 600 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  card: { background: '#fff', borderRadius: 12, padding: 20 },
  cardTitle: { marginTop: 0, fontSize: 15 },
  input: { padding: 8, borderRadius: 8, border: '1px solid #E2E8F0', flex: 1 },
  actionBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#0F172A',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
  },
};

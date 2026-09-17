import React, { useEffect, useState } from 'react';

const PAGE_SIZE = 20;
import api from '../api/client';
import { useAdminAuth } from '../context/AdminAuthContext';
import { canAccess } from '../utils/permissions';

export default function CustomersPage() {
  const { user } = useAdminAuth();
  const [customers, setCustomers] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canEdit = canAccess(user, '/customers', 'edit');
  const canDelete = canAccess(user, '/customers', 'delete');

  const load = async (targetPage = page) => {
    setLoading(true);
    try {
      const { data } = await api.get('/customers', { params: { page: targetPage, limit: PAGE_SIZE } });
      setCustomers(Array.isArray(data?.customers) ? data.customers : []);
      setPagination({ total: Number(data?.total || 0), pages: Math.max(1, Number(data?.pages || Math.ceil(Number(data?.total || 0) / PAGE_SIZE) || 1)) });
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تحميل العملاء');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const toggleStatus = async (id) => {
    if (!canEdit) return;
    try { await api.put('/customers/' + id + '/toggle-status'); await load(); }
    catch (err) { setError(err?.response?.data?.message || 'تعذر تحديث حالة العميل'); }
  };

  const deleteCustomer = async (customer) => {
    if (!canDelete) return;
    const confirmed = window.confirm('تحذير: سيتم حذف العميل "' + (customer.name || customer.email) + '" نهائيًا من قاعدة البيانات.\n\nهذا الإجراء لا يمكن التراجع عنه. هل تريد المتابعة؟');
    if (!confirmed) return;
    try {
      setDeletingId(customer._id);
      await api.delete('/customers/' + customer._id);
      await load();
    } catch (error) {
      setError(error?.response?.data?.message || 'تعذر حذف العميل');
    } finally { setDeletingId(null); }
  };

  useEffect(() => {
    if (!loading && pagination.pages > 0 && page > pagination.pages) setPage(pagination.pages);
  }, [loading, page, pagination.pages]);

  const hasPrev = page > 1;
  const hasNext = page < pagination.pages;

  return (
    <div>
      <div style={styles.header}><div><h1 style={{ marginBottom: 4 }}>العملاء</h1><span style={styles.count}>{pagination.total.toLocaleString('ar-EG')} عميل</span></div><button style={styles.refresh} onClick={() => load()} disabled={loading}>↻ تحديث</button></div>
      {error && <div style={styles.error}>{error}</div>}
      <table style={styles.table}>
        <thead><tr><th>الاسم</th><th>البريد الإلكتروني</th><th>الهاتف</th><th>الحالة</th><th>إجراء</th></tr></thead>
        <tbody>
          {loading && <tr><td colSpan={5} style={styles.empty}>جارٍ تحميل العملاء...</td></tr>}
          {!loading && customers.map((c) => (
            <tr key={c._id}>
              <td>{c.name}</td><td>{c.email}</td><td>{c.phone || '-'}</td><td>{c.isActive ? 'نشط' : 'معطّل'}</td>
              <td style={styles.actions}>
                {canEdit && <button style={styles.smallBtn} onClick={() => toggleStatus(c._id)}> {c.isActive ? 'تعطيل' : 'تفعيل'} </button>}
                {canDelete && <button style={styles.deleteBtn} onClick={() => deleteCustomer(c)} disabled={deletingId === c._id}>{deletingId === c._id ? 'جاري الحذف...' : 'حذف نهائي'}</button>}
                {!canEdit && !canDelete && <span style={styles.readOnly}>مشاهدة فقط</span>}
              </td>
            </tr>
          ))}
          {!loading && customers.length === 0 && <tr><td colSpan={5} style={styles.empty}>لا يوجد عملاء بعد</td></tr>}
        </tbody>
      </table>
      {pagination.total > 0 && <div style={styles.pagination}><button style={styles.pageBtn} disabled={!hasPrev || loading} onClick={() => setPage(v => Math.max(1, v - 1))}>السابق</button><span>صفحة {page} من {pagination.pages}</span><button style={styles.pageBtn} disabled={!hasNext || loading} onClick={() => setPage(v => v + 1)}>التالي</button></div>}
    </div>
  );
}

const styles = { header:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}, count:{color:'#64748B',fontSize:12,fontWeight:700}, refresh:{padding:'8px 12px',border:'1px solid #CBD5E1',borderRadius:8,background:'#fff',cursor:'pointer'}, error:{padding:10,background:'#FEF2F2',color:'#B91C1C',borderRadius:8,marginBottom:10,fontSize:12}, empty:{textAlign:'center',padding:20,color:'#64748B'}, pagination:{display:'flex',justifyContent:'center',alignItems:'center',gap:12,padding:'14px 0',fontSize:12,color:'#64748B'}, pageBtn:{padding:'7px 12px',border:'1px solid #CBD5E1',borderRadius:8,background:'#fff',cursor:'pointer'}, table:{width:'100%',background:'#fff',borderRadius:12,borderCollapse:'collapse',overflow:'hidden'}, actions:{display:'flex',gap:8,alignItems:'center'}, smallBtn:{padding:'4px 10px',borderRadius:6,border:'none',background:'#0F172A',color:'#fff',cursor:'pointer',fontSize:12}, deleteBtn:{padding:'4px 10px',borderRadius:6,border:'none',background:'#DC2626',color:'#fff',cursor:'pointer',fontSize:12}, readOnly:{fontSize:12,color:'#64748B'} };

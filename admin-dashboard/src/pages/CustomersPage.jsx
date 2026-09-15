import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAdminAuth } from '../context/AdminAuthContext';
import { canAccess } from '../utils/permissions';

export default function CustomersPage() {
  const { user } = useAdminAuth();
  const [customers, setCustomers] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    const { data } = await api.get('/customers');
    setCustomers(data.customers || []);
  };

  useEffect(() => { load(); }, []);

  const canEdit = canAccess(user, '/customers', 'edit');
  const canDelete = canAccess(user, '/customers', 'delete');

  const toggleStatus = async (id) => {
    if (!canEdit) return;
    await api.put(`/customers/${id}/toggle-status`);
    load();
  };

  const deleteCustomer = async (customer) => {
    if (!canDelete) return;
    const confirmed = window.confirm(`تحذير: سيتم حذف العميل "${customer.name || customer.email}" نهائيًا من قاعدة البيانات.\n\nهذا الإجراء لا يمكن التراجع عنه. هل تريد المتابعة؟`);
    if (!confirmed) return;
    try {
      setDeletingId(customer._id);
      await api.delete(`/customers/${customer._id}`);
      setCustomers((current) => current.filter((item) => item._id !== customer._id));
    } catch (error) {
      window.alert(error?.response?.data?.message || 'تعذر حذف العميل');
    } finally { setDeletingId(null); }
  };

  return (
    <div>
      <h1>العملاء</h1>
      <table style={styles.table}>
        <thead><tr><th>الاسم</th><th>البريد الإلكتروني</th><th>الهاتف</th><th>الحالة</th><th>إجراء</th></tr></thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c._id}>
              <td>{c.name}</td><td>{c.email}</td><td>{c.phone || '-'}</td><td>{c.isActive ? 'نشط' : 'معطّل'}</td>
              <td style={styles.actions}>
                {canEdit && <button style={styles.smallBtn} onClick={() => toggleStatus(c._id)}>{c.isActive ? 'تعطيل' : 'تفعيل'}</button>}
                {canDelete && <button style={styles.deleteBtn} onClick={() => deleteCustomer(c)} disabled={deletingId === c._id}>{deletingId === c._id ? 'جاري الحذف...' : 'حذف نهائي'}</button>}
                {!canEdit && !canDelete && <span style={styles.readOnly}>مشاهدة فقط</span>}
              </td>
            </tr>
          ))}
          {customers.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#64748B' }}>لا يوجد عملاء بعد</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const styles = { table:{width:'100%',background:'#fff',borderRadius:12,borderCollapse:'collapse',overflow:'hidden'}, actions:{display:'flex',gap:8,alignItems:'center'}, smallBtn:{padding:'4px 10px',borderRadius:6,border:'none',background:'#0F172A',color:'#fff',cursor:'pointer',fontSize:12}, deleteBtn:{padding:'4px 10px',borderRadius:6,border:'none',background:'#DC2626',color:'#fff',cursor:'pointer',fontSize:12}, readOnly:{fontSize:12,color:'#64748B'} };

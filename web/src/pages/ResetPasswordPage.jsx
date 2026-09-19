import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault(); setError(''); setMessage('');
    if (!token) return setError('رابط إعادة التعيين غير صالح.');
    if (password.length < 12) return setError('كلمة المرور يجب أن تكون 12 حرفًا على الأقل.');
    if (password !== confirm) return setError('كلمتا المرور غير متطابقتين.');
    setLoading(true);
    try { const { data } = await api.post('/auth/reset-password', { token, password }); setMessage(data.message); setTimeout(()=>navigate('/login'), 1200); }
    catch (err) { setError(err?.response?.data?.message || 'تعذر تغيير كلمة المرور'); }
    finally { setLoading(false); }
  };
  return <main dir="rtl" style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#f8fafc'}}><form onSubmit={submit} style={{width:'min(100%,440px)',background:'#fff',padding:28,borderRadius:20,border:'1px solid #e2e8f0',boxShadow:'0 12px 40px rgba(15,23,42,.08)'}}><div style={{textAlign:'center',marginBottom:24}}><div style={{fontSize:38,fontWeight:900}}>M</div><h1 style={{margin:'8px 0'}}>إعادة تعيين كلمة المرور</h1><p style={{color:'#64748b'}}>اختر كلمة مرور جديدة لحسابك.</p></div><label style={{display:'block',fontWeight:700,marginBottom:8}}>كلمة المرور الجديدة</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={12} required autoComplete="new-password" style={{width:'100%',boxSizing:'border-box',padding:'13px 14px',border:'1px solid #cbd5e1',borderRadius:12,fontSize:16}} /><label style={{display:'block',fontWeight:700,margin:'16px 0 8px'}}>تأكيد كلمة المرور</label><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={6} required autoComplete="new-password" style={{width:'100%',boxSizing:'border-box',padding:'13px 14px',border:'1px solid #cbd5e1',borderRadius:12,fontSize:16}} />{error && <div role="alert" style={{marginTop:12,padding:12,borderRadius:10,background:'#fef2f2',color:'#b91c1c'}}>{error}</div>}{message && <div role="status" style={{marginTop:12,padding:12,borderRadius:10,background:'#f0fdf4',color:'#166534'}}>{message}</div>}<button disabled={loading} style={{width:'100%',marginTop:18,padding:14,border:0,borderRadius:12,background:'#111827',color:'#fff',fontWeight:800,fontSize:16}}>{loading?'جارٍ الحفظ...':'تغيير كلمة المرور'}</button><div style={{textAlign:'center',marginTop:18}}><Link to="/login">العودة إلى تسجيل الدخول</Link></div></form></main>;
}

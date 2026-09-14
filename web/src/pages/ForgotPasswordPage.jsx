import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault(); setError(''); setMessage(''); setLoading(true);
    try { const { data } = await api.post('/auth/forgot-password', { email }); setMessage(data.message); }
    catch (err) { setError(err?.response?.data?.message || 'تعذر إرسال طلب الاستعادة'); }
    finally { setLoading(false); }
  };
  return <main dir="rtl" style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#f8fafc'}}><form onSubmit={submit} style={{width:'min(100%,440px)',background:'#fff',padding:28,borderRadius:20,border:'1px solid #e2e8f0',boxShadow:'0 12px 40px rgba(15,23,42,.08)'}}><button type="button" onClick={()=>navigate(-1)} style={{border:0,background:'transparent',cursor:'pointer',color:'#64748b'}}>← رجوع</button><div style={{textAlign:'center',margin:'18px 0 26px'}}><div style={{fontSize:38,fontWeight:900}}>M</div><h1 style={{margin:'8px 0'}}>نسيت كلمة المرور؟</h1><p style={{color:'#64748b',lineHeight:1.8}}>أدخل البريد الإلكتروني المرتبط بحسابك وسنرسل لك رابطًا آمنًا لإعادة تعيين كلمة المرور.</p></div><label style={{display:'block',fontWeight:700,marginBottom:8}}>البريد الإلكتروني</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" placeholder="name@example.com" style={{width:'100%',boxSizing:'border-box',padding:'13px 14px',border:'1px solid #cbd5e1',borderRadius:12,fontSize:16}} />{error && <div role="alert" style={{marginTop:12,padding:12,borderRadius:10,background:'#fef2f2',color:'#b91c1c'}}>{error}</div>}{message && <div role="status" style={{marginTop:12,padding:12,borderRadius:10,background:'#f0fdf4',color:'#166534',lineHeight:1.7}}>{message}</div>}<button disabled={loading} style={{width:'100%',marginTop:18,padding:14,border:0,borderRadius:12,background:'#111827',color:'#fff',fontWeight:800,fontSize:16}}>{loading?'جارٍ الإرسال...':'إرسال رابط الاستعادة'}</button><div style={{textAlign:'center',marginTop:18}}><Link to="/login">العودة إلى تسجيل الدخول</Link></div></form></main>;
}

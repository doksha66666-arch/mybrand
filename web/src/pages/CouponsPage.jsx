import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStoreLayout } from '../context/StoreLayoutContext';

export default function CouponsPage(){
  const { getStyle } = useStoreLayout('coupons');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coupons,setCoupons]=useState([]);
  const [message,setMessage]=useState('');
  const [loading,setLoading]=useState(Boolean(user));

  useEffect(()=>{
    let active=true;
    if(!user){
      setCoupons([]);
      setMessage('');
      setLoading(false);
      return ()=>{active=false};
    }
    setLoading(true);
    setMessage('');
    api.get('/coupons/mine')
      .then(({data})=>{ if(active) setCoupons(Array.isArray(data?.coupons)?data.coupons:[]); })
      .catch(()=>{ if(active) setMessage('تعذر تحميل القسائم'); })
      .finally(()=>{ if(active) setLoading(false); });
    return ()=>{active=false};
  },[user]);

  if(!user){
    return <main dir="rtl" style={styles.page}>
      <div style={{...styles.hero,...getStyle('hero')}}>
        <span style={styles.kicker}>MYBRAND REWARDS</span>
        <h1>قسائمك ومكافآتك</h1>
        <p>سجّل الدخول لعرض القسائم والمكافآت المرتبطة بحسابك.</p>
      </div>
      <div style={styles.authCard}>
        <div style={styles.authIcon}>🔐</div>
        <h2 style={styles.authTitle}>تسجيل الدخول مطلوب</h2>
        <p style={styles.authText}>بعد تسجيل الدخول ستظهر القسائم المتاحة لك ويمكنك استخدام رمزها عند إتمام الطلب.</p>
        <button type="button" style={styles.primaryButton} onClick={()=>navigate('/login',{state:{returnTo:'/coupons'}})}>تسجيل الدخول</button>
        <Link to="/" style={styles.secondaryLink}>متابعة التسوق كزائر</Link>
      </div>
    </main>;
  }

  return <div dir="rtl" style={styles.page}>
    <Link to="/account" style={styles.back}>← الحساب</Link>
    <div style={{...styles.hero,...getStyle('hero')}}><span style={styles.kicker}>MYBRAND REWARDS</span><h1>قسائمك ومكافآتك</h1><p>استفد من الخصومات التي حصلت عليها وأدخل رمزك عند الدفع.</p></div>
    {message&&<div style={styles.message}>{message}</div>}
    {loading
      ? <div style={{...styles.empty,...styles.loading}}>جارٍ تحميل قسائمك...</div>
      : <div style={{...styles.grid,...getStyle('products')}}>{coupons.length?coupons.map(c=><article key={c._id} style={styles.card}><small>{c.rewardOnly?'🎁 مكافأة':'🏷️ قسيمة خصم'}</small><h2>{c.titleAr}</h2><p>{c.descriptionAr}</p><div style={styles.code}>{c.code}</div><strong>{c.discountType==='percentage' ? c.discountValue+'% خصم' : 'خصم '+c.discountValue+' ج.م'}</strong><small>صالحة حتى {new Date(c.endDate).toLocaleDateString('ar-EG')}</small></article>):<div style={styles.empty}>لا توجد قسائم متاحة حاليًا. تابع العروض لتحصل على مكافآت جديدة.</div>}</div>}
  </div>;
}

const styles={
  page:{maxWidth:1000,margin:'0 auto',padding:'28px 18px 60px',color:'#111827'},
  back:{textDecoration:'none',color:'#64748B'},
  hero:{margin:'24px 0',padding:28,borderRadius:24,background:'linear-gradient(135deg,#111827,#334155)',color:'#fff'},
  kicker:{fontSize:11,letterSpacing:2,opacity:.7},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16},
  card:{padding:22,borderRadius:22,background:'#fff',border:'1px solid #E5E7EB',boxShadow:'0 12px 30px rgba(15,23,42,.07)',display:'grid',gap:10},
  code:{padding:'12px 16px',borderRadius:12,background:'#F8F5EF',letterSpacing:2,fontWeight:900},
  message:{padding:12},
  empty:{gridColumn:'1/-1',padding:40,textAlign:'center',background:'#F8FAFC',borderRadius:20},
  loading:{color:'#64748B'},
  authCard:{maxWidth:520,margin:'0 auto',padding:'34px 24px',borderRadius:24,background:'#fff',border:'1px solid #E5E7EB',boxShadow:'0 12px 30px rgba(15,23,42,.07)',textAlign:'center'},
  authIcon:{fontSize:36,marginBottom:8},
  authTitle:{margin:'0 0 10px'},
  authText:{margin:'0 auto 20px',maxWidth:420,color:'#64748B',lineHeight:1.8},
  primaryButton:{width:'100%',padding:14,border:0,borderRadius:12,background:'#111827',color:'#fff',fontWeight:800,cursor:'pointer'},
  secondaryLink:{display:'block',marginTop:14,color:'#64748B',textDecoration:'none',fontWeight:700},
};
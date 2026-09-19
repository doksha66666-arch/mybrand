import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { useStoreLayout } from '../context/StoreLayoutContext';
export default function CouponsPage(){
  const { getStyle } = useStoreLayout('coupons');
  const [coupons,setCoupons]=useState([]); const [message,setMessage]=useState('');
  useEffect(()=>{api.get('/coupons/mine').then(({data})=>setCoupons(data.coupons||[])).catch(()=>setMessage('تعذر تحميل القسائم'))},[]);
  return <div dir="rtl" style={styles.page}><Link to="/account" style={styles.back}>← الحساب</Link><div style={{...styles.hero,...getStyle('hero')}}><span style={styles.kicker}>MYBRAND REWARDS</span><h1>قسائمك ومكافآتك</h1><p>استفد من الخصومات التي حصلت عليها وأدخل رمزك عند الدفع.</p></div>{message&&<div style={styles.message}>{message}</div>}<div style={{...styles.grid,...getStyle('products')}}>{coupons.length?coupons.map(c=><article key={c._id} style={styles.card}><small>{c.rewardOnly?'🎁 مكافأة':'🏷️ قسيمة خصم'}</small><h2>{c.titleAr}</h2><p>{c.descriptionAr}</p><div style={styles.code}>{c.code}</div><strong>{c.discountType==='percentage'?`${c.discountValue}% خصم`:`خصم ${c.discountValue} ج.م`}</strong><small>صالحة حتى {new Date(c.endDate).toLocaleDateString('ar-EG')}</small></article>):<div style={styles.empty}>لا توجد قسائم متاحة حاليًا. تابع العروض لتحصل على مكافآت جديدة.</div>}</div></div>
}
const styles={page:{maxWidth:1000,margin:'0 auto',padding:'28px 18px 60px',color:'#111827'},back:{textDecoration:'none',color:'#64748B'},hero:{margin:'24px 0',padding:28,borderRadius:24,background:'linear-gradient(135deg,#111827,#334155)',color:'#fff'},kicker:{fontSize:11,letterSpacing:2,opacity:.7},grid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16},card:{padding:22,borderRadius:22,background:'#fff',border:'1px solid #E5E7EB',boxShadow:'0 12px 30px rgba(15,23,42,.07)',display:'grid',gap:10},code:{padding:'12px 16px',borderRadius:12,background:'#F8F5EF',letterSpacing:2,fontWeight:900},message:{padding:12},empty:{gridColumn:'1/-1',padding:40,textAlign:'center',background:'#F8FAFC',borderRadius:20}}

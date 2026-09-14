import React, { useEffect, useState } from 'react';
import api from '../api/client';
import './SettingsPage.css';

const defaults = { storeName:'MYBRAND', storeEmail:'admin@mybrand.com', phone:'', currency:'EGP', timezone:'Africa/Cairo', maintenance:false, newOrder:true, lowStock:true, customerMessage:true };

export default function SettingsPage() {
  const [form,setForm]=useState(defaults),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
  useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem('mybrand_admin_settings')||'null');if(stored)setForm({...defaults,...stored})}catch{}} ,[]);
  const update=(key,value)=>setForm(current=>({...current,[key]:value}));
  const save=async()=>{setSaving(true);setMessage('');localStorage.setItem('mybrand_admin_settings',JSON.stringify(form));try{await api.put('/settings',form);setMessage('تم حفظ الإعدادات بنجاح')}catch{setMessage('تم حفظ الإعدادات محليًا. الحفظ المركزي يحتاج endpoint /settings في الـBackend.')}finally{setSaving(false)}};
  return <div className="settings-page" dir="rtl">
    <header className="settings-head"><div className="crumb">النظام <b>الإعدادات</b></div><h1>إعدادات MYBRAND</h1><p>إدارة بيانات المتجر، المنطقة الزمنية، الإشعارات وحالة المتجر.</p></header>
    <div className="settings-grid">
      <section className="settings-card"><h2>بيانات المتجر</h2><div className="two-col"><Field label="اسم المتجر" value={form.storeName} onChange={v=>update('storeName',v)}/><Field label="البريد الإلكتروني" type="email" value={form.storeEmail} onChange={v=>update('storeEmail',v)}/><Field label="رقم التواصل" value={form.phone} onChange={v=>update('phone',v)} placeholder="01xxxxxxxxx"/><label className="field">العملة الأساسية<select value={form.currency} onChange={e=>update('currency',e.target.value)}><option value="EGP">جنيه مصري (EGP)</option><option value="USD">دولار أمريكي (USD)</option><option value="SAR">ريال سعودي (SAR)</option></select></label><label className="field">المنطقة الزمنية<select value={form.timezone} onChange={e=>update('timezone',e.target.value)}><option value="Africa/Cairo">القاهرة — Africa/Cairo</option><option value="UTC">UTC</option><option value="Asia/Riyadh">الرياض — Asia/Riyadh</option></select></label></div></section>
      <section className="settings-card"><h2>حالة المتجر</h2><Toggle label="وضع الصيانة" hint="إخفاء المتجر مؤقتًا عن العملاء" on={form.maintenance} set={v=>update('maintenance',v)}/><div className={form.maintenance?'warning visible':'warning'}>عند التفعيل يجب إظهار رسالة صيانة واضحة للعميل بدل صفحات فارغة.</div></section>
      <section className="settings-card wide"><h2>الإشعارات</h2><Toggle label="طلب جديد" hint="تنبيه الأدمن عند إنشاء طلب جديد" on={form.newOrder} set={v=>update('newOrder',v)}/><Toggle label="انخفاض المخزون" hint="تنبيه عند وصول المنتج إلى حد المخزون المنخفض" on={form.lowStock} set={v=>update('lowStock',v)}/><Toggle label="رسائل العملاء" hint="تنبيه فريق الإدارة عند وصول رسالة دعم جديدة" on={form.customerMessage} set={v=>update('customerMessage',v)}/></section>
    </div>
    <div className="settings-actions"><button className="save" onClick={save} disabled={saving}>{saving?'جارٍ الحفظ...':'حفظ الإعدادات'}</button></div>{message&&<div className="settings-message">{message}</div>}
  </div>;
}
function Field({label,value,onChange,type='text',placeholder=''}){return <label className="field">{label}<input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/></label>}
function Toggle({label,hint,on,set}){return <div className="toggle-row"><div><b>{label}</b><span>{hint}</span></div><button type="button" aria-pressed={on} className={`switch ${on?'on':''}`} onClick={()=>set(!on)}><i/></button></div>}

import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const roles = [
  ['super_admin','سوبر أدمن','صلاحيات كاملة على لوحة التحكم'],
  ['orders_manager','مدير طلبات','إدارة الطلبات والشحن'],
  ['products_manager','مدير منتجات','المنتجات والأقسام والمخزون'],
  ['marketing_manager','مدير تسويق','العروض والحملات والمحتوى'],
  ['support','دعم عملاء','العملاء وخدمة العملاء'],
  ['accountant','محاسب','المدفوعات والتقارير المالية'],
  ['cashier','كاشير','الطلبات والمدفوعات'],
  ['viewer','مشاهدة فقط','قراءة البيانات بدون تعديل'],
];

const modules = [
  ['dashboard','الرئيسية'],['orders','الطلبات'],['products','المنتجات'],['customers','العملاء'],
  ['marketing','التسويق'],['merchants','التجار'],['staff','الفريق والصلاحيات'],['studio','استديو MYBRAND'],
  ['payments','طرق الدفع'],['reports','التقارير'],['settings','الإعدادات']
];
const actions = [['view','مشاهدة'],['create','إضافة'],['edit','تعديل'],['delete','حذف']];
const emptyPermissions = () => Object.fromEntries(modules.map(([m]) => [m, {view:false,create:false,edit:false,delete:false}]));

export default function StaffPage(){
  const [staff,setStaff]=useState([]); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({name:'',email:'',phone:'',role:'viewer'}); const [permissions,setPermissions]=useState(emptyPermissions());
  const [query,setQuery]=useState(''); const [status,setStatus]=useState('');

  useEffect(()=>{ let alive=true; api.get('/staff').then(({data})=>alive&&setStaff(data.staff||data.users||[])).catch(()=>alive&&setStaff([])).finally(()=>alive&&setLoading(false)); return()=>{alive=false}; },[]);
  useEffect(()=>{
    const next=emptyPermissions();
    if(form.role==='super_admin') modules.forEach(([m])=>actions.forEach(([a])=>next[m][a]=true));
    else if(form.role==='viewer') modules.forEach(([m])=>next[m].view=true);
    else {
      const map={orders_manager:['orders'],products_manager:['products'],marketing_manager:['marketing','studio'],support:['customers'],accountant:['payments','reports'],cashier:['orders','payments']};
      (map[form.role]||[]).forEach(m=>{next[m].view=true;next[m].create=true;next[m].edit=true});
    }
    setPermissions(next);
  },[form.role]);

  const visible=useMemo(()=>{const q=query.trim().toLowerCase();return staff.filter(s=>!q||[s.name,s.email,s.role].filter(Boolean).join(' ').toLowerCase().includes(q))},[staff,query]);
  const setPerm=(m,a,v)=>setPermissions(p=>({...p,[m]:{...p[m],[a]:v}}));
  const save=async()=>{
    if(!form.name||!form.email)return setStatus('اكتب اسم المسئول والبريد الإلكتروني');
    setSaving(true);setStatus('');
    try{await api.post('/staff',{...form,permissions});setStatus('تمت إضافة المسئول بنجاح');setForm({name:'',email:'',phone:'',role:'viewer'});const {data}=await api.get('/staff');setStaff(data.staff||data.users||[])}
    catch(e){setStatus(e?.response?.data?.message||'تعذر حفظ المسئول. تأكد من إعداد مسار /staff في الـ API.')}finally{setSaving(false)}
  };

  return <div className="staff-page" dir="rtl"><style>{css}</style>
    <div className="head"><div><div className="crumb">الفريق والشركاء <b>الفريق والصلاحيات</b></div><h1>إضافة مسئول وإدارة الصلاحيات</h1><p>أنشئ حسابات فريق MYBRAND وحدد الدور والصلاحيات بدقة لكل قسم</p></div></div>
    <div className="layout-grid">
      <section>
        <div className="card"><h3>بيانات المسئول</h3><div className="fields"><label>الاسم<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="مثال: أحمد محمد"/></label><label>البريد الإلكتروني<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="name@mybrand.com"/></label><label>رقم التواصل <span>(اختياري)</span><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="01xxxxxxxxx"/></label></div></div>
        <div className="card"><h3>اختيار الدور</h3><div className="roles">{roles.map(([id,title,desc])=><button type="button" key={id} className={form.role===id?'role selected':'role'} onClick={()=>setForm({...form,role:id})}><b>{title}</b><span>{desc}</span></button>)}</div></div>
        <div className="card"><div className="section-title"><h3>مصفوفة الصلاحيات</h3><span>يمكن تعديلها يدويًا بعد اختيار الدور</span></div><div className="matrix"><div className="matrix-head"><b>القسم</b>{actions.map(a=><b key={a[0]}>{a[1]}</b>)}</div>{modules.map(([m,label])=><div className="matrix-row" key={m}><span>{label}</span>{actions.map(([a])=><label key={a} className="check"><input type="checkbox" checked={!!permissions[m]?.[a]} onChange={e=>setPerm(m,a,e.target.checked)}/><i/></label>)}</div>)}</div></div>
        <div className="actions"><button className="ghost" onClick={()=>setForm({name:'',email:'',phone:'',role:'viewer'})}>إلغاء</button><button className="primary" disabled={saving} onClick={save}>{saving?'جارٍ الحفظ...':'إضافة المسئول'}</button></div>{status&&<div className="notice">{status}</div>}
      </section>
      <aside><div className="card"><div className="list-head"><div><h3>الفريق الحالي</h3><span>{staff.length} مسئول</span></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="بحث..."/></div><div className="staff-list">{loading?<div className="empty">جارٍ التحميل...</div>:visible.map(s=><div className="staff-item" key={s._id||s.id||s.email}><div className="avatar">{(s.name||'م').slice(0,1)}</div><div className="person"><b>{s.name||'بدون اسم'}</b><span>{s.email||'—'}</span></div><em>{roles.find(r=>r[0]===s.role)?.[1]||s.role||'مشاهدة فقط'}</em></div>)}{!loading&&!visible.length&&<div className="empty">لا يوجد مسئولون مطابقون</div>}</div></div></aside>
    </div>
  </div>
}

const css=`.staff-page{font-family:Tajawal,sans-serif;background:#F6F6F8;min-height:100%;color:#111;padding:24px 26px 55px}.head{margin-bottom:22px}.crumb{font-size:12px;color:#8A8A97;margin-bottom:6px}.crumb b{color:#111;margin-right:7px}.head h1{font:800 21px Cairo;margin:0}.head p{font-size:12.5px;color:#8A8A97;margin-top:4px}.layout-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:18px}.card{background:#fff;border:1px solid #E7E7EC;border-radius:14px;padding:20px;margin-bottom:18px}.card h3{font:800 14px Cairo;margin:0 0 15px}.fields{display:grid;grid-template-columns:repeat(2,1fr);gap:13px}.fields label{font-size:12px;font-weight:700}.fields label:last-child{grid-column:1/-1}.fields span,.section-title span{font-weight:400;color:#8A8A97}.fields input,.list-head input{display:block;width:100%;margin-top:7px;border:1.5px solid #E7E7EC;border-radius:9px;padding:11px 12px;outline:0;font:13px Tajawal}.roles{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.role{border:1px solid #E7E7EC;background:#fff;text-align:right;border-radius:11px;padding:12px;min-height:75px;cursor:pointer}.role.selected{border-color:#FF5A28;box-shadow:0 0 0 2px rgba(255,90,40,.09)}.role b,.role span{display:block}.role b{font-size:12px}.role span{font-size:10px;color:#8A8A97;margin-top:4px;line-height:1.5}.section-title{display:flex;justify-content:space-between;align-items:center}.matrix{border:1px solid #E7E7EC;border-radius:10px;overflow:hidden}.matrix-head,.matrix-row{display:grid;grid-template-columns:1fr repeat(4,85px);align-items:center}.matrix-head{background:#FAFAFB;color:#8A8A97;font-size:10.5px;padding:10px 12px}.matrix-row{border-top:1px solid #E7E7EC;padding:10px 12px;font-size:11.5px}.check{text-align:center;cursor:pointer}.check input{display:none}.check i{display:inline-block;width:19px;height:19px;border:1px solid #D7D7DF;border-radius:5px;position:relative}.check input:checked+i{background:linear-gradient(135deg,#FF3B30,#FF6A00);border-color:transparent}.check input:checked+i:after{content:'✓';position:absolute;color:#fff;font:bold 13px Arial;left:3px;top:1px}.actions{display:flex;justify-content:flex-end;gap:9px}.ghost,.primary{border-radius:9px;padding:11px 18px;font:700 12.5px Tajawal;cursor:pointer}.ghost{background:#fff;border:1px solid #E7E7EC}.primary{border:0;background:linear-gradient(100deg,#FF3B30,#FF6A00);color:#fff}.primary:disabled{opacity:.6}.notice{margin-top:12px;background:#fff;border:1px solid #E7E7EC;border-radius:9px;padding:11px;font-size:12px}.list-head{display:flex;align-items:flex-start;gap:10px;justify-content:space-between}.list-head h3{margin-bottom:2px}.list-head span{font-size:10px;color:#8A8A97}.list-head input{width:120px;margin:0;padding:8px}.staff-list{margin-top:14px}.staff-item{display:flex;align-items:center;gap:9px;padding:11px 0;border-top:1px solid #E7E7EC}.avatar{width:35px;height:35px;border-radius:10px;background:#F0F0F3;display:flex;align-items:center;justify-content:center;font:800 13px Cairo;flex-shrink:0}.person{min-width:0;flex:1}.person b,.person span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.person b{font-size:11.5px}.person span{font-size:9.5px;color:#8A8A97;margin-top:2px}.staff-item em{font-style:normal;font-size:9px;background:#F6F6F8;border-radius:999px;padding:4px 7px;white-space:nowrap}.empty{text-align:center;color:#8A8A97;font-size:11px;padding:25px 5px}@media(max-width:1000px){.layout-grid{grid-template-columns:1fr}.roles{grid-template-columns:repeat(2,1fr)}}`;

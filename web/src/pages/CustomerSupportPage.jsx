import React,{useState}from'react';
import{Link,useParams}from'react-router-dom';
import api from'../api/client';
import CustomerChat from'../components/CustomerChat';

const TYPES={
 shipping:{title:'مشكلة في الشحن',desc:'تأخر الشحنة، لم تصل، عنوان التوصيل أو مشكلة مع مندوب الشحن.',icon:'🚚'},
 payment:{title:'مشكلة في الدفع',desc:'عملية دفع لم تكتمل، خصم غير واضح أو مشكلة في إتمام الدفع.',icon:'💳'},
 complaint:{title:'شكوى أو مشكلة',desc:'أرسل تفاصيل أي مشكلة واجهتك مع المتجر أو الطلب.',icon:'⚠️'},
 product:{title:'استفسار عن منتج',desc:'اسأل عن السعر، المقاس، اللون، التوفر أو تفاصيل المنتج.',icon:'🛍️'},
 order:{title:'مساعدة بخصوص طلب',desc:'تحدث مع خدمة العملاء بخصوص طلبك وتفاصيله.',icon:'📦'}
};

export default function CustomerSupportPage(){
 const{type='complaint'}=useParams();
 const cfg=TYPES[type]||TYPES.complaint;
 const[orderNumber,setOrderNumber]=useState('');
 const[details,setDetails]=useState('');
 const[sent,setSent]=useState(false);
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState('');
 const submit=async e=>{
  e.preventDefault();
  if(!details.trim())return;
  setBusy(true);setError('');
  try{
   let visitorId=localStorage.getItem('mybrand_chat_visitor_id');
   if(!visitorId){visitorId=`visitor_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;localStorage.setItem('mybrand_chat_visitor_id',visitorId)}
   await api.post('/chat/message',{visitorId,message:`${cfg.title}\n${orderNumber.trim()?`رقم الطلب: ${orderNumber.trim()}\n`:''}تفاصيل العميل: ${details.trim()}`});
   await api.post('/chat/request-agent',{visitorId});
   setSent(true);
  }catch(err){setError(err.response?.data?.message||'تعذر إرسال طلب الخدمة');}
  finally{setBusy(false);}
 };
 return <main dir="rtl" style={s.page}>
  <div style={s.card}>
   <Link to="/account" style={s.back}>← العودة إلى الحساب</Link>
   <div style={s.hero}><div style={s.heroIcon}>{cfg.icon}</div><div><span style={s.kicker}>MYBRAND CARE</span><h1 style={s.h1}>{cfg.title}</h1><p style={s.desc}>{cfg.desc}</p></div></div>
   {!sent?<form onSubmit={submit} style={s.form}>
    <label style={s.label}>رقم الطلب <span>(اختياري لكن يُفضّل للطلبات)</span><input dir="ltr" style={{...s.input,textAlign:"left"}} value={orderNumber} onChange={e=>setOrderNumber(e.target.value)} placeholder="مثال: MB-10025" /></label>
    <label style={s.label}>التفاصيل<textarea style={{...s.input,minHeight:130,resize:'vertical'}} value={details} onChange={e=>setDetails(e.target.value)} placeholder="اكتب المشكلة أو طلبك بالتفصيل..." required/></label>
    {error&&<div style={s.error}>{error}</div>}
    <button disabled={busy||!details.trim()} style={s.button}>{busy?'جارٍ الإرسال...':'إرسال إلى خدمة العملاء'}</button>
   </form>:<div style={s.success}><div style={{fontSize:34}}>✅</div><h2>تم إرسال طلبك</h2><p>وصلت التفاصيل إلى خدمة العملاء، ويمكنك متابعة الرد مباشرة داخل المحادثة بالأسفل.</p></div>}
   <div style={s.chatTitle}>المحادثة مع خدمة العملاء</div>
   <CustomerChat embedded/>
  </div>
 </main>
}

const s={page:{minHeight:'100vh',background:'#f6f6f6',padding:'18px 12px 50px',fontFamily:'Tajawal,Arial,sans-serif',color:'#111'},card:{maxWidth:620,margin:'0 auto',background:'#fff',border:'1px solid #e6e6e6',borderRadius:18,padding:16},back:{display:'inline-block',textDecoration:'none',color:'#777',fontSize:12,marginBottom:14},hero:{display:'flex',gap:12,alignItems:'flex-start',padding:'14px 0 8px'},heroIcon:{width:46,height:46,borderRadius:13,display:'grid',placeItems:'center',background:'#111',fontSize:22,flex:'none'},kicker:{fontSize:9,fontWeight:900,letterSpacing:'.14em',color:'#b28a24'},h1:{margin:'2px 0 4px',font:'800 20px Cairo,Arial'},desc:{margin:0,color:'#777',fontSize:10.5,lineHeight:1.8},form:{display:'grid',gap:12,marginTop:12},label:{display:'grid',gap:6,fontSize:11,fontWeight:800},labelSpan:{fontWeight:500},input:{width:'100%',border:'1px solid #ddd',borderRadius:10,padding:'11px 12px',font:'12px Tajawal,Arial',outline:'none',background:'#fff'},button:{border:0,borderRadius:10,padding:12,background:'#111',color:'#fff',fontWeight:800,cursor:'pointer'},error:{background:'#FEF2F2',color:'#991B1B',border:'1px solid #FECACA',borderRadius:10,padding:10,fontSize:10},success:{marginTop:12,padding:18,borderRadius:14,background:'#F0FDF4',border:'1px solid #BBF7D0',textAlign:'center'},chatTitle:{font:'800 14px Cairo,Arial',margin:'18px 0 10px'},}
import React,{useEffect,useMemo,useState}from'react';
import{useLocation}from'react-router-dom';
import{useCart}from'../context/CartContext';
import api from'../api/client';

const money=v=>Number(v||0).toLocaleString('ar-EG');

export default function LoyaltyCheckoutBar(){
 const location=useLocation();
 const{items,discount}=useCart();
 const buyNow=location.state?.buyNow||null;
 const selectedItems=Array.isArray(location.state?.selectedItems)?location.state.selectedItems:null;
 const checkoutItems=useMemo(()=>buyNow?[{...buyNow,quantity:Number(buyNow.quantity||1)}]:selectedItems?selectedItems.map(item=>({...item,quantity:Number(item.quantity||1)})):items,[buyNow,selectedItems,items]);
 const[wallet,setWallet]=useState(null),[points,setPoints]=useState(()=>Number(localStorage.getItem('mybrand_loyalty_points')||0)),[message,setMessage]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{if(location.pathname!=='/checkout')return;let active=true;const reqId=api.interceptors.request.use(config=>{const isCreateOrder=String(config.url||'').replace(/\/$/,'').endsWith('/orders')&&String(config.method||'get').toLowerCase()==='post';if(isCreateOrder){const selected=Math.max(0,Math.floor(Number(localStorage.getItem('mybrand_loyalty_points')||0)));if(selected>0){let data=config.data;try{if(typeof data==='string')data=JSON.parse(data)}catch{}config.data={...(data&&typeof data==='object'?data:{}),loyaltyPoints:selected};}}return config;});const resId=api.interceptors.response.use(response=>{const isCreateOrder=String(response.config?.url||'').replace(/\/$/,'').endsWith('/orders')&&String(response.config?.method||'get').toLowerCase()==='post';if(isCreateOrder&&response.status>=200&&response.status<300){localStorage.removeItem('mybrand_loyalty_points');window.dispatchEvent(new Event('mybrand:loyalty-cleared'));}return response;});api.get('/loyalty').then(({data})=>{if(!active)return;setWallet(data);setLoading(false)}).catch(()=>{if(active)setLoading(false)});const clear=()=>{setPoints(0);localStorage.removeItem('mybrand_loyalty_points')};window.addEventListener('mybrand:loyalty-cleared',clear);return()=>{active=false;api.interceptors.request.eject(reqId);api.interceptors.response.eject(resId);window.removeEventListener('mybrand:loyalty-cleared',clear)}},[location.pathname]);
 const subtotal=useMemo(()=>checkoutItems.reduce((sum,item)=>sum+Number(item.price||0)*Number(item.quantity||0),0),[checkoutItems]);
 const cartDiscount=buyNow||selectedItems?0:Number(discount||0);
 const eligible=Math.max(0,subtotal-cartDiscount);
 const cfg=wallet?.config||{};
 const pointValue=Number(cfg.pointValue||0.1);
 const maxByPercent=pointValue&&cfg.maxRedeemPercent?Math.floor((eligible*Number(cfg.maxRedeemPercent)/100)/pointValue):0;
 const maxPoints=Math.max(0,Math.min(Number(wallet?.points||0),maxByPercent));
 const usablePoints=Math.max(0,Math.min(Number(points||0),maxPoints));
 const discountValue=Math.round(usablePoints*pointValue*100)/100;
 const paymentMerchandiseTotal=Math.max(0,Math.round((eligible-discountValue)*100)/100);
 useEffect(()=>{if(points>maxPoints)setPoints(maxPoints)},[points,maxPoints]);
 const choose=value=>{const next=Math.max(0,Math.min(Math.floor(Number(value)||0),maxPoints));setPoints(next)};
 const apply=()=>{const value=Math.max(0,Math.min(Math.floor(Number(points||0)),maxPoints));setPoints(value);localStorage.setItem('mybrand_loyalty_points',String(value));setMessage(value?`تم تطبيق ${money(value)} نقطة وسيتم خصم ${money(value*pointValue)} ج.م فعليًا من مبلغ الدفع عند تأكيد الطلب`:'تم إلغاء استخدام النقاط لهذا الطلب')};
 const useMax=()=>{const value=maxPoints;setPoints(value);localStorage.setItem('mybrand_loyalty_points',String(value));setMessage(value?`تم تطبيق الحد الأقصى: ${money(value)} نقطة — خصم فعلي ${money(value*pointValue)} ج.م عند إتمام الدفع`:'لا يمكن استخدام نقاط على هذا الطلب')};
 if(location.pathname!=='/checkout'||loading||!wallet||!cfg.enabled)return null;
 return <section className="mybrand-loyalty-checkout" dir="rtl"><div className="ly-head"><div><strong>⭐ نقاط الولاء</strong><span>رصيدك: {money(wallet.points)} نقطة</span></div><span className="ly-value">1 نقطة = {cfg.pointValue} ج.م</span></div><div className="ly-body"><p>استخدم نقاطك وسيتم احتسابها كخصم حقيقي في إجمالي الدفع، وليس مجرد خصم شكلي.</p><div className="ly-row"><input type="number" min="0" max={maxPoints} step="1" value={usablePoints} onChange={e=>choose(e.target.value)} placeholder="عدد النقاط"/><button type="button" onClick={useMax} disabled={!maxPoints}>استخدم الحد الأقصى</button><button type="button" className="ly-apply" onClick={apply}>تطبيق</button></div><div className="ly-preview">الحد الأقصى لهذا الطلب: <b>{money(maxPoints)} نقطة</b>{usablePoints>0&&<span> · الخصم الفعلي: <b>-{money(discountValue)} ج.م</b> · بعد خصم النقاط: <b>{money(paymentMerchandiseTotal)} ج.م</b></span>}</div>{message&&<div className="ly-msg">✓ {message}</div>}</div><style>{css}</style></section>;
}
const css=`.mybrand-loyalty-checkout{width:min(92%,700px);margin:14px auto 8px;background:#fff;border:1px solid #eadcae;border-radius:14px;box-shadow:0 8px 25px rgba(37,52,81,.07);overflow:hidden}.ly-head{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:13px 14px;background:linear-gradient(135deg,#fff9ea,#fff);border-bottom:1px solid #f0e4bd}.ly-head strong{display:block;font-family:Cairo;font-size:13px;color:#253451}.ly-head span{display:block;color:#777;font-size:10px;margin-top:3px}.ly-head .ly-value{color:#9a7b1d;margin:0;white-space:nowrap;font-weight:800}.ly-body{padding:12px 14px}.ly-body p{margin:0 0 9px;color:#64748b;font-size:10.5px}.ly-row{display:flex;gap:7px}.ly-row input{min-width:0;flex:1;padding:10px 11px;border:1px solid #dfe4eb;border-radius:9px;font:700 12px Tajawal;outline:none}.ly-row button{border:1px solid #e3d4a2;background:#fff9ea;color:#765d1d;border-radius:9px;padding:0 11px;font:800 10px Tajawal}.ly-row .ly-apply{background:#e60023;color:#fff;border-color:#d8b866}.ly-row button:disabled{opacity:.45}.ly-preview{margin-top:8px;font-size:10px;color:#777;line-height:1.8}.ly-preview b{color:#253451}.ly-msg{margin-top:8px;padding:8px 9px;border-radius:8px;background:#f5f8fb;color:#253451;font-size:10px;line-height:1.8}@media(max-width:520px){.ly-row{display:grid;grid-template-columns:1fr 1fr}.ly-row input{grid-column:1/-1}.ly-row button{min-height:34px}.ly-head{align-items:flex-start}.ly-head .ly-value{font-size:9px}}`;

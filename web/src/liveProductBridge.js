import api from './api/client';

const STYLE_ID = 'mybrand-live-product-bridge-style';
const customerSources = new Map();
const customerFallbackTimers = new Map();
const trendSources = new Map();
const trendFallbackTimers = new Map();

const addStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .live-product-picker{display:grid;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid #e5e7eb}
    .live-product-picker label{font-size:12px;font-weight:900;color:#111827}
    .live-product-picker select{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #dbe2ea;border-radius:12px;background:#fff;color:#111827;font-weight:700}
    .live-product-status{font-size:11px;color:#64748b;min-height:15px}
    .live-product-card{display:grid;grid-template-columns:56px minmax(0,1fr);grid-template-rows:auto auto;align-items:center;gap:7px 10px;margin:0;padding:10px;border-radius:16px;background:rgba(255,255,255,.96);border:1px solid rgba(255,255,255,.35);color:#111;box-shadow:0 12px 34px rgba(0,0,0,.28);backdrop-filter:blur(14px);pointer-events:auto}
    .live-product-card img,.live-product-card .image-placeholder{width:56px;height:56px;object-fit:cover;border-radius:11px;background:#eef2f7;display:grid;place-items:center;font-size:10px;font-weight:900;grid-column:1;grid-row:1}
    .live-product-card .info{min-width:0;grid-column:2;grid-row:1}.live-product-card .name{font-size:12px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.live-product-card .price{font-size:12px;font-weight:900;margin-top:3px;color:#e60023}.live-product-card .compare{font-size:10px;color:#64748b;margin-inline-start:6px}.live-product-card a{grid-column:1 / -1;grid-row:2;display:flex;align-items:center;justify-content:center;min-height:36px;border-radius:11px;background:#e60023;color:#fff;text-decoration:none;font-size:11px;font-weight:900}
    .trend-app .live-single-view{width:100%!important;height:min(780px,calc(100dvh - 250px))!important;min-height:620px!important;max-height:780px!important;background:#05060a!important;overflow:hidden!important;position:relative!important}
    .trend-app .live-single-view iframe{display:block!important;width:100%!important;height:100%!important;min-height:620px!important;border:0!important;background:#05060a!important}
    .trend-app .trend-live-product{position:absolute;right:16px;bottom:150px;z-index:40;max-width:min(84vw,360px);pointer-events:auto}
    .trend-app .trend-live-product .live-product-card{margin:0}
    .mybrand-live .viewer-bottom .live-product-card{position:absolute!important;right:12px!important;bottom:112px!important;width:min(280px,calc(100vw - 92px))!important;z-index:40!important}
    @media(max-width:600px){
      .trend-app .live-single-view{height:680px!important;min-height:680px!important;max-height:680px!important}
      .trend-app .live-single-view iframe{height:680px!important;min-height:680px!important}
      .mybrand-live .viewer-bottom .live-product-card{right:8px!important;bottom:104px!important;width:220px!important;max-width:calc(100vw - 80px)!important}
    }
  `;
  document.head.appendChild(style);
};

async function loadMineProducts(){
  try{
    const {data}=await api.get('/products/mine');
    return Array.isArray(data?.products) ? data.products : [];
  }catch{return [];}
}

async function loadMineStream(){
  try{const {data}=await api.get('/live/mine');return data?.stream||null;}catch{return null;}
}

async function currentProduct(streamId){
  try{const {data}=await api.get(`/live/${streamId}/product`);return data?.product||null;}catch{return null;}
}

function productHref(product){return `/products/${encodeURIComponent(product?.slug||product?.id||product?._id||'')}`;}

function removeDuplicateViewerProducts(host){
  document.querySelectorAll('.live-product-card-rebuild').forEach((node)=>node.remove());
  document.querySelectorAll('.mybrand-live [data-live-buy-now], .mybrand-live button, .mybrand-live a').forEach((node)=>{
    if(node.closest('.live-product-card')) return;
    const text=(node.textContent||'').replace(/\s+/g,' ').trim();
    if(text.includes('اشترِ الآن') || text.includes('اشترى الآن') || text.toLowerCase().includes('buy now')) node.remove();
  });
  if(host){
    host.querySelectorAll('.live-product-card').forEach((node,index)=>{if(index>0)node.remove();});
  }
}

function renderCustomerProduct(host,product){
  removeDuplicateViewerProducts(host);
  let card=host.querySelector('.live-product-card');
  if(!product){card?.remove();return;}
  if(!card){card=document.createElement('div');card.className='live-product-card';host.appendChild(card);}
  const image=product.images?.[0]||'';
  const name=product.nameAr||product.nameEn||'المنتج المعروض';
  const price=Number(product.price||0).toLocaleString('ar-EG');
  const compare=Number(product.compareAtPrice||0);
  card.innerHTML=`${image?`<img src="${image}" alt="" loading="eager" />`:'<div class="image-placeholder">MYBRAND</div>'}<div class="info"><div class="name"></div><div class="price"></div></div><a href="${productHref(product)}" data-live-buy-now>🛒 اشترِ الآن</a>`;
  card.querySelector('.name').textContent=name;
  const priceNode=card.querySelector('.price');
  priceNode.textContent=`${price} ج.م`;
  if(compare>Number(product.price||0)){
    const compareNode=document.createElement('del');compareNode.className='compare';compareNode.textContent=`${compare.toLocaleString('ar-EG')} ج.م`;priceNode.appendChild(compareNode);
  }
}

function stopCustomerChannel(streamId){
  customerSources.get(streamId)?.close();customerSources.delete(streamId);
  if(customerFallbackTimers.has(streamId))clearInterval(customerFallbackTimers.get(streamId));
  customerFallbackTimers.delete(streamId);
}

function startProductChannel(host,streamId){
  stopCustomerChannel(streamId);
  const initial=currentProduct(streamId).then((product)=>renderCustomerProduct(host,product));
  const base=String(api.defaults.baseURL||'').replace(/\/$/,'');
  let source;
  try{
    source=new EventSource(`${base}/live/${encodeURIComponent(streamId)}/product/events`);
    source.addEventListener('product',(event)=>{try{renderCustomerProduct(host,JSON.parse(event.data)?.product||null);}catch{}});
    source.onerror=()=>{
      source?.close();
      if(customerSources.get(streamId)===source)customerSources.delete(streamId);
      if(!customerFallbackTimers.has(streamId)){
        const timer=setInterval(async()=>renderCustomerProduct(host,await currentProduct(streamId)),3000);
        customerFallbackTimers.set(streamId,timer);
      }
    };
    customerSources.set(streamId,source);
  }catch{
    if(!customerFallbackTimers.has(streamId)){
      const timer=setInterval(async()=>renderCustomerProduct(host,await currentProduct(streamId)),3000);
      customerFallbackTimers.set(streamId,timer);
    }
  }
  return initial;
}

async function mountStudioPicker(panel){
  if(panel.querySelector('.live-product-picker'))return;
  const [products,stream]=await Promise.all([loadMineProducts(),loadMineStream()]);
  const wrap=document.createElement('div');wrap.className='live-product-picker';
  wrap.innerHTML='<label>المنتج المعروض أثناء البث</label><select><option value="">بدون منتج</option></select><div class="live-product-status"></div>';
  const select=wrap.querySelector('select');const status=wrap.querySelector('.live-product-status');
  for(const product of products){
    const id=product?._id||product?.id;if(!id)continue;
    const option=document.createElement('option');option.value=String(id);option.textContent=`${product.nameAr||product.nameEn||'منتج'} — ${product.price??''} ج.م`;
    if(stream?.productId&&String(stream.productId)===option.value)option.selected=true;
    select.appendChild(option);
  }
  panel.insertBefore(wrap,panel.querySelector('button')||null);
  select.addEventListener('change',async()=>{
    const mine=await loadMineStream();if(!mine?.id){status.textContent='ابدأ البث أولًا ثم اختر المنتج.';return;}
    select.disabled=true;status.textContent='جارٍ تحديث المنتج...';
    try{await api.put(`/live/${mine.id}/product`,{productId:select.value||null});status.textContent=select.value?'تم تغيير المنتج لجميع المشاهدين.':'تم إخفاء بطاقة المنتج.';}
    catch(error){status.textContent=error?.response?.data?.message||'تعذر تغيير المنتج.';}
    finally{select.disabled=false;}
  });
}

function renderTrendProduct(card,product){
  let host=card.querySelector('.trend-live-product');
  if(!product){host?.remove();return;}
  if(!host){host=document.createElement('div');host.className='trend-live-product';card.appendChild(host);}
  renderCustomerProduct(host,product);
}

async function mountCustomerProduct(){
  if(!window.location.pathname.startsWith('/live'))return;
  const host=document.querySelector('.mybrand-live .viewer-bottom');
  if(!host)return;
  removeDuplicateViewerProducts(host);
  if(host.dataset.liveProductBridge==='1')return;
  host.dataset.liveProductBridge='1';
  const initial=await api.get('/live/active').catch(()=>({data:{streams:[]}}));
  const stream=initial.data?.streams?.[0]||initial.data?.stream||null;
  if(!stream?.id)return;
  await startProductChannel(host,String(stream.id));
}

function getTrendStreamId(card){
  const direct=card.dataset.streamId;if(direct)return String(direct);
  const link=card.closest('a[href*="/live/"]')||(card.matches('a[href*="/live/"]')?card:null);
  const match=(link?.getAttribute('href')||'').match(/\/live\/([^/?#]+)/);
  return match?.[1]||'';
}

async function mountTrendProducts(){
  const cards=[...document.querySelectorAll('.trend-app .trend-live-card[data-stream-id], .trend-app .live-card, .trend-app .live-card[data-stream-id]')];
  const active=new Set();
  for(const card of cards){
    const streamId=getTrendStreamId(card);if(!streamId)continue;active.add(streamId);
    if(trendSources.has(streamId)||trendFallbackTimers.has(streamId))continue;
    const host=document.createElement('div');host.className='trend-live-product';card.appendChild(host);
    const base=String(api.defaults.baseURL||'').replace(/\/$/,'');
    try{
      const source=new EventSource(`${base}/live/${encodeURIComponent(streamId)}/product/events`);
      source.addEventListener('product',(event)=>{try{renderCustomerProduct(host,JSON.parse(event.data)?.product||null);}catch{}});
      source.onerror=()=>{source?.close();trendSources.delete(streamId);if(!trendFallbackTimers.has(streamId)){const timer=setInterval(async()=>renderCustomerProduct(host,await currentProduct(streamId)),3000);trendFallbackTimers.set(streamId,timer);}};
      trendSources.set(streamId,source);
    }catch{
      const timer=setInterval(async()=>renderCustomerProduct(host,await currentProduct(streamId)),3000);trendFallbackTimers.set(streamId,timer);
    }
    renderCustomerProduct(host,await currentProduct(streamId));
  }
  for(const [streamId,source] of trendSources){if(!active.has(streamId)){source.close();trendSources.delete(streamId);}}
  for(const [streamId,timer] of trendFallbackTimers){if(!active.has(streamId)){clearInterval(timer);trendFallbackTimers.delete(streamId);}}
}

function scan(){
  addStyles();
  const studio=document.querySelector('.mybrand-live .studio .panel');
  if(studio)mountStudioPicker(studio);
  mountCustomerProduct();
  mountTrendProducts();
}

scan();
new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('beforeunload',()=>{
  customerSources.forEach((source)=>source.close());
  trendSources.forEach((source)=>source.close());
  customerFallbackTimers.forEach((timer)=>clearInterval(timer));
  trendFallbackTimers.forEach((timer)=>clearInterval(timer));
});

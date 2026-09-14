import api from './api/client';

const STYLE_ID = 'mybrand-admin-live-product-bridge-style';
let observer;
let mountedPanel;
let syncTimer;

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .mybrand-admin-live-product{display:grid;gap:9px;margin-top:18px;padding-top:16px;border-top:1px solid #e5e7eb}
    .mybrand-admin-live-product__head{display:flex;justify-content:space-between;align-items:center;gap:10px}
    .mybrand-admin-live-product__head strong{font-size:13px;color:#111827}
    .mybrand-admin-live-product__live{font-size:10px;font-weight:900;color:#16a34a;background:#f0fdf4;padding:5px 8px;border-radius:999px}
    .mybrand-admin-live-product select{width:100%;box-sizing:border-box;border:1px solid #dbe2ea;border-radius:12px;background:#f8fafc;color:#111827;padding:12px;font-weight:800;outline:none}
    .mybrand-admin-live-product select:disabled{opacity:.65;cursor:wait}
    .mybrand-admin-live-product__status{min-height:16px;font-size:11px;color:#64748b;line-height:1.6}
    .mybrand-admin-live-product__preview{display:flex;align-items:center;gap:10px;padding:9px;border-radius:14px;background:#f8fafc;border:1px solid #eef2f7}
    .mybrand-admin-live-product__preview img,.mybrand-admin-live-product__placeholder{width:54px;height:54px;flex:0 0 54px;border-radius:11px;object-fit:cover;background:#e5e7eb;display:grid;place-items:center;font-size:10px;font-weight:900}
    .mybrand-admin-live-product__preview div{min-width:0}
    .mybrand-admin-live-product__preview b{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mybrand-admin-live-product__preview span{display:block;margin-top:3px;font-size:11px;color:#e60023;font-weight:900}
    .mybrand-admin-live-product__clear{border:1px solid #fecdd3;background:#fff1f2;color:#be123c;border-radius:10px;padding:9px 11px;font-weight:900;cursor:pointer}
    .mybrand-admin-live-product__clear:disabled{opacity:.55;cursor:not-allowed}
  `;
  document.head.appendChild(style);
}

function idOf(value) { return String(value?._id || value?.id || ''); }
function nameOf(product) { return product?.nameAr || product?.nameEn || 'منتج بدون اسم'; }
function imageOf(product) { return Array.isArray(product?.images) ? product.images[0] : (product?.image || ''); }

async function loadProducts() {
  try {
    const mine = await api.get('/products/mine');
    const products = Array.isArray(mine.data?.products) ? mine.data.products : [];
    return products.filter((product) => product?.isActive !== false && !['hidden', 'draft'].includes(product?.status));
  } catch {
    try {
      const admin = await api.get('/products/admin/all');
      const products = Array.isArray(admin.data?.products) ? admin.data.products : [];
      return products.filter((product) => product?.isActive !== false && !['hidden', 'draft'].includes(product?.status));
    } catch {
      return [];
    }
  }
}

async function loadMineStream() {
  try {
    const { data } = await api.get('/live/mine');
    return data?.stream || null;
  } catch {
    return null;
  }
}

async function loadCurrentProduct(streamId) {
  if (!streamId) return null;
  try {
    const { data } = await api.get(`/live/${streamId}/product`);
    return data?.product || null;
  } catch {
    return null;
  }
}

function renderPreview(host, product) {
  host.innerHTML = '';
  if (!product) return;
  const image = imageOf(product);
  const row = document.createElement('div');
  row.className = 'mybrand-admin-live-product__preview';
  if (image) {
    const img = document.createElement('img');
    img.src = image;
    img.alt = '';
    row.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'mybrand-admin-live-product__placeholder';
    placeholder.textContent = 'MYBRAND';
    row.appendChild(placeholder);
  }
  const body = document.createElement('div');
  const name = document.createElement('b');
  name.textContent = nameOf(product);
  const price = document.createElement('span');
  price.textContent = `${Number(product.price || 0).toLocaleString('ar-EG')} ج.م`;
  body.append(name, price);
  row.appendChild(body);
  host.appendChild(row);
}

async function mount(panel) {
  if (!panel || panel.querySelector('.mybrand-admin-live-product')) return;
  mountedPanel = panel;
  addStyles();

  const wrap = document.createElement('div');
  wrap.className = 'mybrand-admin-live-product';
  wrap.innerHTML = `
    <div class="mybrand-admin-live-product__head"><strong>🛍️ المنتج المعروض أثناء البث</strong><span class="mybrand-admin-live-product__live">تحكم مباشر</span></div>
    <select aria-label="المنتج المعروض أثناء البث"><option value="">بدون منتج</option></select>
    <div class="mybrand-admin-live-product__status"></div>
    <div class="mybrand-admin-live-product__preview-host"></div>
    <button type="button" class="mybrand-admin-live-product__clear">إخفاء المنتج عن المشاهدين</button>
  `;
  panel.appendChild(wrap);

  const select = wrap.querySelector('select');
  const status = wrap.querySelector('.mybrand-admin-live-product__status');
  const previewHost = wrap.querySelector('.mybrand-admin-live-product__preview-host');
  const clearButton = wrap.querySelector('.mybrand-admin-live-product__clear');
  let streamId = '';
  let busy = false;

  const products = await loadProducts();
  for (const product of products) {
    const productId = idOf(product);
    if (!productId) continue;
    const option = document.createElement('option');
    option.value = productId;
    option.textContent = `${nameOf(product)} — ${Number(product.price || 0).toLocaleString('ar-EG')} ج.م`;
    select.appendChild(option);
  }

  const sync = async () => {
    if (!panel.isConnected || busy) return;
    const stream = await loadMineStream();
    const nextStreamId = idOf(stream);
    if (!nextStreamId) {
      streamId = '';
      select.value = '';
      select.disabled = true;
      clearButton.disabled = true;
      renderPreview(previewHost, null);
      status.textContent = 'ابدأ البث أولًا، ثم اختر المنتج الذي تتحدث عنه.';
      return;
    }

    streamId = nextStreamId;
    select.disabled = false;
    clearButton.disabled = false;
    const product = await loadCurrentProduct(streamId);
    select.value = idOf(product);
    renderPreview(previewHost, product);
    status.textContent = product ? `المعروض الآن: ${nameOf(product)}` : 'لا يوجد منتج معروض حاليًا.';
  };

  const updateProduct = async (productId) => {
    if (!streamId || busy) return;
    busy = true;
    select.disabled = true;
    clearButton.disabled = true;
    status.textContent = 'جارٍ تحديث المنتج لجميع المشاهدين...';
    try {
      const { data } = await api.put(`/live/${streamId}/product`, { productId: productId || null });
      const product = data?.product || null;
      select.value = idOf(product);
      renderPreview(previewHost, product);
      status.textContent = product ? `تم عرض «${nameOf(product)}» لجميع المشاهدين.` : 'تم إخفاء بطاقة المنتج عن المشاهدين.';
    } catch (error) {
      status.textContent = error?.response?.data?.message || 'تعذر تغيير المنتج أثناء البث.';
    } finally {
      busy = false;
      await sync();
    }
  };

  select.addEventListener('change', () => updateProduct(select.value));
  clearButton.addEventListener('click', () => updateProduct(''));

  await sync();
  clearInterval(syncTimer);
  syncTimer = setInterval(sync, 2500);
}

function scan() {
  addStyles();
  const panel = document.querySelector('.my-live-grid .panel');
  if (panel) mount(panel);
  if (mountedPanel && !mountedPanel.isConnected) mountedPanel = null;
}

function init() {
  if (observer) return;
  observer = new MutationObserver(() => window.requestAnimationFrame(scan));
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scan();
}

init();
window.addEventListener('beforeunload', () => clearInterval(syncTimer));

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './splash-premium.css';
import './pages/AccountPageLayoutFix.css';
import './pages/CartPageYouth.css';
import './liveReelsViewer.css';
import './liveViewerFinalControls.css';
import './liveViewerFinalControls.js';
import './liveProductBridge.js';
import './trendLiveWebRTC.js';
import './liveTikTokImmersive.js';
import './liveMobilePlayback.js';
import './trendLiveComments.js';
import './storiesEnhancer.js';
import './storiesEnhancer.css';
import './trendLayoutFix.js';
import './liveNavStyle.css';
import './livePagePremium.css';

const ACCOUNT_ACTIONS={
  'وسائل الدفع':'/account/payments','العناوين المحفوظة':'/account/addresses','سجل المشاهدة':'/account/history','بطاقات الهدايا':'/account/gifts','نقاط الولاء':'/account/points','نقاطي':'/account/points','كوبوناتي':'/coupons','مركز المساعدة':'/account/help','سياسة الإرجاع والاستبدال':'/account/returns','الإعدادات':'/account/settings','إدارة العناوين':'/account/addresses'
};
function navigateAccount(path){window.history.pushState({},'',path);window.dispatchEvent(new PopStateEvent('popstate'));window.scrollTo({top:0,behavior:'smooth'});}
function installAccountActions(){const handler=(event)=>{const root=event.target.closest?.('.account-standalone');if(!root)return;const wallet=event.target.closest?.('.wallet-card');if(wallet){event.preventDefault();navigateAccount(wallet.classList.contains('points')?'/account/points':'/account/gifts');return;}const button=event.target.closest?.('button');if(!button)return;const aria=button.getAttribute('aria-label');if(aria==='الإعدادات'){event.preventDefault();navigateAccount('/account/settings');return;}const text=button.textContent.replace(/\s+/g,' ').trim();if(ACCOUNT_ACTIONS[text]){event.preventDefault();navigateAccount(ACCOUNT_ACTIONS[text]);return;}if(text.includes('استبدل نقاطك')){event.preventDefault();navigateAccount('/account/points');return;}if(text.includes('شحن رصيد')){event.preventDefault();navigateAccount('/account/gifts');return;}};document.addEventListener('click',handler);return()=>document.removeEventListener('click',handler);}
function SplashScreen({ onDone }){useEffect(()=>{const timer=window.setTimeout(onDone,3000);return()=>window.clearTimeout(timer)},[onDone]);return <div className="mybrand-splash" dir="ltr" aria-label="MYBRAND"><div className="mybrand-splash-glow glow-one"/><div className="mybrand-splash-glow glow-two"/><div className="mybrand-splash-logo" aria-hidden="true"><span className="logo-ring"><span className="logo-mark">M</span></span><span className="logo-word">MYBRAND</span></div><div className="mybrand-splash-line"><i/><i/><i/></div></div>;}
function Root(){const[ready,setReady]=useState(false);useEffect(()=>installAccountActions(),[]);return ready?<App/>:<SplashScreen onDone={()=>setReady(true)}/>;}
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><Root/></React.StrictMode>);
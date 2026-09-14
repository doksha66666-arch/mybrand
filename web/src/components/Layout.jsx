import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="site-layout" dir="rtl">
      <Header />
      <main className="site-main">
        <div className="site-main-inner">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}

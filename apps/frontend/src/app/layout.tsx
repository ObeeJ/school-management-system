import React from 'react';
import './globals.css';
import Providers from '../components/Providers';

export const metadata = {
  title: 'Scholaria | Multi-Tenant School Management Engine',
  description: 'Enterprise school management system with Row-Level Security, tenant isolation, and double-entry fee accounting.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#faf9f5] text-[#1c1b18] min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

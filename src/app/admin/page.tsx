import type { Metadata } from 'next';
import { AdminApp } from '@/components/admin/AdminApp';

export const metadata: Metadata = { title: 'Küche' };

// Vor dem ersten Bild: Küchen-Look setzen und merken, ob schon jemand angemeldet ist.
// So steht das Login sofort (statisch vorgerendert) und angemeldete sehen es nicht aufblitzen.
const boot = `(function(){var h=document.documentElement;h.classList.add('ember');try{if(localStorage.getItem('brace-kueche-theme')==='dunkel')h.classList.add('ember-dark');if(sessionStorage.getItem('brace.admin.session'))h.classList.add('k-session')}catch(e){}})()`;

export default function Page() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: boot }} />
      <AdminApp />
    </>
  );
}

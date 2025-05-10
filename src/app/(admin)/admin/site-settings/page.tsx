import React from 'react';
import Link from 'next/link';

const SiteSettingsPage = () => {








  
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Site Ayarları</h1>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Link href="/admin/homepage" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-2">Ana Sayfa</h3>
            <p className="text-gray-600">Ana sayfa ayarlarını düzenle.</p>
          </Link>
          <Link href="/admin/site-settings/paper-topics" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-2">Bildiri Konuları</h3>
            <p className="text-gray-600">Bildiri konularını ekle, düzenle veya kaldır.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SiteSettingsPage; 
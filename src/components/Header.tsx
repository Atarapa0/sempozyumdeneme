'use client';

import React from 'react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  // Debug log to check user role information
  useEffect(() => {
    if (user) {
      console.log('User role info:', { 
        role: user.role, 
        rolId: user.rolId,
        isReviewer: user.role === 'reviewer' || user.rolId === 3,
        isUser: user.role === 'user' && user.rolId !== 3
      });
    }
  }, [user]);

  // Kullanıcı rolünü doğru şekilde kontrol et
  const isAdmin = user?.role === 'admin';
  // Editör rolü User interface'inde tanımlanmamış, bu yüzden rolId ile kontrol ediyoruz
  const isEditor = user?.rolId === 5;
  const isReviewer = user?.role === 'reviewer' || user?.rolId === 3;
  const isUser = user?.role === 'user' && user?.rolId !== 3 && !isEditor;

  const handleLogout = () => {
    logout();
  };

  // Dropdown dışına tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAdminDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 shadow-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-black hover:text-blue-700 transition duration-200">
            Amasya Üniversitesi
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-black hover:text-blue-700 transition duration-200">
              Ana Sayfa
            </Link>
            <Link href="/about" className="text-black hover:text-blue-700 transition duration-200">
              Hakkımızda
            </Link>
            <Link href="/committees" className="text-black hover:text-blue-700 transition duration-200">
              Komiteler
            </Link>
            <Link href="/papers" className="text-black hover:text-blue-700 transition duration-200">
              Bildiriler
            </Link>
            <Link href="/program" className="text-black hover:text-blue-700 transition duration-200">
              Program
            </Link>
            <Link href="/accommodation" className="text-black hover:text-blue-700 transition duration-200">
              Konaklama
            </Link>
            <Link href="/journals" className="text-black hover:text-blue-700 transition duration-200">
              Dergiler
            </Link>
            <Link href="/publication-opportunities" className="text-black hover:text-blue-700 transition duration-200">
              Yayınlama İmkanları
            </Link>
            <Link href="/archive" className="text-black hover:text-blue-700 transition duration-200">
              Arşivler
            </Link>
            <Link href="/contact" className="text-black hover:text-blue-700 transition duration-200">
              İletişim
            </Link>
            
            {user ? (
              <div className="relative ml-4" ref={dropdownRef}>
                <button 
                  onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                  className="text-black hover:text-blue-700 transition duration-200 flex items-center"
                >
                  {isAdmin ? (
                    <span className="flex items-center">
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-2">Admin</span>
                      {user.email ? user.email.split('@')[0] : 'Admin'}
                    </span>
                  ) : isEditor ? (
                    <span className="flex items-center">
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2">Editör</span>
                      {user.email ? user.email.split('@')[0] : 'Editör'}
                    </span>
                  ) : isReviewer ? (
                    <span className="flex items-center">
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mr-2">Hakem</span>
                      {user.email ? user.email.split('@')[0] : 'Hakem'}
                    </span>
                  ) : isUser ? (
                    <span className="flex items-center">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">Kullanıcı</span>
                      {user.email ? user.email.split('@')[0] : 'Kullanıcı'}
                    </span>
                  ) : (
                    user.email ? user.email.split('@')[0] : 'Kullanıcı'
                  )}
                  <svg 
                    className={`w-4 h-4 ml-1 transform transition-transform duration-200 ${isAdminDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isAdminDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {/* Kullanıcı sayfaları */}
                    <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-700">
                      Profil
                    </Link>
                    
                    {/* Normal kullanıcı için özel menü öğeleri */}
                    {isUser && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="px-4 py-1 text-xs text-gray-500 uppercase font-semibold">
                          Kullanıcı İşlemleri
                        </div>
                        <Link href="/submit-paper" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-700">
                          Bildiri Gönder
                        </Link>
                        <Link href="/my-papers" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-700">
                          Bildirilerim
                        </Link>
                      </>
                    )}
                    
                    {/* Hakem için özel menü öğeleri */}
                    {isReviewer && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="px-4 py-1 text-xs text-gray-500 uppercase font-semibold">
                          Hakem Paneli
                        </div>
                        <Link href="/reviewer/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-700">
                          Hakem Paneli
                        </Link>
                        <Link href="/reviewer/assigned-papers" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-700">
                          Atanan Bildiriler
                        </Link>
                        
                      </>
                    )}
                    
                    {/* Editör için özel menü öğeleri */}
                    {isEditor && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="px-4 py-1 text-xs text-gray-500 uppercase font-semibold">
                          Editör Paneli
                        </div>
                        <Link href="/editor/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-700">
                          Editör Paneli
                        </Link>
                        <Link href="/editor/papers" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-700">
                          Bildiri Yönetimi
                        </Link>
                      </>
                    )}
                    
                    {/* Admin için özel menü öğeleri */}
                    {isAdmin && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="px-4 py-1 text-xs text-gray-500 uppercase font-semibold">
                          Admin Paneli
                        </div>
                        <Link href="/admin/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-700">
                          Kontrol Paneli
                        </Link>
                        <Link href="/admin/papers" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-700">
                          Bildiri Yönetimi
                        </Link>
                        <Link href="/admin/reviewers" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-700">
                          Hakem Yönetimi
                        </Link>
                      </>
                    )}
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-700"
                    >
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200 ml-4"
              >
                Giriş Yap
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-black hover:text-blue-700 transition duration-200"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 bg-white rounded-lg border border-gray-200 shadow-md">
            <Link href="/" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
              Ana Sayfa
            </Link>
            <Link href="/about" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
              Hakkımızda
            </Link>
            <Link href="/committees" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
              Komiteler
            </Link>
            <Link href="/papers" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
              Bildiriler
            </Link>
            <Link href="/program" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
              Program
            </Link>
            <Link href="/accommodation" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
              Konaklama
            </Link>
            <Link href="/journals" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
              Dergiler
            </Link>
            <Link href="/publication-opportunities" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
              Yayınlama İmkanları
            </Link>
            <Link href="/archive" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
              Arşivler
            </Link>
            <Link href="/contact" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
              İletişim
            </Link>
            
            {user ? (
              <>
                <div className="border-t border-gray-200 mt-2 pt-2">
                  {/* Kullanıcı sayfaları */}
                  <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
                    Profil
                  </Link>
                  
                  {/* Normal kullanıcı için özel menü öğeleri */}
                  {isUser && (
                    <>
                      <div className="px-4 py-1 text-xs text-gray-500 uppercase font-semibold">
                        Kullanıcı İşlemleri
                      </div>
                      <Link href="/submit-paper" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
                        Bildiri Gönder
                      </Link>
                      <Link href="/my-papers" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
                        Bildirilerim
                      </Link>
                    </>
                  )}
                  
                  {/* Hakem için özel menü öğeleri */}
                  {isReviewer && (
                    <>
                      <div className="px-4 py-1 text-xs text-gray-500 uppercase font-semibold">
                        Hakem Paneli
                      </div>
                      <Link href="/reviewer/dashboard" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
                        Hakem Paneli
                      </Link>
                      <Link href="/reviewer/assigned-papers" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
                        Atanan Bildiriler
                      </Link>
                      
                    </>
                  )}
                  
                  {/* Editör için özel menü öğeleri */}
                  {isEditor && (
                    <>
                      <div className="px-4 py-1 text-xs text-gray-500 uppercase font-semibold">
                        Editör Paneli
                      </div>
                      <Link href="/editor/dashboard" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
                        Editör Paneli
                      </Link>
                      <Link href="/editor/papers" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
                        Bildiri Yönetimi
                      </Link>
                    </>
                  )}
                  
                  {/* Admin için özel menü öğeleri */}
                  {isAdmin && (
                    <>
                      <div className="px-4 py-1 text-xs text-gray-500 uppercase font-semibold">
                        Admin Paneli
                      </div>
                      <Link href="/admin/dashboard" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
                        Kontrol Paneli
                      </Link>
                      <Link href="/admin/papers" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
                        Bildiri Yönetimi
                      </Link>
                      <Link href="/admin/reviewers" className="block px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100">
                        Hakem Yönetimi
                      </Link>
                    </>
                  )}
                  
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </>
            ) : (
              <Link 
                href="/login" 
                className="block px-4 py-2 text-blue-600 font-medium hover:text-blue-700 hover:bg-gray-100"
              >
                Giriş Yap
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
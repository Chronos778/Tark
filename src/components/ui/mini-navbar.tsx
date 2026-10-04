"use client";

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Scale, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/use-session';
import { useLanguage } from '@/hooks/use-language';

const AnimatedNavLink = ({ href, children, isActive }: { href: string; children: ReactNode; isActive?: boolean }) => {
  const defaultTextColor = isActive ? 'text-white font-medium' : 'text-gray-400';
  const hoverTextColor = 'text-white';
  const textSizeClass = 'text-sm';

  return (
    <Link to={href} className={`group relative block overflow-hidden h-5 ${textSizeClass}`}>
      <div className="flex flex-col transition-transform duration-300 ease-out transform group-hover:-translate-y-1/2">
        <span className={`block h-5 leading-5 ${defaultTextColor}`}>{children}</span>
        <span className={`block h-5 leading-5 ${hoverTextColor}`}>{children}</span>
      </div>
    </Link>
  );
};

export function Navbar({ autoHide = false }: { autoHide?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
  const [isHovered, setIsHovered] = useState(false);
  const { session } = useSession();
  const { language, setLanguage } = useLanguage();
  const isLoggedIn = !!session;
  const shapeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }

    if (isOpen) {
      setHeaderShapeClass('rounded-xl');
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass('rounded-full');
      }, 300);
    }

    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const logoElement = (
    <Link to="/" className="relative flex items-center justify-center gap-2.5 group" aria-label="Nyaya home">
        <span aria-hidden="true" className="grid size-8 place-items-center rounded-md border border-saffron/50 bg-saffron/10 font-display text-xl leading-none text-saffron">§</span>
        <span className="font-display font-medium text-bone hidden sm:block text-2xl tracking-tight">Nyaya</span>
    </Link>
  );

  const navLinksData = [
    { label: 'Home', href: '/' },
    { label: 'Draft', href: '/draft' },
    { label: 'Summarizer', href: '/summarize' },
    { label: 'Compare', href: '/compare' },
    { label: 'Assistant', href: '/chat' },
  ];

  // Auto-hide relies on hover, which touch screens do not have; keep the bar visible there
  const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
  const sidebarVisible = autoHide && canHover ? (isHovered || isOpen) : true;

  return (
    <>
      {/* Trigger Zone for Auto-Hide - Centered Area Only */}
      {autoHide && canHover && (
        <div 
            className="fixed top-0 left-1/2 -translate-x-1/2 w-[60%] sm:w-[500px] h-6 z-50 bg-transparent"
            onMouseEnter={() => setIsHovered(true)}
        />
      )}

      <header 
         onMouseEnter={() => autoHide && setIsHovered(true)}
         onMouseLeave={() => autoHide && setIsHovered(false)}
         className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50
                       flex flex-col items-center
                       pl-4 pr-4 py-3 backdrop-blur-md
                       ${headerShapeClass}
                       border border-bone/10 bg-ink/70
                       w-[calc(100%-2rem)] sm:w-auto min-w-[320px] sm:min-w-[800px]
                       transition-all duration-300 ease-in-out shadow-2xl
                       ${autoHide && !sidebarVisible ? '-translate-y-[150%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'}
                       `}
      >

      <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">
        <div className="flex items-center">
           {logoElement}
        </div>

        <nav className="hidden sm:flex items-center space-x-4 sm:space-x-6 text-sm">
          {navLinksData.map((link) => (
            <AnimatedNavLink key={link.href} href={link.href} isActive={location.pathname === link.href}>
              {link.label}
            </AnimatedNavLink>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
           {/* Language Selector */}
           <div className="flex items-center bg-[#131210] border border-white/10 rounded-full p-0.5 text-xs shadow-inner">
             <button
               type="button"
               onClick={() => setLanguage('en')}
               className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                 language === 'en'
                   ? 'bg-saffron text-ink font-bold shadow-sm'
                   : 'text-gray-400 hover:text-white'
               }`}
             >
               EN
             </button>
             <button
               type="button"
               onClick={() => setLanguage('hi')}
               className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                 language === 'hi'
                   ? 'bg-saffron text-ink font-bold shadow-sm'
                   : 'text-gray-400 hover:text-white'
               }`}
             >
               HI
             </button>
           </div>

           {isLoggedIn ? (
             <button 
               onClick={handleLogout}
               className="px-5 py-2 text-xs font-medium text-ink bg-saffron rounded-full hover:bg-saffron/85 transition-colors duration-200  flex items-center gap-2"
             >
               <LogOut className="w-3.5 h-3.5" />
               Logout
             </button>
           ) : (
             <>
               <Link to="/login">
                   <button className="px-5 py-2 text-xs font-medium text-white border border-white/20 rounded-full hover:bg-white/10 transition-colors duration-200">
                      Sign In
                   </button>
               </Link>
               <Link to="/chat">
                   <button className="px-5 py-2 text-xs font-medium text-ink bg-saffron rounded-full hover:bg-saffron/85 transition-colors duration-200 ">
                      Launch App
                   </button>
               </Link>
             </>
           )}
        </div>

        <button className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300 focus:outline-none" onClick={toggleMenu} aria-label={isOpen ? 'Close Menu' : 'Open Menu'}>
          {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          )}
        </button>
      </div>

      <div className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden
                       ${isOpen ? 'max-h-[1000px] opacity-100 pt-4' : 'max-h-0 opacity-0 pt-0 pointer-events-none'}`}>
        <nav className="flex flex-col items-center space-y-4 text-base w-full">
          {navLinksData.map((link) => (
            <Link key={link.href} to={link.href} className="text-gray-300 hover:text-white transition-colors w-full text-center py-2" onClick={() => setIsOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col items-center space-y-4 mt-4 w-full pb-2">
           {/* Mobile Language Selector */}
           <div className="flex items-center justify-center bg-[#131210] border border-white/10 rounded-full p-1 text-xs w-full max-w-[200px]">
             <button
               type="button"
               onClick={() => setLanguage('en')}
               className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
                 language === 'en'
                   ? 'bg-saffron text-ink font-bold shadow-sm'
                   : 'text-gray-400 hover:text-white'
               }`}
             >
               English
             </button>
             <button
               type="button"
               onClick={() => setLanguage('hi')}
               className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
                 language === 'hi'
                   ? 'bg-saffron text-ink font-bold shadow-sm'
                   : 'text-gray-400 hover:text-white'
               }`}
             >
               हिन्दी (HI)
             </button>
           </div>
           {isLoggedIn ? (
             <button 
               onClick={handleLogout}
               className="w-full px-4 py-2 text-sm font-semibold text-ink bg-saffron rounded-full hover:bg-saffron/85 transition-colors flex items-center justify-center gap-2"
             >
               <LogOut className="w-4 h-4" />
               Logout
             </button>
           ) : (
             <>
               <Link to="/login" className="w-full">
                   <button className="w-full px-4 py-2 text-sm font-semibold text-white border border-white/20 rounded-full hover:bg-white/10 transition-colors">
                      Sign In
                   </button>
               </Link>
               <Link to="/chat" className="w-full">
                   <button className="w-full px-4 py-2 text-sm font-semibold text-ink bg-saffron rounded-full hover:bg-saffron/85 transition-colors">
                      Launch App
                   </button>
               </Link>
             </>
           )}
        </div>
      </div>
    </header>
    </>
  );
}

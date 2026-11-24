import { useState } from 'react';
import { Languages, Menu, User, Wind, X } from 'lucide-react';
import { useLanguage } from '../i18n';
import type { AppView, UserProfile } from '../types';

interface NavbarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export function Navbar({
  activeView,
  onNavigate,
  user,
  onOpenAuth,
  onOpenProfile,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const navItems: Array<{ id: AppView; label: string }> = [
    { id: 'home', label: t.navHome },
    { id: 'dashboard', label: t.navLiveAqi },
    { id: 'explore', label: t.navExploreCities },
    { id: 'health', label: t.navHealthGuide },
    { id: 'about', label: t.navAbout },
  ];

  const handleNavClick = (view: AppView) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#F8FAFC]/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element Brand Zone */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-[#14532D] transition-opacity hover:opacity-85 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:text-emerald-400"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#14532D] text-white dark:bg-emerald-500 dark:text-slate-950">
            <Wind className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-display">BreatheWell</span>
        </button>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-7">
          {navItems.map((item) => {
            const isActive =
              activeView === item.id ||
              (item.id === 'dashboard' &&
                (activeView === 'analytics' || activeView === 'assistant'));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 ${
                  isActive
                    ? 'text-[#14532D] dark:text-emerald-400'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[15px] h-0.5 bg-[#14532D] dark:bg-emerald-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Language Switcher + Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            role="group"
            aria-label={t.switchLangLabel}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
          >
            <Languages className="ml-1.5 mr-1 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              aria-label="English"
              className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                lang === 'en'
                  ? 'bg-[#14532D] text-white dark:bg-emerald-500 dark:text-slate-950'
                  : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              aria-pressed={lang === 'hi'}
              aria-label="हिन्दी"
              className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                lang === 'hi'
                  ? 'bg-[#14532D] text-white dark:bg-emerald-500 dark:text-slate-950'
                  : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              हिं
            </button>
          </div>

          {user ? (
            <button
              type="button"
              onClick={onOpenProfile}
              className="hidden md:inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span className="max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="hidden md:inline-flex items-center rounded-xl bg-[#14532D] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
            >
              {t.signIn}
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t.closeMenu : t.openMenu}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-950">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex min-h-[44px] items-center justify-between rounded-xl px-3 text-left text-sm font-medium ${
                    isActive
                      ? 'bg-emerald-50 text-[#14532D] dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                if (user) onOpenProfile();
                else onOpenAuth();
              }}
              className="mt-2 flex min-h-[44px] items-center justify-center rounded-xl bg-[#14532D] px-4 text-sm font-semibold text-white dark:bg-emerald-500 dark:text-slate-950"
            >
              {user ? `${t.account} (${user.name.split(' ')[0]})` : t.signIn}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

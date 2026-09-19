import React from 'react';
import { ScreenType } from '../types';

interface NavigationProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
}

export const BottomNavigation: React.FC<NavigationProps> = ({
  currentScreen,
  onNavigate,
}) => {
  // Hide bottom navigation on public authentication or landing screens
  if (['landing', 'login', 'register'].includes(currentScreen)) {
    return null;
  }

  const navItems: { screen: ScreenType; label: string; icon: string }[] = [
    { screen: 'dashboard', label: 'Dashboard', icon: 'space_dashboard' },
    { screen: 'explore', label: 'Explorar', icon: 'auto_awesome' },
    { screen: 'availability', label: 'Folgas', icon: 'calendar_today' },
    { screen: 'trips', label: 'Viagens', icon: 'flight_takeoff' },
    { screen: 'profile', label: 'Perfil', icon: 'person' },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Navegação Principal"
      className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 py-2.5 px-4 z-40 shadow-2xl"
    >
      <div className="max-w-xl mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            currentScreen === item.screen ||
            (item.screen === 'dashboard' && (currentScreen === 'hub' || currentScreen === 'dashboard')) ||
            (item.screen === 'explore' && (currentScreen === 'explorar' || currentScreen === 'explore')) ||
            (item.screen === 'profile' && (currentScreen === 'perfil' || currentScreen === 'profile')) ||
            (item.screen === 'trips' && (currentScreen === 'roteiro' || currentScreen === 'detalhes' || currentScreen === 'trip-details'));

          return (
            <button
              key={item.screen}
              id={`nav-item-${item.screen}`}
              onClick={() => onNavigate(item.screen)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-white active:scale-95'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px] mb-0.5"
                style={{
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {item.icon}
              </span>
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

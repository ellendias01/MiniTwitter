import React from 'react';
import { Home, User, Search, Bell } from 'lucide-react';
import type { Screen, ABVariant } from '../App';

interface BottomNavigationProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  abVariant: ABVariant;
  unreadNotifications?: number;
}

export function BottomNavigation({ activeScreen, onNavigate, abVariant, unreadNotifications = 0 }: BottomNavigationProps) {
  const isVariantB = abVariant === 'B';

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-background border-t border-border px-2 py-1 ${
      isVariantB ? 'backdrop-blur-md bg-background/90' : ''
    }`}>
      <div className="flex justify-around max-w-md mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
            activeScreen === 'home'
              ? isVariantB ? 'text-primary bg-primary/10' : 'text-[#1DA1F2]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Home 
            className={`w-5 h-5 ${activeScreen === 'home' && !isVariantB ? 'fill-current' : ''}`}
          />
          <span className="text-xs mt-1">Home</span>
        </button>

        {/* Search button - Always visible in Variant B, only in Variant A for consistency */}
        <button
          onClick={() => onNavigate('search')}
          className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
            activeScreen === 'search'
              ? isVariantB ? 'text-primary bg-primary/10' : 'text-[#1DA1F2]'
              : 'text-muted-foreground hover:text-foreground'
          } ${!isVariantB ? 'hidden' : ''}`}
        >
          <Search 
            className={`w-5 h-5 ${activeScreen === 'search' && !isVariantB ? 'fill-current' : ''}`}
          />
          <span className="text-xs mt-1">Buscar</span>
        </button>

        {/* Notifications button - Only in Variant B */}
        <button
          onClick={() => onNavigate('notifications')}
          className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors relative ${
            activeScreen === 'notifications'
              ? isVariantB ? 'text-primary bg-primary/10' : 'text-[#1DA1F2]'
              : 'text-muted-foreground hover:text-foreground'
          } ${!isVariantB ? 'hidden' : ''}`}
        >
          <Bell 
            className={`w-5 h-5 ${activeScreen === 'notifications' && !isVariantB ? 'fill-current' : ''}`}
          />
          <span className="text-xs mt-1">Notif</span>
          {unreadNotifications > 0 && (
            <div className="absolute top-1 right-2 w-2 h-2 bg-destructive rounded-full"></div>
          )}
        </button>
        
        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
            activeScreen === 'profile'
              ? isVariantB ? 'text-primary bg-primary/10' : 'text-[#1DA1F2]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User 
            className={`w-5 h-5 ${activeScreen === 'profile' && !isVariantB ? 'fill-current' : ''}`}
          />
          <span className="text-xs mt-1">Perfil</span>
        </button>

        {/* Search button for Variant A - appears as 4th button */}
        {!isVariantB && (
          <button
            onClick={() => onNavigate('search')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              activeScreen === 'search'
                ? 'text-[#1DA1F2]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search 
              className={`w-5 h-5 ${activeScreen === 'search' ? 'fill-current' : ''}`}
            />
            <span className="text-xs mt-1">Buscar</span>
          </button>
        )}
      </div>
    </nav>
  );
}
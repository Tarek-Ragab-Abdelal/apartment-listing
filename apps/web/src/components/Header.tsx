'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { Moon, Sun, Home, PlusCircle, MessageSquare, Heart, LogOut, Menu, X } from 'lucide-react';

export const Header = () => {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
    setIsMenuOpen(false);
  };

  const closeMenu = () => setIsMenuOpen(false);

  // Navigation items
  const navigationItems = isAuthenticated ? [
    { href: '/', icon: Home, label: 'Browse', show: true },
    { href: '/sell/new', icon: PlusCircle, label: 'Add Listing', show: isAdmin },
    { href: '/messages', icon: MessageSquare, label: 'Messages', show: true },
    { href: '/watchlist', icon: Heart, label: 'Watchlist', show: !isAdmin },
  ].filter(item => item.show) : [];

  const renderNavigationItems = (onItemClick?: () => void) => (
    <>
      {navigationItems.map(({ href, icon: Icon, label }) => (
        <Link key={href} href={href} onClick={onItemClick}>
          <Button 
            variant="ghost" 
            size={isMobile ? "default" : "sm"} 
            className={`justify-start ${isMobile ? 'w-full' : ''}`}
          >
            <Icon className={`w-4 h-4 ${isMobile ? 'mr-3' : 'mr-2'}`} />
            {label}
          </Button>
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <div className="text-xl sm:text-2xl font-bold text-primary">
              <span className="hidden sm:inline">Nawy Apartments</span>
              <span className="sm:hidden">Nawy</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="hidden md:flex items-center gap-2">
              {renderNavigationItems()}
              
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="ml-2"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {/* User Info & Logout */}
              {isAuthenticated && (
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm text-muted-foreground hidden lg:inline">
                    {user?.name} ({user?.role})
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </nav>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <div className="flex items-center gap-2 md:hidden">
              {/* Theme Toggle for Mobile */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {/* Mobile Menu */}
              {isAuthenticated && (
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2">
                      <Menu className="w-5 h-5" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72 p-0">
                    <div className="flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 border-b">
                        <div className="font-semibold text-lg">Menu</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsMenuOpen(false)}
                          className="p-2"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>

                      {/* User Info */}
                      <div className="p-4 border-b bg-muted/50">
                        <div className="text-sm font-medium">{user?.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
                      </div>

                      {/* Navigation Items */}
                      <div className="flex-1 p-4">
                        <div className="flex flex-col space-y-2">
                          {renderNavigationItems(closeMenu)}
                        </div>
                      </div>

                      {/* Logout Button */}
                      <div className="p-4 border-t">
                        <Button
                          variant="destructive"
                          onClick={handleLogout}
                          className="w-full justify-start"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

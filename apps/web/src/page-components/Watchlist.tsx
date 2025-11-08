'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { ApartmentCard } from '@/components/ApartmentCard';
import { Button } from '@/components/ui/button';
import { watchlistApi, Apartment } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Heart, Loader2, LogIn } from 'lucide-react';

const Watchlist = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && user) {
        loadWatchlist();
      } else {
        setIsLoading(false);
      }
    }
  }, [authLoading, isAuthenticated, user]);

  const loadWatchlist = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await watchlistApi.getAll({ userId: user.id });
      
      if (response.success && response.data) {
        const watchlistData = response.data;
        const watchlistApartments = watchlistData
          .map((item: any) => item.apartment)
          .filter(Boolean); // Filter out null apartments

        setApartments(watchlistApartments);
      }
    } catch (error) {
      console.error('Failed to load watchlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to load watchlist',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWatchlist = async (apartmentId: string) => {
    if (!user) return;

    try {
      await watchlistApi.remove(user.id, apartmentId);
      
      // Update local state
      setApartments(prev => prev.filter(apt => apt.id !== apartmentId));
      
      toast({
        title: 'Removed from watchlist',
        description: 'Apartment removed from your watchlist',
      });
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove from watchlist',
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <LogIn className="w-16 h-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Login Required</h1>
            <p className="text-muted-foreground mb-6">
              Please login to view your watchlist
            </p>
            <Button onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const renderMainContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (apartments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground mb-2">Your watchlist is empty</p>
          <p className="text-sm text-muted-foreground mb-6">
            Browse apartments and save your favorites
          </p>
          <Button onClick={() => router.push('/')} variant="outline">
            Browse Apartments
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apartments.map((apartment) => (
          <ApartmentCard
            key={apartment.id}
            apartment={apartment}
            onToggleWatchlist={toggleWatchlist}
            isInWatchlist={true}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Watchlist</h1>
          <p className="text-muted-foreground">
            Your saved apartments ({apartments.length})
          </p>
        </div>

        {renderMainContent()}
      </main>
    </div>
  );
};

export default Watchlist;

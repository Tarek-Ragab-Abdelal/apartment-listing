'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ImageGallery,
  ApartmentInfo,
  ListerInfo,
  ActionButtons,
  RelatedApartments
} from '@/components/apartment-detail';
import { apartmentApi, Apartment, messagesApi, watchlistApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';

const ApartmentDetail = () => {
  const params = useParams();
  const id = params?.id as string;
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [relatedApartments, setRelatedApartments] = useState<Apartment[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const fetchApartment = useCallback(async (apartmentId: string) => {
    setIsLoading(true);
    try {
      const response = await apartmentApi.getById(apartmentId);
      if (response.success) {
        setApartment(response.data);
      }
    } catch (error) {
      console.error('Failed to load apartment details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load apartment details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchRelatedApartments = useCallback(async (apartmentId: string) => {
    setIsLoadingRelated(true);
    try {
      const response = await apartmentApi.getRelated(apartmentId);
      if (response.success) {
        setRelatedApartments(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load related apartments:', error);
      // Don't show error for related apartments as it's not critical
    } finally {
      setIsLoadingRelated(false);
    }
  }, []);

  const fetchUserWatchlist = useCallback(async () => {
    if (!user) return;
    try {
      const response = await watchlistApi.getAll({ userId: user.id });
      if (response.success && response.data) {
        const apartmentIds = response.data.map((item: any) => item.apartmentId);
        setWatchlist(apartmentIds);
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    }
  }, [user]);

  useEffect(() => {
    if (id) {
      fetchApartment(id);
      fetchRelatedApartments(id);
    }
  }, [id, fetchApartment, fetchRelatedApartments]);

  useEffect(() => {
    if (user) {
      fetchUserWatchlist();
    }
  }, [user, fetchUserWatchlist]);

  const handleToggleWatchlist = async () => {
    if (!user || !apartment) {
      toast({
        title: 'Login required',
        description: 'Please login to add apartments to your watchlist',
        variant: 'destructive',
      });
      return;
    }

    const isInWatchlist = watchlist.includes(apartment.id);

    try {
      if (isInWatchlist) {
        await watchlistApi.remove(user.id, apartment.id);
        setWatchlist(prev => prev.filter(id => id !== apartment.id));
        toast({
          title: 'Removed from watchlist',
          description: 'Apartment removed from your watchlist',
        });
      } else {
        await watchlistApi.add(user.id, apartment.id);
        setWatchlist(prev => [...prev, apartment.id]);
        toast({
          title: 'Added to watchlist',
          description: 'Apartment added to your watchlist',
        });
      }
    } catch (error) {
      console.error('Failed to update watchlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to update watchlist',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!user || !apartment) {
      toast({
        title: 'Login required',
        description: 'Please login to contact the seller',
        variant: 'destructive',
      });
      return;
    }

    if (!apartment.lister) {
      toast({
        title: 'Error',
        description: 'Unable to contact seller - lister information not available',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingMessage(true);
    try {
      const response = await messagesApi.startConversation({
        apartmentId: apartment.id,
        message: `Hi, I'm interested in ${apartment.unitName}. Could you please provide more details?`,
      });

      if (response.success) {
        toast({
          title: 'Message sent',
          description: 'Message Sent, Follow up in messages page',
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleRelatedWatchlistToggle = async (apartmentId: string) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to add apartments to your watchlist',
        variant: 'destructive',
      });
      return;
    }

    const isInWatchlist = watchlist.includes(apartmentId);

    try {
      if (isInWatchlist) {
        await watchlistApi.remove(user.id, apartmentId);
        setWatchlist(prev => prev.filter(id => id !== apartmentId));
        toast({
          title: 'Removed from watchlist',
          description: 'Apartment removed from your watchlist',
        });
      } else {
        await watchlistApi.add(user.id, apartmentId);
        setWatchlist(prev => [...prev, apartmentId]);
        toast({
          title: 'Added to watchlist',
          description: 'Apartment added to your watchlist',
        });
      }
    } catch (error) {
      console.error('Failed to update watchlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to update watchlist',
        variant: 'destructive',
      });
    }
  };

  const handleEditApartment = () => {
    if (!apartment) return;
    // Navigate to edit page - this would be implemented when edit functionality is added
    router.push(`/sell/edit/${apartment.id}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Not found state
  if (!apartment) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-xl text-muted-foreground">Apartment not found</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            Back to Listings
          </Button>
        </div>
      </div>
    );
  }

  const images = apartment.images && apartment.images.length > 0 
    ? apartment.images.map(img => img.imageUrl) 
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Listings
        </Button>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 lg:min-h-[600px]">
          {/* Image Gallery */}
          <ImageGallery
            images={images}
            alt={apartment.unitName}
            apartmentId={apartment.id}
            className="min-h-[400px] lg:min-h-full"
          />

          {/* Apartment Details Card */}
          <Card className="h-fit lg:h-full flex flex-col">
            <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
              <ApartmentInfo
                apartment={apartment}
                isInWatchlist={watchlist.includes(apartment.id)}
                canToggleWatchlist={user !== null && !isAdmin}
                onToggleWatchlist={handleToggleWatchlist}
              />

              <ListerInfo apartment={apartment} />

              <div className="mt-auto">
                <ActionButtons
                  isAdmin={isAdmin}
                  canContact={user !== null && apartment.lister !== null}
                  isSendingMessage={isSendingMessage}
                  onSendMessage={handleSendMessage}
                  onEdit={handleEditApartment}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Related Apartments Section */}
        <RelatedApartments
          relatedApartments={relatedApartments}
          isLoading={isLoadingRelated}
          watchlist={watchlist}
          canToggleWatchlist={user !== null && !isAdmin}
          onToggleWatchlist={handleRelatedWatchlistToggle}
        />
      </main>
    </div>
  );
};

export default ApartmentDetail;
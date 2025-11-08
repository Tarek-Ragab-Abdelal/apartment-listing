'use client';

import { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, ChevronLeft, ChevronRight, Maximize, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  apartmentId?: string;
  className?: string;
}

// Moved outside component to prevent recreation on re-renders
const ImagePlaceholder = ({ size = 'large' }: { size?: 'large' | 'small' }) => (
  <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center">
    <div className="text-center text-muted-foreground">
      <ImageIcon className={cn(
        "mx-auto mb-2 opacity-50",
        size === 'large' ? 'w-16 h-16' : 'w-8 h-8'
      )} />
      <p className={cn(
        size === 'large' ? 'text-sm' : 'text-xs'
      )}>
        Image unavailable
      </p>
    </div>
  </div>
);

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  alt,
  apartmentId,
  className
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState<Set<number>>(new Set());
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Handle case when no images are provided
  const displayImages = images.length > 0 ? images : [''];
  const hasRealImages = images.length > 0;

  const getImageUrl = useCallback((url?: string, index: number = 0) => {
    if (url && !failedImages.has(index)) return url;
    return `https://picsum.photos/800/600?random=${apartmentId || index}`;
  }, [failedImages, apartmentId]);

  // Preload next and previous images for smooth navigation
  useEffect(() => {
    if (hasRealImages && displayImages.length > 1) {
      const nextIndex = (currentImageIndex + 1) % displayImages.length;
      const prevIndex = (currentImageIndex - 1 + displayImages.length) % displayImages.length;
      
      for (const index of [nextIndex, prevIndex]) {
        if (!failedImages.has(index)) {
          const img = new globalThis.window.Image();
          img.src = getImageUrl(displayImages[index], index);
        }
      }
    }
  }, [currentImageIndex, displayImages, failedImages, hasRealImages, getImageUrl]);

  const handleImageError = useCallback((index: number) => {
    setFailedImages(prev => new Set(prev).add(index));
    setIsLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  }, []);

  const handleImageLoad = useCallback((index: number) => {
    setIsLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  }, []);

  const navigateToImage = (index: number) => {
    if (index >= 0 && index < displayImages.length && hasRealImages) {
      setCurrentImageIndex(index);
    }
  };

  const navigatePrevious = () => {
    console.log('Navigate previous called', { hasRealImages, currentImageIndex, totalImages: displayImages.length });
    if (hasRealImages && displayImages.length > 1) {
      const newIndex = (currentImageIndex - 1 + displayImages.length) % displayImages.length;
      console.log('Setting new index:', newIndex);
      setCurrentImageIndex(newIndex);
    }
  };

  const navigateNext = () => {
    console.log('Navigate next called', { hasRealImages, currentImageIndex, totalImages: displayImages.length });
    if (hasRealImages && displayImages.length > 1) {
      const newIndex = (currentImageIndex + 1) % displayImages.length;
      console.log('Setting new index:', newIndex);
      setCurrentImageIndex(newIndex);
    }
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && hasRealImages && displayImages.length > 1) {
      navigateNext();
    }
    if (isRightSwipe && hasRealImages && displayImages.length > 1) {
      navigatePrevious();
    }

    // Reset touch state
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (hasRealImages && displayImages.length > 1) {
            setCurrentImageIndex(prev => (prev - 1 + displayImages.length) % displayImages.length);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (hasRealImages && displayImages.length > 1) {
            setCurrentImageIndex(prev => (prev + 1) % displayImages.length);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsFullscreen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, hasRealImages, displayImages.length]);

  const renderMainImage = () => {
    const currentImage = displayImages[currentImageIndex];
    const isImageFailed = failedImages.has(currentImageIndex) || !hasRealImages;
    const isImageLoading = isLoading.has(currentImageIndex) && hasRealImages;

    return (
      <div className="relative group flex-1">
        <div className="h-full rounded-2xl overflow-hidden bg-gradient-to-br from-muted/30 to-muted/60 shadow-2xl">
          {isImageFailed ? (
            <ImagePlaceholder size="large" />
          ) : (
            <div className="relative w-full h-full">
              <img
                src={getImageUrl(currentImage, currentImageIndex)}
                alt={`${alt} ${currentImageIndex + 1}`}
                className={cn(
                  "w-full h-full object-cover transition-all duration-700 ease-out",
                  isImageLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100',
                  "hover:scale-105"
                )}
                onError={() => handleImageError(currentImageIndex)}
                onLoad={() => handleImageLoad(currentImageIndex)}
              />
              
              {/* Loading overlay */}
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Gradient overlays for better button visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
              
              {/* Navigation buttons - always visible on mobile, hover on desktop */}
              {hasRealImages && displayImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm opacity-80 md:opacity-60 md:group-hover:opacity-100 transition-all duration-300 border-0 h-10 w-10 md:h-12 md:w-12 rounded-full z-20"
                    onClick={() => {
                      console.log('Previous button clicked');
                      navigatePrevious();
                    }}
                  >
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm opacity-80 md:opacity-60 md:group-hover:opacity-100 transition-all duration-300 border-0 h-10 w-10 md:h-12 md:w-12 rounded-full z-20"
                    onClick={() => {
                      console.log('Next button clicked');
                      navigateNext();
                    }}
                  >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                  </Button>
                </>
              )}

              {/* Action buttons */}
              {hasRealImages && (
                <div className="absolute top-2 md:top-4 right-2 md:right-4 flex gap-2 opacity-80 md:opacity-60 md:group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm border-0 h-8 w-8 md:h-10 md:w-10 rounded-full"
                    onClick={() => {
                      console.log('Fullscreen button clicked');
                      setIsFullscreen(true);
                    }}
                  >
                    <Maximize className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>
              )}

              {/* Image counter */}
              {hasRealImages && displayImages.length > 1 && (
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/40 text-white text-sm rounded-full backdrop-blur-sm">
                  {currentImageIndex + 1} / {displayImages.length}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Touch handlers for mobile - only on image area, not buttons */}
        {hasRealImages && displayImages.length > 1 && (
          <div
            className="absolute inset-4 z-10"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
              pointerEvents: 'auto',
              // Create a safe area that doesn't overlap with buttons
              top: '20%',
              bottom: '20%',
              left: '20%',
              right: '20%'
            }}
          />
        )}
      </div>
    );
  };

  const renderThumbnails = () => {
    if (!hasRealImages || displayImages.length <= 1) return null;

    return (
      <div className="mt-4 flex-shrink-0">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2">
          {displayImages.map((imageUrl, index) => {
            const isImageFailed = failedImages.has(index);
            const isActive = currentImageIndex === index;

            return (
              <button
                key={`${apartmentId || 'image'}-${index}`}
                onClick={() => navigateToImage(index)}
                className={cn(
                  "relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 border-2",
                  isActive 
                    ? 'border-primary shadow-lg shadow-primary/25 scale-110' 
                    : 'border-transparent hover:border-primary/50 hover:scale-105',
                  "focus:outline-none focus:border-primary focus:scale-110"
                )}
              >
                <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/60">
                  {isImageFailed ? (
                    <ImagePlaceholder size="small" />
                  ) : (
                    <img
                      src={getImageUrl(imageUrl, index)}
                      alt={`${alt} thumbnail ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300"
                      onError={() => handleImageError(index)}
                    />
                  )}
                </div>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute inset-0 bg-primary/20 border-2 border-primary rounded-xl" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFullscreenModal = () => {
    if (!hasRealImages) return null;
    
    return (
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-none max-h-none w-screen h-screen p-0 bg-black/95 border-0 m-0">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm border-0 h-12 w-12 rounded-full"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Main image */}
            <div className="relative w-full h-full max-w-6xl max-h-[90vh] mx-8 flex items-center justify-center">
              {failedImages.has(currentImageIndex) || !hasRealImages ? (
                <div className="w-full h-full flex items-center justify-center">
                  <ImagePlaceholder size="large" />
                </div>
              ) : (
                <img
                  src={getImageUrl(displayImages[currentImageIndex], currentImageIndex)}
                  alt={`${alt} ${currentImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onError={() => handleImageError(currentImageIndex)}
                />
              )}

              {/* Navigation in fullscreen */}
              {hasRealImages && displayImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm border-0 h-14 w-14 rounded-full z-40"
                    onClick={navigatePrevious}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm border-0 h-14 w-14 rounded-full z-40"
                    onClick={navigateNext}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>
                </>
              )}
            </div>

            {/* Fullscreen thumbnails */}
            {hasRealImages && displayImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 backdrop-blur-sm p-3 rounded-full z-40">
                {displayImages.map((_, index) => (
                  <button
                    key={`fullscreen-${apartmentId || 'thumb'}-${index}`}
                    onClick={() => navigateToImage(index)}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all duration-300",
                      currentImageIndex === index 
                        ? 'bg-white scale-125' 
                        : 'bg-white/40 hover:bg-white/70'
                    )}
                  />
                ))}
              </div>
            )}

            {/* Fullscreen touch handlers */}
            <div
              className="absolute inset-0 touch-pan-x z-30"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {renderMainImage()}
      {renderThumbnails()}
      {renderFullscreenModal()}
    </div>
  );
};
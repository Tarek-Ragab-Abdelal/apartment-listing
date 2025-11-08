'use client';

import { MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  isAdmin: boolean;
  canContact: boolean;
  isSendingMessage: boolean;
  onSendMessage: () => void;
  onEdit?: () => void;
  className?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isAdmin,
  canContact,
  isSendingMessage,
  onSendMessage,
  onEdit,
  className
}) => {
  if (isAdmin) {
    return (
      <div className={className}>
        <Button 
          className="w-full" 
          variant="outline"
          onClick={onEdit}
        >
          Edit Listing
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        <Button
          onClick={onSendMessage}
          disabled={!canContact || isSendingMessage}
          className="w-full"
          size="lg"
        >
          {isSendingMessage ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Seller
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          By contacting, you agree to our terms of service
        </p>
      </div>
    </div>
  );
};
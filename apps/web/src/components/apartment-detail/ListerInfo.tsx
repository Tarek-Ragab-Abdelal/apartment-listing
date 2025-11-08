'use client';

import { User, Mail, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Apartment } from '@/services/api';

interface ListerInfoProps {
  apartment: Apartment;
  className?: string;
}

export const ListerInfo: React.FC<ListerInfoProps> = ({ apartment, className }) => {
  if (!apartment.lister) return null;

  const { lister } = apartment;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-3">Listed By</h3>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{lister.name || lister.email}</div>
              <div className="text-sm text-muted-foreground capitalize">
                {lister.role}
              </div>
              {lister.email && (
                <div className="flex items-center gap-1 mt-1">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">
                    {lister.email}
                  </span>
                </div>
              )}
              {lister.phone && (
                <div className="flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {lister.phone}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
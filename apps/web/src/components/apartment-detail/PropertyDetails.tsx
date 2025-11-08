'use client';

import { Bed, Bath, Square, Calendar } from 'lucide-react';
import { Apartment } from '@/services/api';

interface PropertyDetailsProps {
  apartment: Apartment;
  className?: string;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({ apartment, className }) => {
  const details = [
    {
      icon: Bed,
      label: 'Bedrooms',
      value: apartment.bedrooms,
      suffix: apartment.bedrooms === 1 ? 'bedroom' : 'bedrooms'
    },
    {
      icon: Bath,
      label: 'Bathrooms', 
      value: apartment.bathrooms,
      suffix: apartment.bathrooms === 1 ? 'bathroom' : 'bathrooms'
    },
    {
      icon: Square,
      label: 'Area',
      value: apartment.areaSqm,
      suffix: 'sqm'
    },
    {
      icon: Calendar,
      label: 'Listed',
      value: apartment.createdAt ? new Date(apartment.createdAt).toLocaleDateString() : null,
      suffix: ''
    }
  ].filter(detail => detail.value !== null && detail.value !== undefined);

  if (details.length === 0) return null;

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-4">
        {details.map(({ icon: Icon, label, value, suffix }, index) => (
          <div key={`${label}-${index}`} className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm">
              <span className="font-medium">{value}</span>
              {suffix && <span className="text-muted-foreground ml-1">{suffix}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
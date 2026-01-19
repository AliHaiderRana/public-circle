import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';

interface CompanyLogoProps {
  logo?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showName?: boolean;
}

const sizeMap = {
  sm: { logo: 20, text: 'text-xs' },
  md: { logo: 32, text: 'text-sm' },
  lg: { logo: 48, text: 'text-base' },
};

/**
 * CompanyLogo Component
 * Displays company logo with fallback to initial or icon
 */
export function CompanyLogo({
  logo,
  name,
  size = 'md',
  className,
  showName = false,
}: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false);
  const { logo: logoSize, text: textSize } = sizeMap[size];
  const companyInitial = name ? name.charAt(0).toUpperCase() : 'C';
  const hasLogo = logo && logo.trim() !== '' && !imageError;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {hasLogo ? (
        <img
          src={logo}
          alt={name || 'Company logo'}
          className={cn('rounded-md object-cover border border-border/50 flex-shrink-0 shadow-sm')}
          style={{ width: logoSize, height: logoSize }}
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className={cn(
            'rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-border/50 text-white font-semibold flex-shrink-0 shadow-sm'
          )}
          style={{ width: logoSize, height: logoSize }}
        >
          <span style={{ fontSize: logoSize * 0.5 }}>{companyInitial}</span>
        </div>
      )}
      {showName && name && (
        <span 
          className={cn('font-medium text-foreground truncate', textSize)}
          title={name}
        >
          {name}
        </span>
      )}
    </div>
  );
}

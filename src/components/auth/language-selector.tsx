import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex ${className}`}>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 cursor-not-allowed opacity-70 pointer-events-none"
              disabled
            >
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">EN</span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Language: English</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

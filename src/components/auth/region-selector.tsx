import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { REGION_KEY } from "@/config/config";
import { ChevronDown } from "lucide-react";
import { updateUser } from "@/actions/signup";

interface Region {
  code: string;
  currency: string;
  flag: string;
}

const REGIONS: Region[] = [
  { code: "USA", currency: "USD", flag: "🇺🇸" },
  { code: "CA", currency: "CAD", flag: "🇨🇦" },
];

// Get initial region from localStorage
function getInitialRegion(): Region {
  if (typeof window === "undefined") return REGIONS[0];

  const storedRegion = localStorage.getItem(REGION_KEY);
  if (storedRegion) {
    // Handle legacy 'US' value - convert to 'USA'
    const normalizedRegion = storedRegion.toUpperCase() === "US" ? "USA" : storedRegion.toUpperCase();
    const region = REGIONS.find((r) => r.code === normalizedRegion);
    if (region) {
      // Update localStorage with correct value if it was legacy
      if (storedRegion.toUpperCase() === "US") {
        localStorage.setItem(REGION_KEY, "USA");
      }
      return region;
    }
  }
  return REGIONS[0];
}

interface RegionSelectorProps {
  className?: string;
  disabled?: boolean;
}

export function RegionSelector({
  className,
  disabled = false,
}: RegionSelectorProps) {
  const [selectedRegion, setSelectedRegion] = useState<Region>(getInitialRegion);

  const handleRegionChange = async (region: Region) => {
    setSelectedRegion(region);
    localStorage.setItem(REGION_KEY, region.code);

    // Update user's currency in the backend
    try {
      const currency = region.code === "CA" ? "CAD" : "USD";
      await updateUser({ currency });
    } catch (error) {
      console.error("Failed to update currency:", error);
    }

    // Reload to apply currency changes
    window.location.reload();
  };

  const buttonContent = (
    <Button
      variant="ghost"
      size="sm"
      className={`flex items-center gap-2 ${disabled ? "cursor-not-allowed opacity-70 pointer-events-none" : ""} ${className}`}
      disabled={disabled}
    >
      <span className="text-lg">{selectedRegion.flag}</span>
      <span className="text-sm font-medium">{selectedRegion.currency}</span>
      {!disabled && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
    </Button>
  );

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{buttonContent}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Currency: {selectedRegion.currency}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{buttonContent}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[100px]">
        {REGIONS.map((region) => (
          <DropdownMenuItem
            key={region.code}
            onClick={() => handleRegionChange(region)}
            className={`flex items-center gap-2 cursor-pointer ${
              selectedRegion.code === region.code ? "bg-accent" : ""
            }`}
          >
            <span className="text-lg">{region.flag}</span>
            <span className="text-sm font-medium">{region.currency}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

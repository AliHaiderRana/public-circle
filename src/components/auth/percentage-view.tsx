import { CheckCircle2 } from 'lucide-react';

interface PercentageViewProps {
  data: {
    trialInDays?: number;
    discountInDays?: number;
    discountInPercentage?: number;
    discounts?: {
      percentageDiscount?: number;
      fixedDiscount?: number;
    };
    currencySymbol?: string;
    type?: 'forever' | 'once' | 'repeating';
    durationInMonths?: number;
  };
}

export function PercentageView({ data }: PercentageViewProps) {
  const getDiscountMessage = () => {
    if (data?.trialInDays && data.trialInDays > 0) {
      const months = Math.floor(data.trialInDays / 30);
      const durationText =
        months >= 1
          ? `${months} ${months === 1 ? 'month' : 'months'}`
          : `${data.trialInDays} ${data.trialInDays === 1 ? 'day' : 'days'}`;

      return `You have received a ${durationText} free trial`;
    }

    if (data?.discountInDays && data.discountInDays > 0) {
      if (data?.discounts?.percentageDiscount && data.discounts.percentageDiscount > 0) {
        const months = Math.floor(data.discountInDays / 30);
        const durationText =
          months >= 1
            ? `${months} ${months === 1 ? 'month' : 'months'}`
            : `${data.discountInDays} days`;

        return `You got ${data.discounts.percentageDiscount}% discount for ${durationText}`;
      }
    }

    if (data?.discounts?.fixedDiscount && data.discounts.fixedDiscount > 0) {
      return `You got ${data.currencySymbol || '$'}${data.discounts.fixedDiscount} discount`;
    }

    // Handle new discount structure with type
    if (data?.discountInPercentage && data.discountInPercentage > 0) {
      const discountText = `You got ${data.discountInPercentage}% discount`;

      switch (data?.type) {
        case 'forever':
          return `${discountText}`;
        case 'once':
          return `${discountText} for one billing cycle`;
        case 'repeating':
          if (data?.durationInMonths && data.durationInMonths > 0) {
            return `${discountText} for ${data.durationInMonths}${data.durationInMonths > 1 ? ' months' : ' month'}`;
          }
          return `${discountText} (repeating)`;
        default:
          return discountText;
      }
    }

    return 'Invalid discount type';
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
      <p className="text-sm font-medium text-green-700">{getDiscountMessage()}</p>
    </div>
  );
}

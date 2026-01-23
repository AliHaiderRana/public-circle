import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

interface SignUpTermsProps {
  emailPreferences: boolean;
  setEmailPreferences: (value: boolean) => void;
}

export function SignUpTerms({ emailPreferences, setEmailPreferences }: SignUpTermsProps) {
  return (
    <div className="flex items-start gap-2">
      <Checkbox
        id="emailPreferences"
        checked={emailPreferences}
        onCheckedChange={(checked) => setEmailPreferences(checked as boolean)}
        className="mt-0.5"
      />
      <Label
        htmlFor="emailPreferences"
        className="text-xs font-normal cursor-pointer leading-relaxed text-muted-foreground"
      >
        I don't want to receive marketing emails from Public Circles. By not checking, I agree to receive updates.
      </Label>
    </div>
  );
}

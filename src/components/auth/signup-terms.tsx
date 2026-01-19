import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

interface SignUpTermsProps {
  emailPreferences: boolean;
  setEmailPreferences: (value: boolean) => void;
}

export function SignUpTerms({ emailPreferences, setEmailPreferences }: SignUpTermsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start space-x-2">
        <Checkbox
          id="emailPreferences"
          checked={emailPreferences}
          onCheckedChange={(checked) => setEmailPreferences(checked as boolean)}
          className="mt-1"
        />
        <Label
          htmlFor="emailPreferences"
          className="text-sm font-normal cursor-pointer leading-relaxed"
        >
          I don't want to receive emails from Public Circles about its related product and feature
          updates, marketing practices, and promotions. By not checking the box, I agree to be
          opted in by default.
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">
        By creating an account, you agree to our{' '}
        <Link to="/terms" className="text-primary hover:underline underline-offset-4">
          Terms
        </Link>{' '}
        and have read and acknowledge the{' '}
        <Link to="/privacy" className="text-primary hover:underline underline-offset-4">
          Privacy Statement
        </Link>
        .
      </p>
    </div>
  );
}

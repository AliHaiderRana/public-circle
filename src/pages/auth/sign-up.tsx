import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StepIndicator } from './signup/step-indicator';
import { paths } from '@/routes/paths';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { setSession } from '@/auth/utils/jwt';
import { REGION_KEY } from '@/config/config';

// Step components (will be created)
import { Step1Email } from './signup/steps/step1-email';
import { Step2EmailVerification } from './signup/steps/step2-email-verification';
import { Step3Password } from './signup/steps/step3-password';
import { Step4CompanyInfo } from './signup/steps/step4-company-info';
import { Step5AdditionalInfo } from './signup/steps/step5-additional-info';
import { Step6Referral } from './signup/steps/step6-referral';
import { Step7PlanSelection } from './signup/steps/step7-plan-selection';
import { Step8Payment } from './signup/steps/step8-payment';

const SIGNUP_STEPS = [
  { label: 'Email', step: 1 },
  { label: 'Verify', step: 2 },
  { label: 'Password', step: 3 },
  { label: 'Company', step: 4 },
  { label: 'Details', step: 5 },
  { label: 'Referral', step: 6 },
  { label: 'Plan', step: 7 },
  { label: 'Payment', step: 8 },
];

export default function SignUpPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const stepParam = searchParams.get('step');
  const emailParam = searchParams.get('emailAddress');
  const isInvited = searchParams.get('source') === 'invite';

  const [activeStep, setActiveStep] = useState(
    token ? 2 : stepParam ? Number(stepParam) : 1
  );
  const [emailAddress, setEmailAddress] = useState(emailParam || '');
  const [clientSecret, setClientSecret] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [reward, setReward] = useState<any>(null);
  const { checkUserSession } = useAuthContext();

  // Handle email verification token
  useEffect(() => {
    if (token && activeStep === 2) {
      setSession(token);
    }
  }, [token, activeStep]);

  const renderStep = () => {
    switch (activeStep) {
      case 1:
        return (
          <Step1Email
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            setEmailAddress={setEmailAddress}
          />
        );
      case 2:
        return (
          <Step2EmailVerification
            isInvited={isInvited}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            emailAddress={emailAddress}
          />
        );
      case 3:
        return (
          <Step3Password
            isInvited={isInvited}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            emailAddress={emailAddress}
          />
        );
      case 4:
        return (
          <Step4CompanyInfo
            isInvited={isInvited}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
        );
      case 5:
        return (
          <Step5AdditionalInfo
            isInvited={isInvited}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
        );
      case 6:
        return (
          <Step6Referral
            setReward={setReward}
            reward={reward}
            isInvited={isInvited}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
        );
      case 7:
        return (
          <Step7PlanSelection
            isInvited={isInvited}
            setSelectedItems={setSelectedItems}
            selectedItems={selectedItems}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            setClientSecret={setClientSecret}
          />
        );
      case 8:
        return (
          <Step8Payment
            reward={reward}
            isInvited={isInvited}
            selectedItems={selectedItems}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            clientSecret={clientSecret}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-4xl">
        {/* Step Indicator - only show after step 3 */}
        {activeStep > 3 && (
          <div className="mb-8">
            <StepIndicator activeStep={activeStep} steps={SIGNUP_STEPS} />
          </div>
        )}

        {/* Main Signup Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">
              {activeStep === 1 && 'Sign up for Public Circles'}
              {activeStep === 2 && 'Verify Your Email'}
              {activeStep === 3 && 'Create Password'}
              {activeStep === 4 && 'Company Information'}
              {activeStep === 5 && 'Additional Details'}
              {activeStep === 6 && 'Referral Code'}
              {activeStep === 7 && 'Choose Your Plan'}
              {activeStep === 8 && 'Complete Payment'}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Footer Link */}
        {activeStep === 1 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to={paths.auth.jwt.signIn}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { StepIndicator } from "./signup/step-indicator";
import { paths } from "@/routes/paths";
import { useAuthContext } from "@/auth/hooks/use-auth-context";
import { setSession } from "@/auth/utils/jwt";
import { REGION_KEY } from "@/config/config";
import { Logo } from "@/components/logo/logo";
import { verifyReferalCode } from "@/actions/signup";
import { RegionSelector } from "@/components/auth/region-selector";
import { LanguageSelector } from "@/components/auth/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

// Step components (will be created)
import { Step1Email } from "./signup/steps/step1-email";
import { Step2EmailVerification } from "./signup/steps/step2-email-verification";
import { Step3Password } from "./signup/steps/step3-password";
import { Step4CompanyInfo } from "./signup/steps/step4-company-info";
import { Step5AdditionalInfo } from "./signup/steps/step5-additional-info";
import { Step6Referral } from "./signup/steps/step6-referral";
import { Step7PlanSelection } from "./signup/steps/step7-plan-selection";
import { Step8Payment } from "./signup/steps/step8-payment";

const SIGNUP_STEPS = [
  { label: "Email", step: 1 },
  { label: "Verify", step: 2 },
  { label: "Password", step: 3 },
  { label: "Company", step: 4 },
  { label: "Details", step: 5 },
  { label: "Referral", step: 6 },
  { label: "Plan", step: 7 },
  { label: "Payment", step: 8 },
];

export default function SignUpPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const stepParam = searchParams.get("step");
  const emailParam = searchParams.get("emailAddress");
  const isInvited = searchParams.get("source") === "invite";
  const regionParam = searchParams.get("region");

  const [activeStep, setActiveStep] = useState(
    token ? 2 : stepParam ? Number(stepParam) : 1,
  );
  const [emailAddress, setEmailAddress] = useState(emailParam || "");
  const [clientSecret, setClientSecret] = useState("");
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [reward, setReward] = useState<any>(null);
  const { checkUserSession } = useAuthContext();

  // Handle region from URL params
  useEffect(() => {
    if (regionParam) {
      localStorage.setItem(REGION_KEY, regionParam.toUpperCase());
    }
  }, [regionParam]);

  // Handle email verification token
  useEffect(() => {
    if (token && activeStep === 2) {
      setSession(token);
    }
  }, [token, activeStep]);

  // Fetch reward from localStorage on mount (like old project)
  useEffect(() => {
    const fetchRewardFromStorage = async () => {
      const storedReferalCode = localStorage.getItem("referalCode");

      if (storedReferalCode) {
        try {
          const res = await verifyReferalCode({ referralCode: storedReferalCode });
          if (res?.status === 200) {
            setReward(res?.data?.data);
          } else {
            localStorage.removeItem("referalCode");
          }
        } catch (error) {
          console.error("Error fetching reward from localStorage:", error);
          localStorage.removeItem("referalCode");
        }
      }
    };

    fetchRewardFromStorage();
  }, []);

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
            reward={reward}
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

  const getStepTitle = () => {
    switch (activeStep) {
      case 1:
        return "Sign up for Public Circles";
      case 2:
        return "Verify Your Email";
      case 3:
        return "Create Password";
      case 4:
        return null; // No title for Company Information step
      case 5:
        return null; // No title for Additional Details step
      case 6:
        return null; // No title for Referral Code step
      case 7:
        return "Choose Your Plan";
      case 8:
        return "Complete Payment";
      default:
        return "Sign Up";
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 py-8 md:px-10">
      {/* Fixed Header - Currency, Language Selectors and Theme Toggle */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <RegionSelector disabled={activeStep >= 6} />
        <LanguageSelector />
        <ThemeToggle />
      </div>

      {/* Logo - always outside card */}
      <div className="flex items-center">
        <Logo isSingle={false} width={180} height={40} disableLink />
      </div>

      {/* Main Content */}
      <div className={`flex w-full flex-col gap-3 ${activeStep === 8 ? "max-w-5xl" : activeStep > 6 ? "max-w-3xl" : "max-w-md"}`}>
        {/* Step Indicator - only show after step 4 */}
        <StepIndicator activeStep={activeStep} steps={SIGNUP_STEPS} />

        {/* Main Signup Card */}
        <Card>
          {/* Header Section */}
          <CardHeader className="text-center">
            {/* Back Button - for steps > 4 */}
            {activeStep > 4 && (
              <div className="flex items-start mb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveStep(activeStep - 1)}
                  className="-ml-2 -mt-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
            {getStepTitle() && (
              <CardTitle>{getStepTitle()}</CardTitle>
            )}
            {activeStep === 1 && (
              <CardDescription>
                Enter your email below to create your account
              </CardDescription>
            )}
          </CardHeader>

          {/* Form Section */}
          <CardContent>{renderStep()}</CardContent>

          {/* Sign in link inside card for step 1 */}
          {activeStep === 1 && (
            <CardContent className="pt-0">
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to={paths.auth.jwt.signIn}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Sign in
                </Link>
              </p>
            </CardContent>
          )}
        </Card>

        {/* Footer Text */}
        {activeStep === 1 && (
          <p className="text-balance text-center text-xs text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a
              href="/terms"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Privacy Policy
            </a>.
          </p>
        )}
      </div>
    </div>
  );
}

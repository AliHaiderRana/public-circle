interface StepIndicatorProps {
  activeStep: number;
  steps: { label: string; step: number }[];
}

export function StepIndicator({ activeStep, steps }: StepIndicatorProps) {
  // Only show dots for steps 5-8 (last 4 steps)
  const visibleSteps = steps.filter((s) => s.step >= 5 && s.step <= 8);

  // Don't render if current step is before step 5
  if (activeStep < 5) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {visibleSteps.map((stepItem) => {
        const isCompleted = activeStep > stepItem.step;
        const isActive = activeStep === stepItem.step;

        return (
          <div
            key={stepItem.step}
            className={`
              w-2 h-2 rounded-full transition-all duration-200
              ${
                isCompleted || isActive
                  ? 'bg-sidebar-primary'
                  : 'bg-muted-foreground/30'
              }
            `}
          />
        );
      })}
    </div>
  );
}

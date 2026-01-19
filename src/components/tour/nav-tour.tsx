import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { skipTour, completeTour } from '@/actions/users';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import type { TourStep } from '@/types/tour';
import { toast } from 'sonner';

// ----------------------------------------------------------------------

interface NavTourProps {
  steps: TourStep[];
  isCompletedTour?: boolean;
}

// ----------------------------------------------------------------------

export function NavTour({ steps, isCompletedTour }: NavTourProps) {
  const [hoveredStepIndex, setHoveredStepIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { checkUserSession } = useAuthContext();

  // Memoize calculations for performance
  const { completedSteps, totalSteps, progressPercentage, allStepsCompleted } = useMemo(() => {
    const completed = steps?.filter((s) => s.isCompleted)?.length || 0;
    const total = steps?.length || 0;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    const allCompleted = completed === total && total > 0;
    return { completedSteps: completed, totalSteps: total, progressPercentage: progress, allStepsCompleted: allCompleted };
  }, [steps]);

  const handleEndTutorial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await skipTour();
      if (res) {
        toast.success('Tour skipped');
        await checkUserSession?.();
      }
    } catch (error) {
      console.error('Error skipping tour:', error);
      toast.error('Failed to skip tour. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [checkUserSession]);

  const handleCompleteTutorial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await completeTour();
      if (res) {
        toast.success('Tour completed!');
        await checkUserSession?.();
      }
    } catch (error) {
      console.error('Error completing tour:', error);
      toast.error('Failed to complete tour. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [checkUserSession]);

  const handleStepClick = useCallback((step: TourStep) => {
    if (step.link) {
      navigate(step.link);
    }
  }, [navigate]);

  return (
    <div 
      className="p-4 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#d1d5db transparent',
      }}
    >
      {/* Divider */}
      <div className="h-px bg-gray-200 mb-2" />

      {/* Title with Info Icon */}
      <div className="flex items-center gap-1 mb-4">
        <h3 className="text-sm font-semibold text-foreground">Get started</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p>These steps need to be completed in order to run campaigns</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Step List */}
      <div className="space-y-3 mb-4">
        {steps?.map((step, index) => {
          const isCompleted = step.isCompleted;
          const isHovered = hoveredStepIndex === index;

          return (
            <TooltipProvider key={step.title || index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    onMouseEnter={() => setHoveredStepIndex(index)}
                    onMouseLeave={() => setHoveredStepIndex(null)}
                    className="flex items-center gap-2 px-2 cursor-default"
                  >
                    {/* Step Number or Check */}
                    {isCompleted ? (
                      <span
                        className={cn(
                          'text-sm font-semibold text-[#D4E798D9]',
                          isHovered && 'font-black'
                        )}
                      >
                        ✓
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'text-sm text-gray-700',
                          isHovered && 'font-semibold'
                        )}
                      >
                        {index + 1}
                      </span>
                    )}

                    {/* Step Title */}
                    <button
                      onClick={() => handleStepClick(step)}
                      className={cn(
                        'text-sm text-left transition-colors px-2 py-1 rounded',
                        'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                        isCompleted
                          ? 'text-gray-400 line-through'
                          : 'text-gray-700',
                        isHovered && 'font-semibold',
                        isCompleted && 'ml-[-3px]'
                      )}
                      style={{ width: '180px' }}
                      aria-label={`${step.title}${isCompleted ? ' (completed)' : ''}`}
                      aria-describedby={`tour-step-${index}-description`}
                    >
                      {step.title}
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-md bg-[#D4E798] text-[#1b1e03] border-none"
                  id={`tour-step-${index}-description`}
                >
                  <div className="p-2">
                    <h4 className="font-bold text-base mb-1">{step.title}</h4>
                    <p className="text-sm leading-relaxed">{step.description}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full bg-[#D4E798D9] transition-all rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      {allStepsCompleted ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <LoadingButton
                  onClick={handleCompleteTutorial}
                  loading={loading}
                  className="w-full bg-black hover:bg-black/90 text-white"
                >
                  Complete
                </LoadingButton>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>This will complete the tour and you will not be able to see it again.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <LoadingButton
                  onClick={handleEndTutorial}
                  loading={loading}
                  variant="outline"
                  className="w-full"
                >
                  End Tutorial
                </LoadingButton>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>This will skip the tour and you will not be able to see it again.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

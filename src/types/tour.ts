export interface TourStep {
  title: string;
  description: string;
  isCompleted: boolean;
  link: string;
}

export interface TourSteps {
  isSkipped: boolean;
  isCompleted: boolean;
  steps: TourStep[];
}

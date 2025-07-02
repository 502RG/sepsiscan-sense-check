
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface NavigationControlsProps {
  onBack?: () => void;
  showBack?: boolean;
  currentStep?: string;
  totalSteps?: number;
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  onBack,
  showBack = false,
  currentStep,
  totalSteps = 5
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      {showBack ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      ) : (
        <div></div>
      )}
      
      {currentStep && (
        <div className="text-sm text-gray-500">
          Step {currentStep} of {totalSteps}
        </div>
      )}
    </div>
  );
};

export default NavigationControls;

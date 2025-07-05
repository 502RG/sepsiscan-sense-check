
import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Phone } from "lucide-react";

interface EmergencyConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  timeoutSeconds: number;
}

const EmergencyConfirmationDialog: React.FC<EmergencyConfirmationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  timeoutSeconds
}) => {
  const [countdown, setCountdown] = useState(timeoutSeconds);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(timeoutSeconds);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onConfirm(); // Auto-trigger emergency
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeoutSeconds, onConfirm]);

  const progressValue = ((timeoutSeconds - countdown) / timeoutSeconds) * 100;

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="border-red-500 bg-red-50">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-900">
            <AlertTriangle className="w-6 h-6" />
            🚨 EMERGENCY ALERT
          </AlertDialogTitle>
          <AlertDialogDescription className="text-red-800">
            <div className="space-y-4">
              <p className="font-semibold">
                Dangerous vital signs detected with serious symptoms!
              </p>
              <p>
                Emergency services will be contacted automatically in <strong>{countdown} seconds</strong> unless you respond.
              </p>
              <Progress value={progressValue} className="h-3 bg-red-200" />
              <div className="flex gap-3">
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-800 hover:bg-red-100"
                >
                  I'm OK - Cancel Alert
                </Button>
                <Button
                  onClick={onConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Emergency Now
                </Button>
              </div>
              <p className="text-xs text-red-700">
                If you're unable to respond, emergency contacts will be notified with your current status and location.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EmergencyConfirmationDialog;

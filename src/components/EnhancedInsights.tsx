
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Moon, Hospital, MapPin, Wifi, WifiOff } from "lucide-react";
import { RiskAssessment } from "@/types/sepsis";

interface EnhancedInsightsProps {
  riskAssessment: RiskAssessment;
  isOffline?: boolean;
  onUpdateThreshold?: () => void;
  onContactProvider?: () => void;
  onEnableLocation?: () => void;
}

const EnhancedInsights: React.FC<EnhancedInsightsProps> = ({
  riskAssessment,
  isOffline = false,
  onUpdateThreshold,
  onContactProvider,
  onEnableLocation
}) => {
  return (
    <div className="space-y-4">
      {/* Offline Mode Alert */}
      {isOffline && (
        <Card className="border-l-4 border-yellow-500 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-900">Offline Mode</h3>
                <p className="text-yellow-800 text-sm">
                  You're currently offline. No problem — SepsiScan will securely store your check-in and sync once you're reconnected.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Night Mode Message */}
      {riskAssessment.nightModeMessage && (
        <Card className="border-l-4 border-purple-500 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-semibold text-purple-900">Night Mode Enabled</h3>
                <p className="text-purple-800 text-sm">{riskAssessment.nightModeMessage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adaptive Threshold Suggestion */}
      {riskAssessment.adaptiveThresholdSuggestion && (
        <Card className="border-l-4 border-blue-500 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">Adaptive Threshold Suggestion</h3>
                  <p className="text-blue-800 text-sm">{riskAssessment.adaptiveThresholdSuggestion}</p>
                </div>
              </div>
              {onUpdateThreshold && (
                <Button 
                  size="sm" 
                  onClick={onUpdateThreshold}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Update Threshold
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Infection Timeline Estimate */}
      {riskAssessment.infectionTimelineEstimate && (
        <Card className="border-l-4 border-orange-500 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900">Infection Timeline Estimate</h3>
                <p className="text-orange-800 text-sm">{riskAssessment.infectionTimelineEstimate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Integration Suggestion */}
      {riskAssessment.providerIntegrationSuggestion && (
        <Card className="border-l-4 border-green-500 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <Hospital className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900">Provider Integration</h3>
                  <p className="text-green-800 text-sm">{riskAssessment.providerIntegrationSuggestion}</p>
                </div>
              </div>
              {onContactProvider && (
                <Button 
                  size="sm" 
                  onClick={onContactProvider}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Share Alert
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Geolocation Alerts Prompt */}
      <Card className="border-l-4 border-gray-500 bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Local Health Alerts</h3>
                <p className="text-gray-800 text-sm">
                  Enable location access to receive local outbreak alerts (e.g., bacterial infections, flu, or recent hospital infection spikes).
                </p>
              </div>
            </div>
            {onEnableLocation && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onEnableLocation}
                className="border-gray-400 text-gray-700 hover:bg-gray-100"
              >
                Enable Location
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedInsights;

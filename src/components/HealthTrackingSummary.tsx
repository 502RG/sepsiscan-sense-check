
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Calendar, Heart, Thermometer } from "lucide-react";
import { UserProfile, HistoricalData } from "@/types/sepsis";

interface HealthTrackingSummaryProps {
  profile: UserProfile;
  currentData: {
    temperature: number;
    heartRate: number;
    riskLevel: string;
  };
}

const HealthTrackingSummary: React.FC<HealthTrackingSummaryProps> = ({
  profile,
  currentData,
}) => {
  const getLatestEntry = (): HistoricalData | null => {
    if (profile.historicalData.length === 0) return null;
    return profile.historicalData[0]; // Assuming sorted by date descending
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendText = (current: number, previous: number, unit: string) => {
    const diff = Math.abs(current - previous);
    const direction = current > previous ? "increased" : current < previous ? "decreased" : "unchanged";
    
    if (diff === 0) return "No change";
    return `${direction.charAt(0).toUpperCase() + direction.slice(1)} by ${diff.toFixed(1)}${unit}`;
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'destructive';
      case 'Moderate': return 'default';
      case 'Low': return 'secondary';
      default: return 'secondary';
    }
  };

  const latestEntry = getLatestEntry();

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Health Tracking Summary - {profile.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Total Check-ins</div>
            <div className="text-2xl font-bold">{profile.historicalData.length}</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Current Risk Level</div>
            <Badge variant={getRiskBadgeColor(currentData.riskLevel)} className="text-sm px-3 py-1">
              {currentData.riskLevel} Risk
            </Badge>
          </div>
        </div>

        {profile.knownConditions.length > 0 && (
          <div>
            <div className="text-sm text-gray-600 mb-2">Medical Conditions</div>
            <div className="flex flex-wrap gap-2">
              {profile.knownConditions.map((condition, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {condition}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {latestEntry && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trends from Last Check-in ({latestEntry.date})
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Temperature:
                </span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(currentData.temperature, latestEntry.temperature)}
                  <span className="text-blue-800">
                    {getTrendText(currentData.temperature, latestEntry.temperature, "°F")}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Heart Rate:
                </span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(currentData.heartRate, latestEntry.heartRate)}
                  <span className="text-blue-800">
                    {getTrendText(currentData.heartRate, latestEntry.heartRate, " bpm")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {profile.baseline && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Personal Baseline</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
              <div>Temperature: {profile.baseline.temperature}°F</div>
              <div>Heart Rate: {profile.baseline.heartRate} bpm</div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">
            🔮 <strong>Coming Soon:</strong> Wearable sync, real-time provider alerts, and AI-powered early detection before symptoms worsen.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthTrackingSummary;

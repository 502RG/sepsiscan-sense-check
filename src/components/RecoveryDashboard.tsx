
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Heart, Moon, TrendingUp, Clock, AlertTriangle, UserCheck, Calendar, Activity } from "lucide-react";
import { UserProfile, RecoveryInsight } from "@/types/sepsis";
import { 
  calculateRecoveryScore, 
  generateRecoveryInsights, 
  getRecoveryScoreColor,
  getRecoveryScoreEmoji 
} from "@/utils/recoveryMode";
import { initializeRecoveryCoach } from "@/utils/recoveryCoach";
import { 
  calculateRecoveryWeek,
  generateRecoveryProgressMessage,
  generateWeeklyProgressSummary,
  getRecoveryProgressColor,
  getRecoveryProgressPercentage,
  RecoveryTimelineData
} from "@/utils/recoveryProgressTracker";
import RecoveryCoachDashboard from "./RecoveryCoachDashboard";
import { toast } from "@/hooks/use-toast";

interface RecoveryDashboardProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

const RecoveryDashboard: React.FC<RecoveryDashboardProps> = ({ profile, onUpdateProfile }) => {
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [timelineData, setTimelineData] = useState<RecoveryTimelineData>({
    daysSinceDischarge: 0,
    symptomsProgression: 'Same',
    restQuality: '6-8 hrs',
    hydrationAndNutrition: true,
    medicationCompliance: true,
    weekOfRecovery: 1
  });

  if (!profile.recoveryMode?.isEnabled) return null;

  const recoveryScore = calculateRecoveryScore(profile);
  const insights = generateRecoveryInsights(profile);
  const weekOfRecovery = profile.recoveryMode.startDate ? 
    calculateRecoveryWeek(profile.recoveryMode.startDate) : 1;

  const handleProgressTrackerSubmit = () => {
    const updatedTimelineData = {
      ...timelineData,
      weekOfRecovery
    };

    const progressMessage = generateRecoveryProgressMessage(updatedTimelineData, profile);
    const weeklyMessage = generateWeeklyProgressSummary(profile);
    
    // Update profile with timeline data
    const updatedProfile = {
      ...profile,
      recoveryMode: {
        ...profile.recoveryMode,
        lastRecoveryScore: getRecoveryProgressPercentage(weekOfRecovery, timelineData.symptomsProgression),
        recoveryWeek: weekOfRecovery
      }
    };
    
    onUpdateProfile(updatedProfile);
    
    toast({
      title: "Recovery Progress Updated",
      description: progressMessage,
    });
    
    setShowProgressTracker(false);
  };

  const handleEnableCoach = () => {
    const updatedProfile = {
      ...profile,
      recoveryMode: {
        ...profile.recoveryMode,
        coachEnabled: true
      }
    };
    const initializedProfile = initializeRecoveryCoach(updatedProfile);
    onUpdateProfile(initializedProfile);
  };

  const getInsightIcon = (type: RecoveryInsight['type']) => {
    switch (type) {
      case 'sleep': return <Moon className="w-4 h-4" />;
      case 'reinfection': return <AlertTriangle className="w-4 h-4" />;
      case 'behavior': return <Heart className="w-4 h-4" />;
      case 'hydration': return <Heart className="w-4 h-4" />;
      case 'nutrition': return <Heart className="w-4 h-4" />;
      case 'medication': return <Heart className="w-4 h-4" />;
      case 'mood': return <Heart className="w-4 h-4" />;
      case 'cognitive': return <AlertTriangle className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: RecoveryInsight['severity']) => {
    switch (severity) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const currentProgressPercentage = profile.recoveryMode.lastRecoveryScore || 
    getRecoveryProgressPercentage(weekOfRecovery, 'Same');

  // Progress Tracker Modal
  if (showProgressTracker) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Recovery Progress Tracker (Non-Diagnostic)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <p><strong>Purpose:</strong> Track your post-sepsis recovery journey with supportive, wellness-oriented feedback. This does not predict medical outcomes or make diagnostic claims.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>How many days ago were you discharged from the hospital or diagnosed with sepsis?</Label>
                <Input
                  type="number"
                  placeholder="Enter number of days"
                  value={timelineData.daysSinceDischarge || ''}
                  onChange={(e) => setTimelineData(prev => ({ 
                    ...prev, 
                    daysSinceDischarge: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Have your symptoms been improving, staying the same, or getting worse?</Label>
                <Select 
                  value={timelineData.symptomsProgression} 
                  onValueChange={(value: 'Improving' | 'Same' | 'Worse') => 
                    setTimelineData(prev => ({ ...prev, symptomsProgression: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Improving">✅ Improving</SelectItem>
                    <SelectItem value="Same">➖ Staying the same</SelectItem>
                    <SelectItem value="Worse">⚠️ Getting worse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>How much rest did you get last night?</Label>
                <Select 
                  value={timelineData.restQuality} 
                  onValueChange={(value: '<4 hrs' | '4-6 hrs' | '6-8 hrs' | '>8 hrs') => 
                    setTimelineData(prev => ({ ...prev, restQuality: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<4 hrs">😴 Less than 4 hours</SelectItem>
                    <SelectItem value="4-6 hrs">😪 4-6 hours</SelectItem>
                    <SelectItem value="6-8 hrs">😊 6-8 hours</SelectItem>
                    <SelectItem value=">8 hrs">😌 More than 8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Have you been drinking fluids and eating today?</Label>
                <Select 
                  value={timelineData.hydrationAndNutrition.toString()} 
                  onValueChange={(value) => 
                    setTimelineData(prev => ({ ...prev, hydrationAndNutrition: value === 'true' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">✅ Yes</SelectItem>
                    <SelectItem value="false">❌ No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Are you currently completing your medications or care plan?</Label>
                <Select 
                  value={timelineData.medicationCompliance.toString()} 
                  onValueChange={(value) => 
                    setTimelineData(prev => ({ ...prev, medicationCompliance: value === 'true' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">✅ Yes</SelectItem>
                    <SelectItem value="false">❌ No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
              <p><strong>Disclaimer:</strong> This timeline is for wellness tracking only and does not replace medical advice. Please consult your provider if you notice worsening symptoms.</p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowProgressTracker(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleProgressTrackerSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Update Progress
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recovery Coach Toggle */}
      {!profile.recoveryMode.coachEnabled && (
        <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-50 to-pink-50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-600" />
              Sepsis Recovery Coach Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-700">
                Get personalized post-sepsis recovery support with daily check-ins, milestone tracking, 
                symptom monitoring, and 24/7 guidance from your AI Recovery Coach.
              </p>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Includes:</strong> Daily wellness check-ins • Medication reminders • 
                  Nutrition guidance • Sleep optimization • Red flag detection • Provider escalation
                </p>
              </div>
              <Button 
                onClick={handleEnableCoach}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Enable Recovery Coach
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recovery Coach Dashboard */}
      {profile.recoveryMode.coachEnabled && (
        <RecoveryCoachDashboard 
          profile={profile} 
          onUpdateProfile={onUpdateProfile} 
        />
      )}

      {/* Recovery Progress Timeline Tracker */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-green-50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Recovery Progress Timeline
            </div>
            <Badge variant="secondary">Week {weekOfRecovery}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Recovery Progress</span>
              <Button 
                onClick={() => setShowProgressTracker(true)}
                variant="outline"
                size="sm"
              >
                Update Progress
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Week {weekOfRecovery} of typical 6-week recovery</span>
                <span className="font-medium">{Math.round(currentProgressPercentage)}%</span>
              </div>
              <Progress value={currentProgressPercentage} className="h-3" />
            </div>

            {/* Progress Explanation */}
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Your Recovery Journey</h4>
              <p className="text-sm text-gray-700 mb-3">
                {generateRecoveryProgressMessage({
                  daysSinceDischarge: timelineData.daysSinceDischarge,
                  symptomsProgression: timelineData.symptomsProgression,
                  restQuality: timelineData.restQuality,
                  hydrationAndNutrition: timelineData.hydrationAndNutrition,
                  medicationCompliance: timelineData.medicationCompliance,
                  weekOfRecovery
                }, profile)}
              </p>
              <p className="text-xs text-blue-600 font-medium">
                {generateWeeklyProgressSummary(profile)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-green-100 p-2 rounded">
                <div className="text-green-800 font-medium">Weeks 1-2</div>
                <div className="text-green-600">Initial Recovery</div>
              </div>
              <div className="bg-blue-100 p-2 rounded">
                <div className="text-blue-800 font-medium">Weeks 3-4</div>
                <div className="text-blue-600">Building Strength</div>
              </div>
              <div className="bg-purple-100 p-2 rounded">
                <div className="text-purple-800 font-medium">Weeks 5-6</div>
                <div className="text-purple-600">Stabilizing</div>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> This timeline is for wellness tracking only and does not replace medical advice. Recovery times vary by individual.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Insights */}
      {insights.length > 0 && (
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle>Recovery Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${getSeverityColor(insight.severity)}`}
              >
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{insight.message}</p>
                    {insight.actionRequired && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Action Recommended
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Check-in Frequency */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Check-in Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Current Frequency:</span>
              <Badge variant="secondary">
                {profile.recoveryMode.checkInFrequency.replace('-', ' to ')}
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>
                Your check-in frequency automatically adjusts based on your recovery progress. 
                As you improve, we'll reduce notifications to avoid overwhelming you.
              </p>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                💡 <strong>Recovery Tip:</strong> Consistent logging helps us track your progress 
                and catch any concerning patterns early.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecoveryDashboard;

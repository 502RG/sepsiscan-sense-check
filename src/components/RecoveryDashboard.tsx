
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Heart, Moon, TrendingUp, Clock, AlertTriangle, UserCheck } from "lucide-react";
import { UserProfile, RecoveryInsight } from "@/types/sepsis";
import { 
  calculateRecoveryScore, 
  generateRecoveryInsights, 
  getRecoveryScoreColor,
  getRecoveryScoreEmoji 
} from "@/utils/recoveryMode";
import { initializeRecoveryCoach } from "@/utils/recoveryCoach";
import RecoveryCoachDashboard from "./RecoveryCoachDashboard";

interface RecoveryDashboardProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

const RecoveryDashboard: React.FC<RecoveryDashboardProps> = ({ profile, onUpdateProfile }) => {
  if (!profile.recoveryMode?.isEnabled) return null;

  const recoveryScore = calculateRecoveryScore(profile);
  const insights = generateRecoveryInsights(profile);

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

      {/* Recovery Score */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Recovery Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                Weekly Recovery Score
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${getRecoveryScoreColor(recoveryScore)}`}>
                  {recoveryScore}/100
                </span>
                <span className="text-2xl">{getRecoveryScoreEmoji(recoveryScore)}</span>
              </div>
            </div>
            
            <Progress value={recoveryScore} className="h-3" />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-green-600">🟢 Recovering</div>
                <div className="text-xs text-gray-600">80-100</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-600">🟡 Needs Attention</div>
                <div className="text-xs text-gray-600">60-79</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-600">🔴 Flagged</div>
                <div className="text-xs text-gray-600">Below 60</div>
              </div>
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


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Moon, TrendingUp, Clock, AlertTriangle, UserCheck, Calendar, Activity, MessageCircle } from "lucide-react";
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
  generateWeeklyProgressSummary,
  generateTrendFeedback
} from "@/utils/recoveryProgressTracker";
import RecoveryCoachDashboard from "./RecoveryCoachDashboard";
import ConversationalCheckIn from "./ConversationalCheckIn";
import { toast } from "@/hooks/use-toast";

interface RecoveryDashboardProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

const RecoveryDashboard: React.FC<RecoveryDashboardProps> = ({ profile, onUpdateProfile }) => {
  const [showCheckIn, setShowCheckIn] = useState(false);

  if (!profile.recoveryMode?.isEnabled) return null;

  const recoveryScore = calculateRecoveryScore(profile);
  const insights = generateRecoveryInsights(profile);
  const trendFeedback = generateTrendFeedback(profile);

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

  // Show conversational check-in if requested
  if (showCheckIn) {
    return (
      <div className="space-y-6">
        <ConversationalCheckIn 
          profile={profile}
          onUpdateProfile={onUpdateProfile}
          onClose={() => setShowCheckIn(false)}
        />
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

      {/* Conversational Recovery Check-In */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-green-50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Recovery Journey Check-In
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Conversational AI
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center space-y-3">
              <div className="text-lg font-semibold text-gray-900">
                Ready for your personalized check-in? 💬
              </div>
              <p className="text-gray-600">
                Our conversational AI adapts to your recovery journey, remembers your progress, 
                and provides personalized feedback - just like chatting with a caring friend.
              </p>
            </div>

            {/* Recent Progress Highlights */}
            {trendFeedback.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Recent Progress Highlights
                </h4>
                <div className="space-y-1">
                  {trendFeedback.slice(0, 2).map((feedback, index) => (
                    <p key={index} className="text-green-800 text-sm">• {feedback}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold text-gray-900 mb-2">Smart Features:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Memory-driven:</strong> Remembers your previous responses</li>
                <li>• <strong>Trend awareness:</strong> Celebrates improvements and notices patterns</li>
                <li>• <strong>Adaptive:</strong> Quick check-ins when you're stable</li>
                <li>• <strong>Natural:</strong> Chat in your own words, no rigid forms</li>
              </ul>
            </div>

            <Button 
              onClick={() => setShowCheckIn(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start Conversational Check-In
            </Button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Weekly progress summary: {generateWeeklyProgressSummary(profile)}
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
            Adaptive Check-in Schedule
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
                Your check-in frequency automatically adapts based on your recovery progress. 
                As you improve, we'll reduce notifications while maintaining supportive care.
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Smart Adaptation:</strong> Consistent progress unlocks quick "All Good" 
                check-ins to reduce survey fatigue while keeping you supported.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecoveryDashboard;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Heart, Moon, TrendingUp, Clock, AlertTriangle, UserCheck, Calendar, Activity, MessageCircle, Zap } from "lucide-react";
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
  generateConversationalGreeting,
  generateFollowUpQuestion,
  generateTrendFeedback,
  shouldOfferQuickCheckIn,
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
  const [checkInStep, setCheckInStep] = useState<'greeting' | 'quick' | 'detailed'>('greeting');
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
  const weekOfRecovery = calculateRecoveryWeek(timelineData.daysSinceDischarge);
  
  const conversationalGreeting = generateConversationalGreeting(profile);
  const followUpQuestion = generateFollowUpQuestion(profile);
  const trendFeedback = generateTrendFeedback(profile);
  const canUseQuickCheckIn = shouldOfferQuickCheckIn(profile);

  const handleQuickCheckIn = (status: 'good' | 'update') => {
    if (status === 'good') {
      // Process quick "all good" check-in
      const quickTimelineData = {
        ...timelineData,
        symptomsProgression: 'Same' as const,
        weekOfRecovery
      };
      
      const updatedProfile = {
        ...profile,
        recoveryMode: {
          ...profile.recoveryMode,
          lastRecoveryScore: 75, // Stable score for "all good"
          recoveryWeek: weekOfRecovery
        }
      };
      
      onUpdateProfile(updatedProfile);
      
      toast({
        title: "Quick Check-In Complete! 👍",
        description: "Thanks for the update. Keep up the great work!",
      });
      
      setShowProgressTracker(false);
    } else {
      setCheckInStep('detailed');
    }
  };

  const handleDetailedCheckInSubmit = () => {
    const updatedTimelineData = {
      ...timelineData,
      weekOfRecovery
    };

    const progressMessage = generateRecoveryProgressMessage(updatedTimelineData, profile);
    
    // Calculate dynamic score based on responses
    let recoveryScore = 50; // Base score
    if (timelineData.symptomsProgression === 'Improving') recoveryScore += 25;
    if (timelineData.symptomsProgression === 'Worse') recoveryScore -= 20;
    if (timelineData.hydrationAndNutrition) recoveryScore += 10;
    if (timelineData.medicationCompliance) recoveryScore += 15;
    if (timelineData.restQuality === '>8 hrs' || timelineData.restQuality === '6-8 hrs') recoveryScore += 10;
    
    const updatedProfile = {
      ...profile,
      recoveryMode: {
        ...profile.recoveryMode,
        lastRecoveryScore: Math.min(Math.max(recoveryScore, 0), 100),
        recoveryWeek: weekOfRecovery
      }
    };
    
    onUpdateProfile(updatedProfile);
    
    toast({
      title: "Recovery Progress Updated",
      description: progressMessage,
    });
    
    setShowProgressTracker(false);
    setCheckInStep('greeting');
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

  // Dynamic Progress Tracker Modal
  if (showProgressTracker) {
    if (checkInStep === 'greeting') {
      return (
        <div className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                Recovery Check-In
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="text-lg font-medium text-gray-900">
                  {conversationalGreeting}
                </div>
                
                {trendFeedback.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg space-y-2">
                    {trendFeedback.map((feedback, index) => (
                      <p key={index} className="text-green-800 text-sm">{feedback}</p>
                    ))}
                  </div>
                )}
                
                <div className="text-gray-600">
                  {followUpQuestion}
                </div>
              </div>

              {canUseQuickCheckIn ? (
                <div className="space-y-3">
                  <div className="text-center text-sm text-gray-500 mb-4">
                    Since you've been doing well, here's a quick option:
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      onClick={() => handleQuickCheckIn('good')}
                      className="h-auto p-4 bg-green-600 hover:bg-green-700"
                    >
                      <div className="text-center">
                        <Zap className="w-6 h-6 mx-auto mb-2" />
                        <div className="font-medium">✅ All Good Today!</div>
                        <div className="text-xs opacity-90">Feeling stable, following care plan</div>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => setCheckInStep('detailed')}
                      variant="outline"
                      className="h-auto p-4"
                    >
                      <div className="text-center">
                        <Activity className="w-6 h-6 mx-auto mb-2" />
                        <div className="font-medium">📝 Need to Update Something</div>
                        <div className="text-xs opacity-70">Detailed check-in</div>
                      </div>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowProgressTracker(false)}
                    className="flex-1"
                  >
                    Maybe Later
                  </Button>
                  <Button 
                    onClick={() => setCheckInStep('detailed')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Let's Check In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (checkInStep === 'detailed') {
      return (
        <div className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Recovery Progress Check-In
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
                  onClick={() => setCheckInStep('greeting')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleDetailedCheckInSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Complete Check-In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
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

      {/* Dynamic Recovery Progress Timeline */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-green-50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Recovery Journey Timeline
            </div>
            <Badge variant="secondary">Week {weekOfRecovery}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Let's Check In</span>
              <Button 
                onClick={() => setShowProgressTracker(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Check-In
              </Button>
            </div>

            {/* Recovery Explanation */}
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

            {/* Trend Feedback */}
            {trendFeedback.length > 0 && (
              <div className="bg-green-50 p-3 rounded-lg">
                <h5 className="font-medium text-green-900 mb-2">Recent Progress 📈</h5>
                {trendFeedback.map((feedback, index) => (
                  <p key={index} className="text-green-800 text-sm">{feedback}</p>
                ))}
              </div>
            )}

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

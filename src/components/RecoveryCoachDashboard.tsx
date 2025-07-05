
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Heart, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Droplet,
  MessageSquare,
  TrendingUp,
  Bell
} from "lucide-react";
import { UserProfile, RecoveryInsight } from "@/types/sepsis";
import { 
  processRecoveryCheckIn, 
  generateWeeklyProgressSummary,
  generateWeeklyMilestones,
  getRecoveryFAQResponse,
  shouldEscalateToProvider,
  RECOVERY_SYMPTOMS
} from "@/utils/recoveryCoach";
import { toast } from "@/hooks/use-toast";

interface RecoveryCoachDashboardProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

const RecoveryCoachDashboard: React.FC<RecoveryCoachDashboardProps> = ({ 
  profile, 
  onUpdateProfile 
}) => {
  const [checkInStep, setCheckInStep] = useState<'overview' | 'checkin' | 'faq'>('overview');
  const [checkInData, setCheckInData] = useState({
    overallFeeling: '' as 'Great' | 'Okay' | 'Off' | 'Sick' | '',
    recoverySymptoms: [] as string[],
    medicationCompliance: false,
    hydrationCompliance: false,
    nutritionCompliance: false,
    restHours: 7,
    tookNaps: false,
    moodRating: 5,
    woundChecked: false,
    cognitiveIssues: false
  });
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqResponse, setFaqResponse] = useState('');

  if (!profile.recoveryMode?.coachEnabled) return null;

  const weeklyProgress = generateWeeklyProgressSummary(profile);
  const currentWeek = profile.recoveryMode.recoveryWeek || 1;
  const milestones = generateWeeklyMilestones(profile, currentWeek);
  const needsEscalation = shouldEscalateToProvider(profile);

  const handleCheckInSubmit = () => {
    if (!checkInData.overallFeeling) {
      toast({
        title: "Incomplete Check-in",
        description: "Please select how you're feeling overall.",
        variant: "destructive"
      });
      return;
    }

    const result = processRecoveryCheckIn(profile, checkInData);
    
    onUpdateProfile(result.updatedProfile);
    
    if (result.redFlags.length > 0) {
      toast({
        title: "🚨 Important Health Alert",
        description: result.redFlags[0],
        variant: "destructive"
      });
    } else {
      toast({
        title: "Check-in Complete",
        description: "Your recovery data has been logged successfully.",
      });
    }

    setCheckInStep('overview');
    setCheckInData({
      overallFeeling: '',
      recoverySymptoms: [],
      medicationCompliance: false,
      hydrationCompliance: false,
      nutritionCompliance: false,
      restHours: 7,
      tookNaps: false,
      moodRating: 5,
      woundChecked: false,
      cognitiveIssues: false
    });
  };

  const handleSymptomToggle = (symptom: string) => {
    setCheckInData(prev => ({
      ...prev,
      recoverySymptoms: prev.recoverySymptoms.includes(symptom)
        ? prev.recoverySymptoms.filter(s => s !== symptom)
        : [...prev.recoverySymptoms, symptom]
    }));
  };

  const handleFAQSubmit = () => {
    if (!faqQuestion.trim()) return;
    const response = getRecoveryFAQResponse(faqQuestion);
    setFaqResponse(response);
  };

  if (checkInStep === 'checkin') {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Daily Recovery Check-In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Feeling */}
            <div className="space-y-3">
              <Label className="text-base font-medium">How are you feeling today overall?</Label>
              <Select 
                value={checkInData.overallFeeling} 
                onValueChange={(value: 'Great' | 'Okay' | 'Off' | 'Sick') => 
                  setCheckInData(prev => ({ ...prev, overallFeeling: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select how you feel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Great">😊 Great</SelectItem>
                  <SelectItem value="Okay">🙂 Okay</SelectItem>
                  <SelectItem value="Off">😐 A bit off</SelectItem>
                  <SelectItem value="Sick">😷 Sick</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recovery Symptoms */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Any of these symptoms today?</Label>
              <div className="grid grid-cols-2 gap-3">
                {RECOVERY_SYMPTOMS.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom}
                      checked={checkInData.recoverySymptoms.includes(symptom)}
                      onCheckedChange={() => handleSymptomToggle(symptom)}
                    />
                    <Label htmlFor={symptom} className="text-sm">{symptom}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Daily Compliance */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="medications"
                  checked={checkInData.medicationCompliance}
                  onCheckedChange={(checked) => 
                    setCheckInData(prev => ({ ...prev, medicationCompliance: checked as boolean }))
                  }
                />
                <Label htmlFor="medications">Completed prescribed medications today</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hydration"
                  checked={checkInData.hydrationCompliance}
                  onCheckedChange={(checked) => 
                    setCheckInData(prev => ({ ...prev, hydrationCompliance: checked as boolean }))
                  }
                />
                <Label htmlFor="hydration">Drinking enough water today</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="nutrition"
                  checked={checkInData.nutritionCompliance}
                  onCheckedChange={(checked) => 
                    setCheckInData(prev => ({ ...prev, nutritionCompliance: checked as boolean }))
                  }
                />
                <Label htmlFor="nutrition">Eating well today</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="wound"
                  checked={checkInData.woundChecked}
                  onCheckedChange={(checked) => 
                    setCheckInData(prev => ({ ...prev, woundChecked: checked as boolean }))
                  }
                />
                <Label htmlFor="wound">Checked wound/incision site today</Label>
              </div>
            </div>

            <Separator />

            {/* Rest and Mood */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Hours of rest last night</Label>
                <Select 
                  value={checkInData.restHours.toString()} 
                  onValueChange={(value) => 
                    setCheckInData(prev => ({ ...prev, restHours: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Less than 4 hours</SelectItem>
                    <SelectItem value="5">4-6 hours</SelectItem>
                    <SelectItem value="7">6-8 hours</SelectItem>
                    <SelectItem value="9">More than 8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="naps"
                  checked={checkInData.tookNaps}
                  onCheckedChange={(checked) => 
                    setCheckInData(prev => ({ ...prev, tookNaps: checked as boolean }))
                  }
                />
                <Label htmlFor="naps">Took breaks/naps during the day</Label>
              </div>

              <div className="space-y-2">
                <Label>Mood today (1-10 scale)</Label>
                <div className="flex items-center space-x-2">
                  <span>😢 1</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={checkInData.moodRating}
                    onChange={(e) => 
                      setCheckInData(prev => ({ ...prev, moodRating: parseInt(e.target.value) }))
                    }
                    className="flex-1"
                  />
                  <span>😊 10</span>
                  <Badge variant="outline">{checkInData.moodRating}</Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCheckInStep('overview')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCheckInSubmit}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Complete Check-In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkInStep === 'faq') {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Ask Your Recovery Coach
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>What would you like to know about your recovery?</Label>
              <Textarea
                placeholder="e.g., What should I eat post-sepsis? When can I return to work? Is mild pain normal?"
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                className="min-h-20"
              />
            </div>

            {faqResponse && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Recovery Coach Response:</h4>
                <p className="text-blue-800">{faqResponse}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCheckInStep('overview')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleFAQSubmit}
                disabled={!faqQuestion.trim()}
                className="flex-1"
              >
                Ask Question
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Escalation Alert */}
      {needsEscalation && (
        <Card className="border-l-4 border-red-500 bg-red-50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-bold text-red-900">Provider Consultation Recommended</h3>
                <p className="text-red-800 mt-1">
                  Your recent symptoms warrant professional attention. Consider scheduling a telehealth visit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recovery Coach Overview */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Sepsis Recovery Coach
            </div>
            <Badge variant="secondary">Week {currentWeek}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => setCheckInStep('checkin')}
              className="h-auto p-4 bg-green-600 hover:bg-green-700"
            >
              <div className="text-center">
                <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium">Daily Check-In</div>
                <div className="text-xs opacity-90">Track your progress</div>
              </div>
            </Button>

            <Button 
              onClick={() => setCheckInStep('faq')}
              variant="outline"
              className="h-auto p-4"
            >
              <div className="text-center">
                <MessageSquare className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium">Ask Coach</div>
                <div className="text-xs opacity-70">Get recovery guidance</div>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="h-auto p-4"
              onClick={() => toast({
                title: "Medication Reminders",
                description: "This feature will help you set up daily medication alerts.",
              })}
            >
              <div className="text-center">
                <Bell className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium">Reminders</div>
                <div className="text-xs opacity-70">Set medication alerts</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      {weeklyProgress.length > 0 && (
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              This Week's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklyProgress.map((progress, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-blue-800">{progress}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Milestones */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Week {currentWeek} Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <span className="text-sm">{milestone}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-blue-50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-green-600" />
            Recovery Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>💧 <strong>Hydration:</strong> Aim for 8-10 glasses of water daily</p>
            <p>🍎 <strong>Nutrition:</strong> Focus on protein-rich, easy-to-digest foods</p>
            <p>😴 <strong>Rest:</strong> 7-8 hours sleep + short naps when needed</p>
            <p>🩹 <strong>Wound Care:</strong> Check daily for signs of infection</p>
            <p>💊 <strong>Medications:</strong> Take as prescribed, set reminders if needed</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecoveryCoachDashboard;

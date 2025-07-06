
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, Heart, CheckCircle, AlertTriangle, Calendar, TrendingUp } from "lucide-react";
import { UserProfile } from "@/types/sepsis";
import { 
  generateConversationalGreeting,
  generateFollowUpQuestion,
  generateTrendFeedback,
  shouldOfferQuickCheckIn,
  calculateRecoveryWeek
} from "@/utils/recoveryProgressTracker";
import { toast } from "@/hooks/use-toast";

interface ConversationalCheckInProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onClose: () => void;
}

type CheckInStep = 'greeting' | 'quick-response' | 'symptom-chat' | 'follow-up' | 'summary';
type ResponseType = 'all-good' | 'need-update' | 'concerning';

const ConversationalCheckIn: React.FC<ConversationalCheckInProps> = ({ 
  profile, 
  onUpdateProfile, 
  onClose 
}) => {
  const [currentStep, setCurrentStep] = useState<CheckInStep>('greeting');
  const [daysSinceDischarge, setDaysSinceDischarge] = useState(7);
  const [userResponses, setUserResponses] = useState<{
    overallFeeling: string;
    specificSymptoms: string;
    sleepQuality: string;
    hydrationStatus: string;
    medicationCompliance: string;
    customNotes: string;
  }>({
    overallFeeling: '',
    specificSymptoms: '',
    sleepQuality: '',
    hydrationStatus: '',
    medicationCompliance: '',
    customNotes: ''
  });

  const conversationalGreeting = generateConversationalGreeting(profile);
  const followUpQuestion = generateFollowUpQuestion(profile);
  const trendFeedback = generateTrendFeedback(profile);
  const canUseQuickCheckIn = shouldOfferQuickCheckIn(profile);
  const recoveryWeek = calculateRecoveryWeek(daysSinceDischarge);
  const progressPercentage = Math.min((recoveryWeek / 6) * 100, 100);

  const handleQuickResponse = (response: ResponseType) => {
    if (response === 'all-good') {
      // Process quick "all good" response
      const updatedProfile = {
        ...profile,
        recoveryMode: {
          ...profile.recoveryMode,
          lastRecoveryScore: 80,
          recoveryWeek
        }
      };
      
      onUpdateProfile(updatedProfile);
      
      toast({
        title: "Thanks for checking in! 💚",
        description: "Your progress looks great. Keep up the excellent work with your recovery routine!",
      });
      
      onClose();
    } else if (response === 'need-update') {
      setCurrentStep('symptom-chat');
    } else {
      setCurrentStep('follow-up');
    }
  };

  const handleSymptomUpdate = (symptomType: string, value: string) => {
    setUserResponses(prev => ({
      ...prev,
      [symptomType]: value
    }));
  };

  const generatePersonalizedResponse = (responses: typeof userResponses): string => {
    const responses_array = [];
    
    if (responses.overallFeeling.includes('better') || responses.overallFeeling.includes('good')) {
      responses_array.push("It's wonderful to hear you're feeling better!");
    }
    
    if (responses.sleepQuality.includes('improved') || responses.sleepQuality.includes('better')) {
      responses_array.push("Better sleep is a great sign for your recovery.");
    }
    
    if (responses.hydrationStatus.includes('yes') || responses.hydrationStatus.includes('drinking')) {
      responses_array.push("Staying hydrated is so important - keep it up!");
    }
    
    if (responses.medicationCompliance.includes('yes') || responses.medicationCompliance.includes('taking')) {
      responses_array.push("Following your medication routine shows great commitment to your recovery.");
    }

    return responses_array.length > 0 
      ? responses_array.join(' ') 
      : "Thanks for sharing - this helps us track your recovery journey.";
  };

  const handleCompleteCheckIn = () => {
    const personalizedMessage = generatePersonalizedResponse(userResponses);
    
    // Calculate recovery score based on responses
    let recoveryScore = 50;
    if (userResponses.overallFeeling.includes('better') || userResponses.overallFeeling.includes('good')) recoveryScore += 20;
    if (userResponses.sleepQuality.includes('improved') || userResponses.sleepQuality.includes('better')) recoveryScore += 15;
    if (userResponses.hydrationStatus.includes('yes')) recoveryScore += 10;
    if (userResponses.medicationCompliance.includes('yes')) recoveryScore += 15;
    
    const updatedProfile = {
      ...profile,
      recoveryMode: {
        ...profile.recoveryMode,
        lastRecoveryScore: Math.min(recoveryScore, 100),
        recoveryWeek
      }
    };
    
    onUpdateProfile(updatedProfile);
    
    toast({
      title: "Check-in Complete! 🌟",
      description: personalizedMessage,
    });
    
    onClose();
  };

  const renderGreetingStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="text-lg font-medium text-gray-900">
          {conversationalGreeting}
        </div>
        
        {trendFeedback.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">Your Progress This Week</span>
            </div>
            {trendFeedback.map((feedback, index) => (
              <p key={index} className="text-green-800 text-sm">{feedback}</p>
            ))}
          </div>
        )}
        
        <div className="text-gray-600 text-base">
          {followUpQuestion}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-center text-sm text-gray-500 mb-4">
          First, how many days has it been since your hospital discharge?
        </div>
        
        <div className="flex items-center gap-3 justify-center">
          <Input
            type="number"
            placeholder="Days"
            value={daysSinceDischarge}
            onChange={(e) => setDaysSinceDischarge(parseInt(e.target.value) || 0)}
            className="w-20 text-center"
          />
          <span className="text-sm text-gray-600">days ago</span>
        </div>

        {/* Recovery Progress Bar */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Recovery Timeline</span>
            <Badge variant="secondary">Week {recoveryWeek} of 6</Badge>
          </div>
          <Progress value={progressPercentage} className="h-3 mb-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Week 1-2: Initial</span>
            <span>Week 3-4: Building</span>
            <span>Week 5-6: Stabilizing</span>
          </div>
        </div>
      </div>

      {canUseQuickCheckIn ? (
        <div className="space-y-3">
          <div className="text-center text-sm text-gray-500 mb-4">
            Since you've been doing well lately:
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Button 
              onClick={() => handleQuickResponse('all-good')}
              className="h-auto p-4 bg-green-600 hover:bg-green-700"
            >
              <div className="text-center">
                <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium">✅ All Good Today!</div>
                <div className="text-xs opacity-90">Feeling stable, following my care routine</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => handleQuickResponse('need-update')}
              variant="outline"
              className="h-auto p-4"
            >
              <div className="text-center">
                <MessageCircle className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium">📝 Something to Share</div>
                <div className="text-xs opacity-70">Let me tell you how I'm doing</div>
              </div>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button 
            onClick={() => setCurrentStep('symptom-chat')}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Let's Chat
          </Button>
        </div>
      )}
    </div>
  );

  const renderSymptomChatStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Thanks for sharing more details! 😊
        </h3>
        <p className="text-gray-600">
          I'd love to hear how you've been feeling. Just chat naturally - no need for formal answers.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            How have you been feeling overall today?
          </label>
          <Input
            placeholder="E.g., 'Feeling a bit better than yesterday' or 'Still quite tired'"
            value={userResponses.overallFeeling}
            onChange={(e) => handleSymptomUpdate('overallFeeling', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Any specific symptoms you'd like to mention?
          </label>
          <Input
            placeholder="E.g., 'Headache this morning' or 'Less dizzy than before'"
            value={userResponses.specificSymptoms}
            onChange={(e) => handleSymptomUpdate('specificSymptoms', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            How did you sleep last night?
          </label>
          <Input
            placeholder="E.g., 'Slept better, about 7 hours' or 'Still waking up a lot'"
            value={userResponses.sleepQuality}
            onChange={(e) => handleSymptomUpdate('sleepQuality', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            How's your hydration and eating going?
          </label>
          <Input
            placeholder="E.g., 'Drinking more water today' or 'Not much appetite yet'"
            value={userResponses.hydrationStatus}
            onChange={(e) => handleSymptomUpdate('hydrationStatus', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            How are you doing with your medications?
          </label>
          <Input
            placeholder="E.g., 'Taking everything as prescribed' or 'Forgot this morning'"
            value={userResponses.medicationCompliance}
            onChange={(e) => handleSymptomUpdate('medicationCompliance', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Anything else you'd like to share?
          </label>
          <Input
            placeholder="E.g., 'Walked around the block today!' or 'Feeling anxious'"
            value={userResponses.customNotes}
            onChange={(e) => handleSymptomUpdate('customNotes', e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Remember:</strong> This helps us track your wellness journey. 
          Always contact your provider if you have urgent concerns.
        </p>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('greeting')}
          className="flex-1"
        >
          Back
        </Button>
        <Button 
          onClick={handleCompleteCheckIn}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          disabled={!userResponses.overallFeeling.trim()}
        >
          Complete Check-In
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="shadow-lg border-0 bg-white/95 backdrop-blur max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Recovery Check-In
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentStep === 'greeting' && renderGreetingStep()}
        {currentStep === 'symptom-chat' && renderSymptomChatStep()}
      </CardContent>
    </Card>
  );
};

export default ConversationalCheckIn;

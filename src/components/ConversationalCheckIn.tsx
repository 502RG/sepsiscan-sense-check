
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, Heart, CheckCircle, AlertTriangle, Calendar, TrendingUp, Flag } from "lucide-react";
import { UserProfile } from "@/types/sepsis";
import { 
  generateConversationalGreeting,
  generateFollowUpQuestion,
  generateTrendFeedback,
  shouldOfferQuickCheckIn,
  calculateRecoveryWeek,
  generateRiskAwareResponse,
  generateAdaptiveQuestions,
  detectRedFlags
} from "@/utils/recoveryProgressTracker";
import { toast } from "@/hooks/use-toast";

interface ConversationalCheckInProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onClose: () => void;
}

type CheckInStep = 'greeting' | 'quick-response' | 'adaptive-chat' | 'follow-up' | 'red-flag-alert' | 'recovery-insights';
type ResponseType = 'all-good' | 'need-update' | 'not-feeling-great';

const ConversationalCheckIn: React.FC<ConversationalCheckInProps> = ({ 
  profile, 
  onUpdateProfile, 
  onClose 
}) => {
  const [currentStep, setCurrentStep] = useState<CheckInStep>('greeting');
  const [daysSinceDischarge, setDaysSinceDischarge] = useState(7);
  const [currentResponse, setCurrentResponse] = useState('');
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [recoveryInsights, setRecoveryInsights] = useState<{type: 'positive' | 'concern', message: string, recommendations: string[]}>({
    type: 'positive',
    message: '',
    recommendations: []
  });

  const conversationalGreeting = generateConversationalGreeting(profile);
  const followUpQuestion = generateFollowUpQuestion(profile);
  const trendFeedback = generateTrendFeedback(profile);
  const canUseQuickCheckIn = shouldOfferQuickCheckIn(profile);
  const recoveryWeek = calculateRecoveryWeek(daysSinceDischarge);
  const progressPercentage = Math.min((recoveryWeek / 6) * 100, 100);
  const adaptiveQuestions = generateAdaptiveQuestions(profile);

  const generateRecoveryInsights = (response: string, isQuickGood = false) => {
    const responseLower = response.toLowerCase();
    
    // Positive/encouraging insights
    if (isQuickGood || responseLower.includes('better') || responseLower.includes('good') || responseLower.includes('stable')) {
      setRecoveryInsights({
        type: 'positive',
        message: "Your recovery journey is on a positive track! 🌟",
        recommendations: [
          "Continue following your current care routine - it's working well",
          "Keep staying hydrated and getting adequate rest",
          "Remember that recovery is a gradual process, and you're doing great",
          "Consider keeping a daily journal to track your progress"
        ]
      });
    }
    // Concerning insights
    else if (responseLower.includes('tired') || responseLower.includes('fatigue') || responseLower.includes('weak')) {
      setRecoveryInsights({
        type: 'concern',
        message: "Fatigue is common during sepsis recovery, but let's help you manage it better.",
        recommendations: [
          "Try to get 7-9 hours of sleep each night",
          "Take short naps (20-30 minutes) during the day if needed",
          "Gradually increase physical activity as tolerated",
          "Ensure you're eating nutritious meals regularly",
          "Consider discussing with your provider if fatigue persists"
        ]
      });
    }
    else if (responseLower.includes('pain') || responseLower.includes('ache') || responseLower.includes('hurt')) {
      setRecoveryInsights({
        type: 'concern',
        message: "Pain management is important for your recovery process.",
        recommendations: [
          "Take prescribed pain medications as directed",
          "Apply heat or cold therapy as recommended by your provider",
          "Try gentle stretching or movement if approved",
          "Contact your provider if pain worsens or doesn't improve",
          "Consider relaxation techniques like deep breathing"
        ]
      });
    }
    else if (responseLower.includes('anxious') || responseLower.includes('worried') || responseLower.includes('scared')) {
      setRecoveryInsights({
        type: 'concern',
        message: "It's normal to feel anxious during recovery - you're not alone in this.",
        recommendations: [
          "Practice deep breathing exercises daily",
          "Stay connected with family and friends for support",
          "Consider joining a sepsis survivor support group",
          "Talk to your provider about your concerns",
          "Focus on small daily achievements to build confidence"
        ]
      });
    }
    else {
      setRecoveryInsights({
        type: 'positive',
        message: "Thanks for sharing - this helps us track your recovery journey.",
        recommendations: [
          "Continue monitoring your symptoms daily",
          "Follow your prescribed medication schedule",
          "Stay hydrated and eat nutritious meals",
          "Contact your provider with any concerning changes"
        ]
      });
    }
  };

  const handleQuickResponse = (response: ResponseType) => {
    if (response === 'all-good') {
      // Generate insights for positive response
      generateRecoveryInsights('stable', true);
      setCurrentStep('recovery-insights');
    } else if (response === 'need-update') {
      setCurrentStep('adaptive-chat');
    } else if (response === 'not-feeling-great') {
      setCurrentStep('follow-up');
      setConversationHistory(['User indicated not feeling great']);
    }
  };

  const handleAdaptiveResponse = (response: string) => {
    setCurrentResponse(response);
    setConversationHistory(prev => [...prev, response]);
    
    // Check for red flags
    const detectedRedFlags = detectRedFlags(response);
    if (detectedRedFlags.length > 0) {
      setRedFlags(detectedRedFlags);
      setCurrentStep('red-flag-alert');
      return;
    }
    
    // Continue with adaptive follow-up
    setCurrentStep('follow-up');
  };

  const handleCompleteCheckIn = () => {
    // Generate insights based on user responses
    generateRecoveryInsights(currentResponse);
    setCurrentStep('recovery-insights');
  };

  const handleFinalComplete = () => {
    const riskAwareMessage = generateRiskAwareResponse(currentResponse, profile);
    
    // Calculate recovery score based on conversation
    let recoveryScore = 50;
    if (currentResponse.toLowerCase().includes('better') || currentResponse.toLowerCase().includes('good')) {
      recoveryScore += 20;
    }
    if (currentResponse.toLowerCase().includes('sleep')) {
      recoveryScore += 10;
    }
    if (currentResponse.toLowerCase().includes('water') || currentResponse.toLowerCase().includes('drinking')) {
      recoveryScore += 10;
    }
    
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
      description: riskAwareMessage,
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
              <span className="font-medium text-green-800">Your Progress Trends</span>
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
          How many days has it been since your hospital discharge?
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

      {/* Quick Check-In Options */}
      <div className="space-y-3">
        <div className="text-center text-sm text-gray-500 mb-4">
          Quick check-in options:
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {canUseQuickCheckIn && (
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
          )}
          
          <Button 
            onClick={() => handleQuickResponse('need-update')}
            variant="outline"
            className="h-auto p-4"
          >
            <div className="text-center">
              <MessageCircle className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">📝 Something to Share</div>
              <div className="text-xs opacity-70">Want to update you on how I'm doing</div>
            </div>
          </Button>

          <Button 
            onClick={() => handleQuickResponse('not-feeling-great')}
            className="h-auto p-4 bg-orange-500 hover:bg-orange-600"
          >
            <div className="text-center">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">😔 Not Feeling Great</div>
              <div className="text-xs opacity-90">Need some extra support today</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAdaptiveChatStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {adaptiveQuestions.greeting || "Thanks for sharing more details! 😊"}
        </h3>
        <p className="text-gray-600">
          {adaptiveQuestions.followUp || "How are things going today?"}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {adaptiveQuestions.mainQuestion || "Tell me how you're feeling:"}
          </label>
          <Input
            placeholder="E.g., 'Feeling a bit better than yesterday' or 'Still quite tired'"
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            className="w-full"
            onKeyPress={(e) => e.key === 'Enter' && currentResponse.trim() && handleAdaptiveResponse(currentResponse)}
          />
        </div>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Remember:</strong> Thanks for sharing — this helps us track your recovery journey. 
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
          onClick={() => handleAdaptiveResponse(currentResponse)}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          disabled={!currentResponse.trim()}
        >
          Continue
        </Button>
      </div>
    </div>
  );

  const renderFollowUpStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Thanks for sharing that with me 💙
        </h3>
        <p className="text-gray-600">
          {adaptiveQuestions.specificQuestion || "Can you tell me a bit more about how you're managing today?"}
        </p>
      </div>

      <div className="space-y-4">
        {adaptiveQuestions.questions?.map((question, index) => (
          <div key={index} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {question}
            </label>
            <Input
              placeholder="Share as much or as little as you'd like..."
              className="w-full"
            />
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 p-3 rounded-lg">
        <p className="text-sm text-yellow-800">
          💭 <strong>Note:</strong> These symptoms can happen after sepsis. Let's keep an eye on them together.
        </p>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('adaptive-chat')}
          className="flex-1"
        >
          Back
        </Button>
        <Button 
          onClick={handleCompleteCheckIn}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          Complete Check-In
        </Button>
      </div>
    </div>
  );

  const renderRedFlagAlert = () => (
    <div className="space-y-6">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Let's Get You Some Support
        </h3>
        <p className="text-gray-600">
          Based on your responses, this may warrant a quick chat with your provider.
        </p>
      </div>

      <div className="bg-red-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Flag className="w-4 h-4 text-red-600" />
          <span className="font-medium text-red-800">We noticed:</span>
        </div>
        <ul className="text-red-800 text-sm space-y-1">
          {redFlags.map((flag, index) => (
            <li key={index}>• {flag}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <Button 
          className="w-full bg-red-600 hover:bg-red-700 h-12"
        >
          <AlertTriangle className="w-5 h-5 mr-2" />
          Contact My Provider
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleCompleteCheckIn}
          className="w-full"
        >
          I'll Keep Monitoring
        </Button>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          This timeline is for wellness tracking only and does not replace medical advice.
        </p>
      </div>
    </div>
  );

  const renderRecoveryInsights = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
          recoveryInsights.type === 'positive' ? 'bg-green-100' : 'bg-yellow-100'
        }`}>
          {recoveryInsights.type === 'positive' ? 
            <CheckCircle className="w-6 h-6 text-green-600" /> : 
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          }
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Recovery Insights
        </h3>
        <p className={`text-base font-medium ${
          recoveryInsights.type === 'positive' ? 'text-green-800' : 'text-yellow-800'
        }`}>
          {recoveryInsights.message}
        </p>
      </div>

      <div className={`p-4 rounded-lg border-l-4 ${
        recoveryInsights.type === 'positive' ? 
          'bg-green-50 border-green-500' : 
          'bg-yellow-50 border-yellow-500'
      }`}>
        <h4 className={`font-medium mb-3 ${
          recoveryInsights.type === 'positive' ? 'text-green-900' : 'text-yellow-900'
        }`}>
          Personalized Recommendations:
        </h4>
        <ul className="space-y-2">
          {recoveryInsights.recommendations.map((recommendation, index) => (
            <li key={index} className={`flex items-start gap-2 text-sm ${
              recoveryInsights.type === 'positive' ? 'text-green-800' : 'text-yellow-800'
            }`}>
              <span className="text-lg">•</span>
              <span>{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Remember:</strong> These insights are personalized based on your responses. 
          Always consult your healthcare provider for medical decisions.
        </p>
      </div>

      <Button 
        onClick={handleFinalComplete}
        className="w-full bg-blue-600 hover:bg-blue-700 h-12"
      >
        <Heart className="w-5 h-5 mr-2" />
        Complete Check-In
      </Button>
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
        {currentStep === 'adaptive-chat' && renderAdaptiveChatStep()}
        {currentStep === 'follow-up' && renderFollowUpStep()}
        {currentStep === 'red-flag-alert' && renderRedFlagAlert()}
        {currentStep === 'recovery-insights' && renderRecoveryInsights()}
      </CardContent>
    </Card>
  );
};

export default ConversationalCheckIn;

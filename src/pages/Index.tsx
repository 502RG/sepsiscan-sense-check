import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Heart, Thermometer, Clock, Shield, User, UserCheck, TrendingUp, Download, Bell } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { UserInputs, RiskAssessment, UserProfile } from "@/types/sepsis";
import { performRiskAnalysis } from "@/utils/riskAnalysis";
import { enableNightMode, isOfflineMode } from "@/utils/enhancedRiskAnalysis";
import ProfileManagement from "@/components/ProfileManagement";
import HealthTrackingSummary from "@/components/HealthTrackingSummary";
import NavigationControls from "@/components/NavigationControls";
import EnhancedInsights from "@/components/EnhancedInsights";

const Index = () => {
  const [step, setStep] = useState<'profile' | 'greeting' | 'assessment' | 'subjective' | 'results'>('profile');
  const [previousStep, setPreviousStep] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [userInputs, setUserInputs] = useState<UserInputs>({
    temperature: '',
    heartRate: '',
    symptoms: '',
    symptomDuration: '',
    activityLevel: '',
    medications: '',
    userMode: 'Self'
  });
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);

  // Load profiles from localStorage on component mount
  useEffect(() => {
    const savedProfiles = localStorage.getItem('sepsiscan-profiles');
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles));
    }
    
    // Enable night mode if appropriate
    enableNightMode();
    
    // Check offline status
    setOfflineMode(isOfflineMode());
    
    // Listen for online/offline events
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save profiles to localStorage whenever profiles change
  useEffect(() => {
    localStorage.setItem('sepsiscan-profiles', JSON.stringify(profiles));
  }, [profiles]);

  const handleBack = () => {
    switch (step) {
      case 'greeting':
        setStep('profile');
        break;
      case 'assessment':
        setStep('greeting');
        break;
      case 'subjective':
        setStep('assessment');
        break;
      case 'results':
        setStep(previousStep as any || 'assessment');
        break;
      default:
        break;
    }
  };

  const navigateToStep = (newStep: typeof step) => {
    setPreviousStep(step);
    setStep(newStep);
  };

  const handleProfileCreate = (profileData: Omit<UserProfile, 'id' | 'historicalData' | 'createdAt'>) => {
    const newProfile: UserProfile = {
      ...profileData,
      id: Date.now().toString(),
      historicalData: [],
      createdAt: new Date().toISOString(),
    };
    
    setProfiles([...profiles, newProfile]);
    setSelectedProfile(newProfile);
    navigateToStep('greeting');
    
    toast({
      title: "Profile Created",
      description: `Profile for ${newProfile.name} has been created successfully.`,
    });
  };

  const handleProfileSelect = (profile: UserProfile) => {
    setSelectedProfile(profile);
    navigateToStep('greeting');
  };

  const handleProfileDelete = (profileId: string) => {
    const profileToDelete = profiles.find(p => p.id === profileId);
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(updatedProfiles);
    
    if (selectedProfile?.id === profileId) {
      setSelectedProfile(null);
    }
    
    toast({
      title: "Profile Deleted",
      description: `Profile for ${profileToDelete?.name} has been permanently deleted.`,
      variant: "destructive"
    });
  };

  const handleUpdateThreshold = () => {
    if (!selectedProfile) return;
    
    const updatedProfile = {
      ...selectedProfile,
      adaptiveThresholds: {
        heartRate: parseFloat(userInputs.heartRate),
        temperature: parseFloat(userInputs.temperature),
        lastUpdated: new Date().toISOString()
      }
    };
    
    const updatedProfiles = profiles.map(p => 
      p.id === selectedProfile.id ? updatedProfile : p
    );
    
    setProfiles(updatedProfiles);
    setSelectedProfile(updatedProfile);
    
    toast({
      title: "Threshold Updated",
      description: "Your personal baseline thresholds have been updated based on your recent patterns.",
    });
  };

  const handleContactProvider = () => {
    toast({
      title: "Provider Integration",
      description: "This feature will be available when connected to your healthcare provider's system.",
    });
  };

  const handleEnableLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast({
            title: "Location Enabled",
            description: "You'll now receive local health alerts and outbreak notifications.",
          });
        },
        (error) => {
          toast({
            title: "Location Access Denied",
            description: "Enable location access in your browser settings to receive local health alerts.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const startAssessment = () => {
    navigateToStep('assessment');
  };

  const checkForSubjectiveFeedback = () => {
    const temp = parseFloat(userInputs.temperature);
    const hr = parseFloat(userInputs.heartRate);
    
    const needsSubjectiveFeedback = (temp > 100.4) || (hr > 100 && userInputs.activityLevel === 'Resting');
    
    if (needsSubjectiveFeedback) {
      navigateToStep('subjective');
    } else {
      performRiskAnalysisAndSave();
    }
  };

  const performRiskAnalysisAndSave = () => {
    if (!selectedProfile) return;

    const temp = parseFloat(userInputs.temperature);
    const hr = parseFloat(userInputs.heartRate);
    
    const assessment = performRiskAnalysis(userInputs, selectedProfile);
    setRiskAssessment(assessment);
    
    // Determine time of day
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';
    
    // Save this check-in to the profile's historical data
    const newHistoricalEntry = {
      date: new Date().toLocaleDateString(),
      temperature: temp,
      heartRate: hr,
      symptoms: userInputs.symptoms,
      riskLevel: assessment.level,
      timestamp: Date.now(),
      subjectiveFeedback: userInputs.subjectiveFeedback,
      isExercising: userInputs.activityLevel === 'Exercising',
      timeOfDay,
    };
    
    // Update personal patterns
    const updatedPersonalPatterns = {
      ...selectedProfile.personalPatterns,
      lastCheckinTime: new Date().toISOString(),
      symptomLanguage: [
        ...(selectedProfile.personalPatterns?.symptomLanguage || []),
        userInputs.subjectiveFeedback || ''
      ].slice(-10), // Keep last 10
    };
    
    const updatedProfile = {
      ...selectedProfile,
      historicalData: [newHistoricalEntry, ...selectedProfile.historicalData],
      personalPatterns: updatedPersonalPatterns,
    };
    
    const updatedProfiles = profiles.map(p => 
      p.id === selectedProfile.id ? updatedProfile : p
    );
    
    setProfiles(updatedProfiles);
    setSelectedProfile(updatedProfile);
    
    // Show smart alert if high risk
    if (assessment.alertLevel === 'Urgent') {
      toast({
        title: "🚨 SepsiScan Alert",
        description: "Your recent check-in indicates a potential increase in risk. Please monitor closely or consult a healthcare provider.",
        variant: "destructive"
      });
    }
    
    // Show missed check-in alert if applicable
    if (assessment.missedCheckinAlert) {
      toast({
        title: "Check-in Reminder",
        description: assessment.missedCheckinAlert,
      });
    }
    
    navigateToStep('results');
    
    // Sync data when back online
    if (!offlineMode && navigator.onLine) {
      // Here you would sync with backend when available
      console.log('Syncing data with backend...');
    }
  };

  const generateExportData = () => {
    if (!selectedProfile || !riskAssessment) return;

    const today = new Date().toLocaleDateString();
    const exportData = {
      date: today,
      profile: {
        name: selectedProfile.name,
        age: selectedProfile.age,
        knownConditions: selectedProfile.knownConditions.join(', '),
        mode: userInputs.userMode,
        medications: userInputs.medications
      },
      vitals: {
        temperature: `${userInputs.temperature}°F`,
        heartRate: `${userInputs.heartRate} bpm`,
        activityLevel: userInputs.activityLevel
      },
      symptoms: {
        description: userInputs.symptoms,
        duration: userInputs.symptomDuration,
        subjectiveFeedback: userInputs.subjectiveFeedback
      },
      assessment: {
        riskLevel: riskAssessment.level,
        confidence: riskAssessment.confidence,
        recommendation: riskAssessment.recommendation,
        flaggedRisks: riskAssessment.flaggedRisks,
        patternAnalysis: riskAssessment.patternAnalysis,
        trendAnalysis: riskAssessment.trendAnalysis
      }
    };
    
    const exportText = `
SEPSISCAN HEALTH ASSESSMENT REPORT
Date: ${exportData.date}

PATIENT INFORMATION:
- Name: ${exportData.profile.name}
- Age: ${exportData.profile.age}
- Known Conditions: ${exportData.profile.knownConditions || 'None reported'}
- Assessment completed by: ${exportData.profile.mode}
- Current medications: ${exportData.profile.medications || 'None reported'}

VITAL SIGNS:
- Temperature: ${exportData.vitals.temperature}
- Heart Rate: ${exportData.vitals.heartRate}
- Activity Level: ${exportData.vitals.activityLevel}

SYMPTOMS:
- Description: ${exportData.symptoms.description || 'None reported'}
- Duration: ${exportData.symptoms.duration}
- Subjective Feedback: ${exportData.symptoms.subjectiveFeedback || 'Not assessed'}

RISK ASSESSMENT:
- Risk Level: ${exportData.assessment.riskLevel}
- Confidence: ${exportData.assessment.confidence}
- Recommendation: ${exportData.assessment.recommendation}

FLAGGED CONCERNS:
${exportData.assessment.flaggedRisks?.map(risk => `- ${risk}`).join('\n') || 'None'}

PATTERN ANALYSIS:
${exportData.assessment.patternAnalysis?.map(pattern => `- ${pattern}`).join('\n') || 'No concerning patterns detected'}

TREND ANALYSIS:
${exportData.assessment.trendAnalysis || 'No trend data available'}

---
This assessment was generated by SepsiScan AI and is for informational purposes only. 
It is not a medical diagnosis. Please consult with healthcare professionals for medical advice.
    `;
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SepsiScan_Report_${selectedProfile.name}_${today.replace(/\//g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "Your health assessment report has been downloaded successfully."
    });
  };

  const resetAssessment = () => {
    navigateToStep('greeting');
    setUserInputs({
      temperature: '',
      heartRate: '',
      symptoms: '',
      symptomDuration: '',
      activityLevel: '',
      medications: '',
      userMode: 'Self'
    });
    setRiskAssessment(null);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'destructive';
      case 'Moderate': return 'default';
      case 'Low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getProgressValue = (level: string) => {
    switch (level) {
      case 'High': return 85;
      case 'Moderate': return 50;
      case 'Low': return 20;
      default: return 0;
    }
  };

  const getAlertIcon = (alertLevel?: string) => {
    switch (alertLevel) {
      case 'Urgent': return <Bell className="w-5 h-5 text-red-500" />;
      case 'Monitor': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return null;
    }
  };

  if (step === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <ProfileManagement
          profiles={profiles}
          onProfileSelect={handleProfileSelect}
          onProfileCreate={handleProfileCreate}
          onProfileDelete={handleProfileDelete}
        />
      </div>
    );
  }

  if (step === 'greeting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className="text-center pb-6">
            <NavigationControls 
              onBack={handleBack}
              showBack={true}
              currentStep="1"
            />
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome back, {selectedProfile?.name}!
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Ready for your health check-in? This takes less than 1 minute.
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={startAssessment}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
            >
              Start Health Assessment
            </Button>
            <p className="text-xs text-gray-500 text-center mt-4">
              Your information is secure and confidential. At any time, you can use the 🔙 back button to review or change your previous answers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'assessment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
            <CardHeader>
              <NavigationControls 
                onBack={handleBack}
                showBack={true}
                currentStep="2"
              />
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Health Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Temperature */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Current Temperature (°F)
                </Label>
                <Input
                  type="number"
                  placeholder="98.6"
                  value={userInputs.temperature}
                  onChange={(e) => setUserInputs({...userInputs, temperature: e.target.value})}
                  className="text-lg"
                />
              </div>

              {/* Heart Rate */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Resting Heart Rate (bpm)
                </Label>
                <Input
                  type="number"
                  placeholder="70"
                  value={userInputs.heartRate}
                  onChange={(e) => setUserInputs({...userInputs, heartRate: e.target.value})}
                  className="text-lg"
                />
              </div>

              {/* Activity Level */}
              <div className="space-y-2">
                <Label>Current Activity Level</Label>
                <Select value={userInputs.activityLevel} onValueChange={(value) => setUserInputs({...userInputs, activityLevel: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Resting">Resting</SelectItem>
                    <SelectItem value="Exercising">Exercising</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Symptoms */}
              <div className="space-y-2">
                <Label>Any symptoms today?</Label>
                <Textarea
                  placeholder="fatigue, chills, confusion, wound pain, breathing issues, etc."
                  value={userInputs.symptoms}
                  onChange={(e) => setUserInputs({...userInputs, symptoms: e.target.value})}
                  className="min-h-20"
                />
              </div>

              {/* Symptom Duration */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  How long have you had these symptoms?
                </Label>
                <Select value={userInputs.symptomDuration} onValueChange={(value) => setUserInputs({...userInputs, symptomDuration: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Less than 24 hours">Less than 24 hours</SelectItem>
                    <SelectItem value="1–3 days">1–3 days</SelectItem>
                    <SelectItem value="More than 3 days">More than 3 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Medications */}
              <div className="space-y-2">
                <Label>Current medications (antibiotics, steroids, painkillers, etc.)</Label>
                <Input
                  placeholder="List any relevant medications"
                  value={userInputs.medications}
                  onChange={(e) => setUserInputs({...userInputs, medications: e.target.value})}
                />
              </div>

              {/* User Mode */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Filling out for
                </Label>
                <Select value={userInputs.userMode} onValueChange={(value) => setUserInputs({...userInputs, userMode: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Self">Myself</SelectItem>
                    <SelectItem value="Caregiver">Someone else (Caregiver Mode)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <Button 
                onClick={checkForSubjectiveFeedback}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                disabled={!userInputs.temperature || !userInputs.heartRate || !userInputs.activityLevel}
              >
                Analyze Risk
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'subjective') {
    const temp = parseFloat(userInputs.temperature);
    const hr = parseFloat(userInputs.heartRate);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
            <CardHeader>
              <NavigationControls 
                onBack={handleBack}
                showBack={true}
                currentStep="3"
              />
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Subjective Feedback on Vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  You've entered a temperature of <strong>{temp}°F</strong> and/or a heart rate of <strong>{hr} bpm</strong>. 
                  How are you feeling overall right now?
                </p>
              </div>

              <div className="space-y-2">
                <Label>How do you feel overall?</Label>
                <Select 
                  value={userInputs.subjectiveFeedback || ''} 
                  onValueChange={(value) => setUserInputs({...userInputs, subjectiveFeedback: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select how you feel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I feel normal">I feel normal</SelectItem>
                    <SelectItem value="I feel slightly off but okay">I feel slightly off but okay</SelectItem>
                    <SelectItem value="I feel unwell">I feel unwell</SelectItem>
                    <SelectItem value="I feel very sick">I feel very sick</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={performRiskAnalysisAndSave}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                disabled={!userInputs.subjectiveFeedback}
              >
                Complete Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'results' && riskAssessment && selectedProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <NavigationControls 
            onBack={handleBack}
            showBack={true}
            currentStep="4"
          />

          {/* Enhanced Insights Component */}
          <EnhancedInsights
            riskAssessment={riskAssessment}
            isOffline={offlineMode}
            onUpdateThreshold={handleUpdateThreshold}
            onContactProvider={handleContactProvider}
            onEnableLocation={handleEnableLocation}
          />

          {/* Conversational Memory Insights */}
          {riskAssessment.conversationalMemory && riskAssessment.conversationalMemory.length > 0 && (
            <Card className="shadow-xl border-0 bg-blue-50/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <TrendingUp className="w-5 h-5" />
                  Pattern Recognition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {riskAssessment.conversationalMemory.map((insight, index) => (
                    <p key={index} className="text-blue-800 bg-blue-100 p-3 rounded-lg">
                      💡 {insight}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personalized Insights */}
          {riskAssessment.personalizedInsights && riskAssessment.personalizedInsights.length > 0 && (
            <Card className="shadow-xl border-0 bg-green-50/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <User className="w-5 h-5" />
                  Personal Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {riskAssessment.personalizedInsights.map((insight, index) => (
                    <p key={index} className="text-green-800 bg-green-100 p-3 rounded-lg">
                      🎯 {insight}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Health Tracking Summary */}
          <HealthTrackingSummary
            profile={selectedProfile}
            currentData={{
              temperature: parseFloat(userInputs.temperature),
              heartRate: parseFloat(userInputs.heartRate),
              riskLevel: riskAssessment.level,
            }}
          />

          {/* Smart Alert Banner */}
          {riskAssessment.alertLevel !== 'None' && (
            <Card className="border-l-4 border-red-500 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {getAlertIcon(riskAssessment.alertLevel)}
                  <h3 className="font-semibold text-red-900">SepsiScan Alert</h3>
                </div>
                <p className="text-red-800 mt-1">
                  {riskAssessment.alertLevel === 'Urgent' 
                    ? 'Your recent check-in indicates a potential increase in risk. Please monitor closely or consult a healthcare provider.'
                    : 'Your symptoms warrant continued monitoring. Please recheck as recommended.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Risk Assessment Results */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Risk Assessment Results</span>
                <Badge variant={getRiskColor(riskAssessment.level)} className="text-sm px-3 py-1">
                  {riskAssessment.level} Risk
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Risk Level</span>
                  <span className="font-medium">{riskAssessment.confidence} Confidence</span>
                </div>
                <Progress value={getProgressValue(riskAssessment.level)} className="h-3" />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Recommendation:</h4>
                <p className="text-gray-700 font-medium">{riskAssessment.recommendation}</p>
              </div>

              {riskAssessment.flaggedRisks.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Flagged Concerns:</h4>
                  <ul className="space-y-2">
                    {riskAssessment.flaggedRisks.map((risk, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pattern Analysis */}
              {riskAssessment.patternAnalysis.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Pattern Analysis:
                  </h4>
                  <ul className="space-y-2">
                    {riskAssessment.patternAnalysis.map((pattern, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trend Analysis */}
              {riskAssessment.trendAnalysis && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Trend Analysis:
                  </h4>
                  <p className="text-blue-800">{riskAssessment.trendAnalysis}</p>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 text-sm">{riskAssessment.reassurance}</p>
              </div>
            </CardContent>
          </Card>

          {/* Summary of Inputs */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle>Your Assessment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Temperature:</span> {userInputs.temperature}°F
                </div>
                <div>
                  <span className="font-medium">Heart Rate:</span> {userInputs.heartRate} bpm
                </div>
                <div>
                  <span className="font-medium">Activity:</span> {userInputs.activityLevel}
                </div>
                <div>
                  <span className="font-medium">Duration:</span> {userInputs.symptomDuration}
                </div>
                {userInputs.symptoms && (
                  <div className="md:col-span-2">
                    <span className="font-medium">Symptoms:</span> {userInputs.symptoms}
                  </div>
                )}
                {userInputs.subjectiveFeedback && (
                  <div className="md:col-span-2">
                    <span className="font-medium">How you feel:</span> {userInputs.subjectiveFeedback}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Would you like to export today's results for your doctor or personal tracking?
              </p>
              <Button 
                onClick={generateExportData}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Assessment Report
              </Button>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={resetAssessment} variant="outline" className="flex-1">
              New Assessment
            </Button>
            <Button 
              onClick={() => toast({
                title: "Data Saved",
                description: `Check-in saved to ${selectedProfile.name}'s profile. Track trends over time!`
              })}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              ✓ Saved & Tracked
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your information is secure and confidential. This tool is for early warning only - not diagnosis.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;

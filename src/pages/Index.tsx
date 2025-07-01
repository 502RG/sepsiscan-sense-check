import React, { useState } from 'react';
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

interface BaselineVitals {
  temperature: number;
  heartRate: number;
  normalSymptoms: string;
}

interface UserInputs {
  temperature: string;
  heartRate: string;
  symptoms: string;
  symptomDuration: string;
  activityLevel: string;
  medications: string;
  userMode: string;
  subjectiveFeedback?: string;
}

interface RiskAssessment {
  level: 'Low' | 'Moderate' | 'High';
  confidence: 'Low' | 'Medium' | 'High';
  flaggedRisks: string[];
  recommendation: string;
  reassurance: string;
  patternAnalysis: string[];
  trendAnalysis?: string;
  alertLevel?: 'None' | 'Monitor' | 'Urgent';
}

interface HistoricalData {
  date: string;
  temperature: number;
  heartRate: number;
  symptoms: string;
  riskLevel: string;
}

const Index = () => {
  const [step, setStep] = useState<'greeting' | 'assessment' | 'subjective' | 'results'>('greeting');
  const [userInputs, setUserInputs] = useState<UserInputs>({
    temperature: '',
    heartRate: '',
    symptoms: '',
    symptomDuration: '',
    activityLevel: '',
    medications: '',
    userMode: 'Self'
  });
  const [baselineVitals, setBaselineVitals] = useState<BaselineVitals | null>(null);
  const [showBaseline, setShowBaseline] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [showExport, setShowExport] = useState(false);

  // Simulate historical data for trend analysis
  const [historicalData] = useState<HistoricalData[]>([
    {
      date: '2025-06-30',
      temperature: 99.2,
      heartRate: 78,
      symptoms: 'mild fatigue',
      riskLevel: 'Low'
    },
    {
      date: '2025-06-29',
      temperature: 98.8,
      heartRate: 72,
      symptoms: 'none',
      riskLevel: 'Low'
    }
  ]);

  const startAssessment = () => {
    setStep('assessment');
  };

  const checkForSubjectiveFeedback = () => {
    const temp = parseFloat(userInputs.temperature);
    const hr = parseFloat(userInputs.heartRate);
    
    const needsSubjectiveFeedback = (temp > 100.4) || (hr > 100 && userInputs.activityLevel === 'Resting');
    
    if (needsSubjectiveFeedback) {
      setStep('subjective');
    } else {
      performRiskAnalysis();
    }
  };

  const analyzeSymptomClusters = (symptoms: string, temp: number, hr: number) => {
    const patterns = [];
    const symptomLower = symptoms.toLowerCase();
    
    // High-risk combination: Fever + Tachycardia + Serious symptoms
    if (temp > 100.4 && hr > 100) {
      if (symptomLower.includes('chills') || symptomLower.includes('confusion')) {
        patterns.push('Critical Pattern: Fever + Elevated HR + Systemic symptoms (chills/confusion) suggests severe infection');
      }
      if (symptomLower.includes('breathing') || symptomLower.includes('shortness')) {
        patterns.push('High-Risk Pattern: Fever + Tachycardia + Respiratory symptoms');
      }
    }
    
    // Moderate risk patterns
    const concerningSymptoms = ['fatigue', 'chills', 'confusion', 'wound', 'breathing', 'nausea', 'dizziness'];
    const symptomCount = concerningSymptoms.filter(symptom => symptomLower.includes(symptom)).length;
    
    if (symptomCount >= 3) {
      patterns.push(`Multi-symptom cluster: ${symptomCount} concerning symptoms present`);
    }
    
    if (symptomCount >= 2 && userInputs.symptomDuration === 'More than 3 days') {
      patterns.push('Persistent multi-symptom pattern over 3+ days');
    }
    
    return patterns;
  };

  const performTrendAnalysis = (temp: number, hr: number) => {
    if (historicalData.length === 0) return null;
    
    const lastEntry = historicalData[0];
    const tempDiff = temp - lastEntry.temperature;
    const hrDiff = hr - lastEntry.heartRate;
    
    let trendAnalysis = '';
    
    if (tempDiff > 1.0) {
      trendAnalysis += `Temperature increased by ${tempDiff.toFixed(1)}°F from last check-in. `;
    }
    
    if (hrDiff > 10) {
      trendAnalysis += `Heart rate increased by ${hrDiff} bpm from last check-in. `;
    }
    
    if (baselineVitals) {
      const baselineTempDiff = temp - baselineVitals.temperature;
      const baselineHrDiff = hr - baselineVitals.heartRate;
      
      if (baselineTempDiff > 1.5) {
        trendAnalysis += `Temperature is ${baselineTempDiff.toFixed(1)}°F above your personal baseline. `;
      }
      
      if (baselineHrDiff > 15) {
        trendAnalysis += `Heart rate is ${baselineHrDiff} bpm above your personal baseline. `;
      }
    }
    
    return trendAnalysis || 'Vitals are within normal range compared to recent history.';
  };

  const performRiskAnalysis = () => {
    const temp = parseFloat(userInputs.temperature);
    const hr = parseFloat(userInputs.heartRate);
    
    let riskScore = 0;
    let flaggedRisks: string[] = [];
    
    // Temperature analysis
    if (temp > 100.4) {
      riskScore += 2;
      flaggedRisks.push(`Elevated temperature (${temp}°F) indicates potential infection`);
    }
    
    // Heart rate analysis (adjusted for subjective feedback)
    if (hr > 100 && userInputs.activityLevel === 'Resting') {
      let hrRisk = 2;
      
      // Adjust based on subjective feedback
      if (userInputs.subjectiveFeedback === 'I feel normal') {
        hrRisk = 1;
      } else if (userInputs.subjectiveFeedback === 'I feel very sick') {
        hrRisk = 3;
      }
      
      riskScore += hrRisk;
      flaggedRisks.push(`Elevated resting heart rate (${hr} bpm) with subjective feeling: ${userInputs.subjectiveFeedback || 'not assessed'}`);
    }
    
    // Symptom analysis
    const concerningSymptoms = ['confusion', 'chills', 'breathing', 'wound', 'fatigue'];
    const symptomCount = concerningSymptoms.filter(symptom => 
      userInputs.symptoms.toLowerCase().includes(symptom)
    ).length;
    
    if (symptomCount > 0) {
      riskScore += symptomCount;
      flaggedRisks.push(`Sepsis-related symptoms detected: ${userInputs.symptoms}`);
    }
    
    // Duration analysis
    if (userInputs.symptomDuration === 'More than 3 days') {
      riskScore += 1;
      flaggedRisks.push('Persistent symptoms over 3 days increase concern');
    }
    
    // Advanced pattern analysis
    const patternAnalysis = analyzeSymptomClusters(userInputs.symptoms, temp, hr);
    
    // Adjust risk score based on patterns
    if (patternAnalysis.some(pattern => pattern.includes('Critical Pattern'))) {
      riskScore += 3;
    } else if (patternAnalysis.some(pattern => pattern.includes('High-Risk Pattern'))) {
      riskScore += 2;
    }
    
    // Trend analysis
    const trendAnalysis = performTrendAnalysis(temp, hr);
    
    // Determine risk level and recommendation
    let level: 'Low' | 'Moderate' | 'High';
    let confidence: 'Low' | 'Medium' | 'High';
    let recommendation: string;
    let alertLevel: 'None' | 'Monitor' | 'Urgent' = 'None';
    
    if (riskScore >= 6) {
      level = 'High';
      confidence = 'High';
      recommendation = 'Seek urgent care immediately';
      alertLevel = 'Urgent';
    } else if (riskScore >= 4) {
      level = 'Moderate';
      confidence = 'High';
      recommendation = 'Call your healthcare provider today';
      alertLevel = 'Monitor';
    } else if (riskScore >= 2) {
      level = 'Moderate';
      confidence = 'Medium';
      recommendation = 'Monitor closely - recheck in 4-6 hours';
      alertLevel = 'Monitor';
    } else {
      level = 'Low';
      confidence = 'Medium';
      recommendation = 'Continue monitoring - recheck in 12 hours';
    }
    
    setRiskAssessment({
      level,
      confidence,
      flaggedRisks,
      recommendation,
      reassurance: "Remember, this is an early warning tool, not a diagnosis. If you feel okay, keep monitoring and follow up as advised.",
      patternAnalysis,
      trendAnalysis,
      alertLevel
    });
    
    // Show smart alert if high risk
    if (alertLevel === 'Urgent') {
      toast({
        title: "🚨 SepsiScan Alert",
        description: "Your recent check-in indicates a potential increase in risk. Please monitor closely or consult a healthcare provider.",
        variant: "destructive"
      });
    }
    
    setStep('results');
  };

  const generateExportData = () => {
    const today = new Date().toLocaleDateString();
    const exportData = {
      date: today,
      patientInfo: {
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
        riskLevel: riskAssessment?.level,
        confidence: riskAssessment?.confidence,
        recommendation: riskAssessment?.recommendation,
        flaggedRisks: riskAssessment?.flaggedRisks,
        patternAnalysis: riskAssessment?.patternAnalysis,
        trendAnalysis: riskAssessment?.trendAnalysis
      }
    };
    
    const exportText = `
SEPSISCAN HEALTH ASSESSMENT REPORT
Date: ${exportData.date}

PATIENT INFORMATION:
- Assessment completed by: ${exportData.patientInfo.mode}
- Current medications: ${exportData.patientInfo.medications || 'None reported'}

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
    a.download = `SepsiScan_Report_${today.replace(/\//g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "Your health assessment report has been downloaded successfully."
    });
  };

  const resetAssessment = () => {
    setStep('greeting');
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
    setShowExport(false);
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

  if (step === 'greeting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">SepsiScan</CardTitle>
            <p className="text-gray-600 mt-2">
              Hi! I'm SepsiScan — here to help you catch potential signs of sepsis early. 
              This takes less than 1 minute. Let's begin your daily check-in.
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
              Your information is secure and confidential.
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
                onClick={performRiskAnalysis}
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

  if (step === 'results' && riskAssessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-3xl mx-auto space-y-6">
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
                title: "Feature Coming Soon",
                description: "In the full version, I'll track your health over time and notify your care team if needed."
              })}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save & Track
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

import { UserInputs, RiskAssessment, UserProfile, HistoricalData } from "@/types/sepsis";
import { 
  analyzeAdaptiveThresholds, 
  estimateInfectionTimeline, 
  getNightModeMessage,
  getProviderIntegrationSuggestion
} from "./enhancedRiskAnalysis";
import { 
  analyzeConversationalMemory, 
  checkMissedCheckins, 
  detectExercisePattern,
  getTimeOfDayInsights
} from "./conversationalMemory";
import { 
  detectLowVitals, 
  checkEmergencyBypass, 
  getLowVitalRiskEscalation 
} from "./lowVitalDetection";

export const analyzeSymptomClusters = (symptoms: string, temp: number, hr: number, userInputs: UserInputs) => {
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

export const performTrendAnalysis = (temp: number, hr: number, profile: UserProfile) => {
  if (profile.historicalData.length === 0) return 'No previous data for comparison. This is your first check-in!';
  
  // Get the second most recent entry for better comparison (not the just-saved current entry)
  const comparisonEntry = profile.historicalData.length > 1 ? profile.historicalData[1] : profile.historicalData[0];
  const tempDiff = temp - comparisonEntry.temperature;
  const hrDiff = hr - comparisonEntry.heartRate;
  
  let trendAnalysis = '';
  
  if (Math.abs(tempDiff) > 0.3) {
    const direction = tempDiff > 0 ? 'increased' : 'decreased';
    trendAnalysis += `Temperature ${direction} by ${Math.abs(tempDiff).toFixed(1)}°F from last check-in. `;
  }
  
  if (Math.abs(hrDiff) > 5) {
    const direction = hrDiff > 0 ? 'increased' : 'decreased';
    trendAnalysis += `Heart rate ${direction} by ${Math.abs(hrDiff)} bpm from last check-in. `;
  }
  
  if (profile.baseline) {
    const baselineTempDiff = temp - profile.baseline.temperature;
    const baselineHrDiff = hr - profile.baseline.heartRate;
    
    if (Math.abs(baselineTempDiff) > 1.0) {
      const direction = baselineTempDiff > 0 ? 'above' : 'below';
      trendAnalysis += `Temperature is ${Math.abs(baselineTempDiff).toFixed(1)}°F ${direction} your personal baseline. `;
    }
    
    if (Math.abs(baselineHrDiff) > 10) {
      const direction = baselineHrDiff > 0 ? 'above' : 'below';
      trendAnalysis += `Heart rate is ${Math.abs(baselineHrDiff)} bpm ${direction} your personal baseline. `;
    }
  }
  
  return trendAnalysis || 'Vitals are within normal range compared to recent history.';
};

export const performRiskAnalysis = (userInputs: UserInputs, profile: UserProfile): RiskAssessment => {
  const temp = parseFloat(userInputs.temperature);
  const hr = parseFloat(userInputs.heartRate);
  
  let riskScore = 0;
  let flaggedRisks: string[] = [];
  
  // Low vital detection - PRIORITY CHECK
  const lowVitalDetection = detectLowVitals(userInputs, profile);
  const hasSymptoms = userInputs.symptoms.length > 0;
  const lowVitalEscalation = getLowVitalRiskEscalation(lowVitalDetection.lowVitalCount, hasSymptoms);
  
  // Add low vital flags to risk assessment
  flaggedRisks.push(...lowVitalDetection.lowVitalFlags);
  riskScore += lowVitalEscalation.riskIncrease;
  
  // Check for emergency bypass
  const emergencyBypassTriggered = checkEmergencyBypass(userInputs, profile, lowVitalDetection.lowVitalCount);
  
  // Apply adaptive thresholds if available
  const adaptiveTempThreshold = profile.adaptiveThresholds?.temperature || 100.4;
  const adaptiveHRThreshold = profile.adaptiveThresholds?.heartRate || 100;
  
  // Check for exercise pattern to avoid false positives
  const isLikelyExercise = detectExercisePattern(hr, profile.historicalData.slice(0, 3));
  if (isLikelyExercise && userInputs.activityLevel !== 'Exercising') {
    flaggedRisks.push("It looks like your vitals suggest physical activity. If you were exercising, this reduces concern.");
  }
  
  // Temperature analysis with adaptive thresholding
  if (temp > adaptiveTempThreshold) {
    riskScore += 2;
    flaggedRisks.push(`Elevated temperature (${temp}°F) indicates potential infection`);
  }
  
  // Heart rate analysis (adjusted for subjective feedback and adaptive thresholds)
  if (hr > adaptiveHRThreshold && userInputs.activityLevel === 'Resting' && !isLikelyExercise) {
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
  
  // Medical history risk factors
  if (profile.knownConditions.length > 0) {
    const highRiskConditions = ['cancer', 'diabetes', 'surgery', 'immunocompromised'];
    const hasHighRiskCondition = profile.knownConditions.some(condition => 
      highRiskConditions.some(risk => condition.toLowerCase().includes(risk))
    );
    
    if (hasHighRiskCondition) {
      riskScore += 1;
      flaggedRisks.push(`Pre-existing conditions (${profile.knownConditions.join(', ')}) increase sepsis risk`);
    }
  }
  
  // Symptom analysis with cluster detection
  const concerningSymptoms = ['confusion', 'chills', 'breathing', 'wound', 'fatigue'];
  const symptomCount = concerningSymptoms.filter(symptom => 
    userInputs.symptoms.toLowerCase().includes(symptom)
  ).length;
  
  if (symptomCount > 0) {
    riskScore += symptomCount;
    flaggedRisks.push(`Sepsis-related symptoms detected: ${userInputs.symptoms}`);
    
    // Check for dangerous combinations
    if (userInputs.symptoms.toLowerCase().includes('chills') && 
        hr > 100 && 
        userInputs.symptoms.toLowerCase().includes('wound')) {
      riskScore += 2;
      flaggedRisks.push('High-concern symptom combination: chills + elevated HR + wound pain');
    }
  }
  
  // Duration analysis
  if (userInputs.symptomDuration === 'More than 3 days') {
    riskScore += 1;
    flaggedRisks.push('Persistent symptoms over 3 days increase concern');
  }
  
  // Advanced pattern analysis
  const patternAnalysis = analyzeSymptomClusters(userInputs.symptoms, temp, hr, userInputs);
  
  // Adjust risk score based on patterns
  if (patternAnalysis.some(pattern => pattern.includes('Critical Pattern'))) {
    riskScore += 3;
  } else if (patternAnalysis.some(pattern => pattern.includes('High-Risk Pattern'))) {
    riskScore += 2;
  }
  
  // Trend analysis
  const trendAnalysis = performTrendAnalysis(temp, hr, profile);
  
  // Conversational memory analysis
  const conversationalMemory = analyzeConversationalMemory(profile, userInputs);
  
  // Time of day insights
  const timeInsights = getTimeOfDayInsights(profile, new Date(), hr);
  const personalizedInsights: string[] = [];
  if (timeInsights) personalizedInsights.push(timeInsights);
  
  // Missed check-in analysis
  const missedCheckinAlert = checkMissedCheckins(profile);
  
  // Get enhanced insights
  const adaptiveThresholdSuggestion = analyzeAdaptiveThresholds(profile, hr, temp, userInputs.subjectiveFeedback);
  const infectionTimelineEstimate = estimateInfectionTimeline(profile, userInputs.symptoms, userInputs.symptomDuration);
  const nightModeMessage = getNightModeMessage();
  
  // Determine risk level and recommendation
  let level: 'Low' | 'Moderate' | 'High';
  let confidence: 'Low' | 'Medium' | 'High';
  let recommendation: string;
  let alertLevel: 'None' | 'Monitor' | 'Urgent' = 'None';
  
  // LOW VITALS OVERRIDE LOGIC
  if (lowVitalDetection.lowVitalCount >= 2 || emergencyBypassTriggered) {
    level = 'High';
    confidence = 'High';
    recommendation = emergencyBypassTriggered 
      ? 'EMERGENCY: Multiple critical low vitals detected. Initiating emergency assistance protocol. Call 911 immediately.'
      : 'URGENT: Multiple dangerously low vital signs detected. Call 911 or go to emergency room immediately.';
    alertLevel = 'Urgent';
  } else if (lowVitalDetection.lowVitalCount === 1) {
    level = riskScore >= 4 ? 'High' : 'Moderate';
    confidence = 'High';
    recommendation = 'Critically low vital signs detected. Seek urgent medical care immediately.';
    alertLevel = 'Urgent';
  } else if (riskScore >= 6) {
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
  
  const providerIntegrationSuggestion = getProviderIntegrationSuggestion(level, alertLevel);
  
  return {
    level,
    confidence,
    flaggedRisks,
    recommendation,
    reassurance: lowVitalDetection.isCritical 
      ? "CRITICAL: This assessment indicates potentially life-threatening vital signs. Seek immediate emergency care."
      : "Remember, this is an early warning tool, not a diagnosis. If you feel okay, keep monitoring and follow up as advised.",
    patternAnalysis,
    trendAnalysis,
    alertLevel,
    adaptiveThresholdSuggestion,
    infectionTimelineEstimate,
    nightModeMessage,
    providerIntegrationSuggestion,
    conversationalMemory,
    missedCheckinAlert,
    personalizedInsights,
    lowVitalFlags: lowVitalDetection.lowVitalFlags,
    criticalLowVitalAlert: lowVitalDetection.isCritical,
    emergencyBypassTriggered
  };
};

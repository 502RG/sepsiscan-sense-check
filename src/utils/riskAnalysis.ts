
import { UserInputs, RiskAssessment, UserProfile, HistoricalData } from "@/types/sepsis";
import { 
  analyzeAdaptiveThresholds, 
  estimateInfectionTimeline, 
  getNightModeMessage,
  getProviderIntegrationSuggestion
} from "./enhancedRiskAnalysis";

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
  
  const lastEntry = profile.historicalData[0];
  const tempDiff = temp - lastEntry.temperature;
  const hrDiff = hr - lastEntry.heartRate;
  
  let trendAnalysis = '';
  
  if (tempDiff > 1.0) {
    trendAnalysis += `Temperature increased by ${tempDiff.toFixed(1)}°F from last check-in. `;
  }
  
  if (hrDiff > 10) {
    trendAnalysis += `Heart rate increased by ${hrDiff} bpm from last check-in. `;
  }
  
  if (profile.baseline) {
    const baselineTempDiff = temp - profile.baseline.temperature;
    const baselineHrDiff = hr - profile.baseline.heartRate;
    
    if (baselineTempDiff > 1.5) {
      trendAnalysis += `Temperature is ${baselineTempDiff.toFixed(1)}°F above your personal baseline. `;
    }
    
    if (baselineHrDiff > 15) {
      trendAnalysis += `Heart rate is ${baselineHrDiff} bpm above your personal baseline. `;
    }
  }
  
  return trendAnalysis || 'Vitals are within normal range compared to recent history.';
};

export const performRiskAnalysis = (userInputs: UserInputs, profile: UserProfile): RiskAssessment => {
  const temp = parseFloat(userInputs.temperature);
  const hr = parseFloat(userInputs.heartRate);
  
  let riskScore = 0;
  let flaggedRisks: string[] = [];
  
  // Apply adaptive thresholds if available
  const adaptiveTempThreshold = profile.adaptiveThresholds?.temperature || 100.4;
  const adaptiveHRThreshold = profile.adaptiveThresholds?.heartRate || 100;
  
  // Temperature analysis with adaptive thresholding
  if (temp > adaptiveTempThreshold) {
    riskScore += 2;
    flaggedRisks.push(`Elevated temperature (${temp}°F) indicates potential infection`);
  }
  
  // Heart rate analysis (adjusted for subjective feedback and adaptive thresholds)
  if (hr > adaptiveHRThreshold && userInputs.activityLevel === 'Resting') {
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
  const patternAnalysis = analyzeSymptomClusters(userInputs.symptoms, temp, hr, userInputs);
  
  // Adjust risk score based on patterns
  if (patternAnalysis.some(pattern => pattern.includes('Critical Pattern'))) {
    riskScore += 3;
  } else if (patternAnalysis.some(pattern => pattern.includes('High-Risk Pattern'))) {
    riskScore += 2;
  }
  
  // Trend analysis
  const trendAnalysis = performTrendAnalysis(temp, hr, profile);
  
  // Get enhanced insights
  const adaptiveThresholdSuggestion = analyzeAdaptiveThresholds(profile, hr, temp, userInputs.subjectiveFeedback);
  const infectionTimelineEstimate = estimateInfectionTimeline(profile, userInputs.symptoms, userInputs.symptomDuration);
  const nightModeMessage = getNightModeMessage();
  
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
  
  const providerIntegrationSuggestion = getProviderIntegrationSuggestion(level, alertLevel);
  
  return {
    level,
    confidence,
    flaggedRisks,
    recommendation,
    reassurance: "Remember, this is an early warning tool, not a diagnosis. If you feel okay, keep monitoring and follow up as advised.",
    patternAnalysis,
    trendAnalysis,
    alertLevel,
    adaptiveThresholdSuggestion,
    infectionTimelineEstimate,
    nightModeMessage,
    providerIntegrationSuggestion
  };
};

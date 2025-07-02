
import { UserInputs, RiskAssessment, UserProfile, HistoricalData, GeolocationAlert } from "@/types/sepsis";

export const analyzeAdaptiveThresholds = (profile: UserProfile, currentHR: number, currentTemp: number, subjectiveFeedback?: string): string | undefined => {
  if (profile.historicalData.length < 3) return undefined;
  
  // Check last 5 entries for patterns
  const recentEntries = profile.historicalData.slice(0, 5);
  const elevatedHRCount = recentEntries.filter(entry => 
    entry.heartRate > 100 && 
    (entry.subjectiveFeedback?.includes('normal') || entry.subjectiveFeedback?.includes('fine'))
  ).length;
  
  const elevatedTempCount = recentEntries.filter(entry => 
    entry.temperature > 100.4 && 
    (entry.subjectiveFeedback?.includes('normal') || entry.subjectiveFeedback?.includes('fine'))
  ).length;
  
  // If 3+ entries show elevated vitals but user feels fine, suggest threshold adjustment
  if (elevatedHRCount >= 3 && currentHR > 100 && subjectiveFeedback?.includes('normal')) {
    return `We've noticed your heart rate tends to be higher than average (${Math.round(recentEntries.reduce((sum, e) => sum + e.heartRate, 0) / recentEntries.length)} bpm average). Would you like to update your alert threshold to better reflect your baseline?`;
  }
  
  if (elevatedTempCount >= 3 && currentTemp > 100.4 && subjectiveFeedback?.includes('normal')) {
    return `Your temperature readings have been consistently elevated but you feel normal. Consider updating your personal baseline temperature threshold.`;
  }
  
  return undefined;
};

export const estimateInfectionTimeline = (profile: UserProfile, currentSymptoms: string, symptomDuration: string): string | undefined => {
  if (!currentSymptoms || currentSymptoms.toLowerCase() === 'none') return undefined;
  
  const concerningSymptoms = ['fever', 'chills', 'confusion', 'breathing', 'wound', 'fatigue', 'dizziness'];
  const hasMultipleSymptoms = concerningSymptoms.filter(symptom => 
    currentSymptoms.toLowerCase().includes(symptom)
  ).length >= 2;
  
  if (!hasMultipleSymptoms) return undefined;
  
  // Check recent entries for symptom progression
  const recentEntries = profile.historicalData.slice(0, 3);
  const hasSymptomProgression = recentEntries.some(entry => 
    entry.symptoms && entry.symptoms.length > 0
  );
  
  if (hasSymptomProgression && symptomDuration === 'More than 3 days') {
    return `Your current symptoms may suggest a developing infection. Based on your entries, this could be 48+ hours into onset. We recommend early intervention — contact your provider.`;
  }
  
  if (hasSymptomProgression && symptomDuration === '1–3 days') {
    return `Your symptom pattern suggests a possible infection 24–48 hours into onset. Early intervention is most effective now.`;
  }
  
  if (symptomDuration === 'Less than 24 hours' && hasMultipleSymptoms) {
    return `Multiple symptoms appearing within 24 hours warrant close monitoring. Consider contacting your provider if symptoms worsen.`;
  }
  
  return undefined;
};

export const getNightModeMessage = (): string | undefined => {
  const currentHour = new Date().getHours();
  
  if (currentHour >= 22 || currentHour <= 6) {
    return `We've enabled Night Mode for easier viewing. It looks like you're checking in late — if you're unwell, don't wait. You can contact a provider or review urgent steps here.`;
  }
  
  return undefined;
};

export const getProviderIntegrationSuggestion = (riskLevel: string, alertLevel?: string): string | undefined => {
  if (riskLevel === 'High' || alertLevel === 'Urgent') {
    return `Would you like us to share this alert with your care provider or care team? This may qualify for Remote Patient Monitoring (RPM) services covered by insurance.`;
  }
  
  return undefined;
};

export const getGeolocationAlerts = async (latitude?: number, longitude?: number): Promise<GeolocationAlert[]> => {
  // Simulated geolocation alerts - in a real app, this would connect to health APIs
  if (!latitude || !longitude) return [];
  
  // Mock alerts based on common scenarios
  const mockAlerts: GeolocationAlert[] = [
    {
      type: 'outbreak',
      message: 'Flu activity is elevated in your area. Monitor symptoms closely.',
      severity: 'info',
      location: 'Your Region'
    }
  ];
  
  return mockAlerts;
};

export const isOfflineMode = (): boolean => {
  return !navigator.onLine;
};

export const enableNightMode = (): void => {
  const currentHour = new Date().getHours();
  if (currentHour >= 22 || currentHour <= 6) {
    document.documentElement.classList.add('night-mode');
  }
};

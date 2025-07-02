
import { UserProfile, HistoricalData, UserInputs } from "@/types/sepsis";

export const analyzeConversationalMemory = (profile: UserProfile, currentInputs: UserInputs) => {
  const insights: string[] = [];
  const recentEntries = profile.historicalData.slice(0, 7); // Last 7 entries
  
  if (recentEntries.length < 2) return insights;
  
  // Detect symptom persistence
  const currentSymptoms = currentInputs.symptoms.toLowerCase();
  const persistentSymptoms = findPersistentSymptoms(recentEntries, currentSymptoms);
  
  if (persistentSymptoms.length > 0) {
    const days = Math.min(persistentSymptoms.length, 7);
    insights.push(`You've reported ${persistentSymptoms.join(', ')} for ${days} ${days === 1 ? 'day' : 'days'} in a row.`);
  }
  
  // Detect trending vitals
  const trendAnalysis = analyzeTrends(recentEntries, parseFloat(currentInputs.temperature), parseFloat(currentInputs.heartRate));
  if (trendAnalysis) {
    insights.push(trendAnalysis);
  }
  
  // Detect personal symptom language patterns
  const languagePattern = detectPersonalLanguage(profile, currentInputs.subjectiveFeedback || '');
  if (languagePattern) {
    insights.push(languagePattern);
  }
  
  return insights;
};

const findPersistentSymptoms = (entries: HistoricalData[], currentSymptoms: string): string[] => {
  const symptoms = ['fatigue', 'chills', 'confusion', 'breathing', 'wound', 'dizziness'];
  const persistent: string[] = [];
  
  symptoms.forEach(symptom => {
    if (currentSymptoms.includes(symptom)) {
      let count = 1;
      for (const entry of entries.slice(0, 6)) {
        if (entry.symptoms.toLowerCase().includes(symptom)) {
          count++;
        } else {
          break;
        }
      }
      if (count >= 3) {
        persistent.push(symptom);
      }
    }
  });
  
  return persistent;
};

const analyzeTrends = (entries: HistoricalData[], currentTemp: number, currentHR: number): string | null => {
  if (entries.length < 3) return null;
  
  const recentTemps = entries.slice(0, 3).map(e => e.temperature);
  const recentHRs = entries.slice(0, 3).map(e => e.heartRate);
  
  const tempTrend = calculateTrend([...recentTemps, currentTemp]);
  const hrTrend = calculateTrend([...recentHRs, currentHR]);
  
  if (tempTrend > 0.5 && hrTrend > 5) {
    return "Compared to your last check-ins, your symptoms are persisting and your heart rate is trending upward. This could indicate early deterioration.";
  }
  
  if (tempTrend > 1.0) {
    return "Your temperature has been gradually increasing over recent check-ins.";
  }
  
  if (hrTrend > 10) {
    return "Your heart rate has been trending higher over your last few entries.";
  }
  
  return null;
};

const calculateTrend = (values: number[]): number => {
  if (values.length < 2) return 0;
  return values[values.length - 1] - values[0];
};

const detectPersonalLanguage = (profile: UserProfile, currentFeedback: string): string | null => {
  if (!profile.personalPatterns?.symptomLanguage || !currentFeedback) return null;
  
  const personalWords = ['off', 'weird', 'not right', 'strange', 'different'];
  const currentLower = currentFeedback.toLowerCase();
  
  for (const word of personalWords) {
    if (currentLower.includes(word)) {
      const pastUsage = profile.personalPatterns.symptomLanguage.filter(lang => lang.includes(word)).length;
      if (pastUsage >= 2) {
        return `You've mentioned "feeling ${word}" several times — in the past, this has correlated with elevated risk.`;
      }
    }
  }
  
  return null;
};

export const checkMissedCheckins = (profile: UserProfile): string | null => {
  if (!profile.personalPatterns?.lastCheckinTime) return null;
  
  const lastCheckin = new Date(profile.personalPatterns.lastCheckinTime);
  const now = new Date();
  const hoursSince = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);
  
  if (hoursSince > 24 && hoursSince < 48) {
    return `Hi ${profile.name}, I haven't seen a check-in since ${lastCheckin.toLocaleDateString()}. Logging your health daily helps me protect you better.`;
  }
  
  // Emergency escalation logic
  if (hoursSince > 24 && profile.historicalData.length > 0) {
    const lastEntry = profile.historicalData[0];
    const isHighRisk = isEmergencyEscalation(lastEntry);
    
    if (isHighRisk) {
      return `SepsiScan detected concerning vitals in your last log and hasn't received a new check-in. Please respond or contact emergency services if you need help.`;
    }
  }
  
  return null;
};

const isEmergencyEscalation = (entry: HistoricalData): boolean => {
  const criteria = [
    entry.temperature > 103,
    entry.heartRate > 120,
    entry.symptoms.toLowerCase().includes('confusion') || entry.symptoms.toLowerCase().includes('breathing'),
    entry.subjectiveFeedback?.includes('very sick') || entry.subjectiveFeedback?.includes('terrible')
  ];
  
  return criteria.filter(Boolean).length >= 2;
};

export const detectExercisePattern = (currentHR: number, recentEntries: HistoricalData[]): boolean => {
  if (recentEntries.length === 0) return false;
  
  // Check if HR spike followed by rapid recovery pattern
  const lastEntry = recentEntries[0];
  const hrSpike = currentHR - lastEntry.heartRate > 20;
  const noSymptoms = !recentEntries[0].symptoms || recentEntries[0].symptoms.trim() === '';
  
  return hrSpike && noSymptoms;
};

export const getTimeOfDayInsights = (profile: UserProfile, currentTime: Date, currentHR: number): string | null => {
  if (!profile.personalPatterns?.timeOfDayPatterns) return null;
  
  const hour = currentTime.getHours();
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  
  if (hour >= 6 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
  else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
  else timeOfDay = 'night';
  
  const patterns = profile.personalPatterns.timeOfDayPatterns[timeOfDay];
  if (patterns && Math.abs(currentHR - patterns.avgHR) < 10) {
    return `Your ${timeOfDay} HR tends to be in this range — this entry is within your expected pattern.`;
  }
  
  return null;
};


import { UserProfile, HistoricalData, RecoveryInsight, BaselineVitals } from "@/types/sepsis";

export const calculateRecoveryScore = (profile: UserProfile): number => {
  if (!profile.recoveryMode?.isEnabled || profile.historicalData.length === 0) return 0;
  
  const recentEntries = profile.historicalData.slice(0, 7); // Last 7 entries
  let score = 50; // Base score
  
  // Sleep quality factor
  const avgSleep = recentEntries
    .filter(entry => entry.sleepHours)
    .reduce((sum, entry) => sum + (entry.sleepHours || 0), 0) / recentEntries.length;
  
  if (avgSleep >= 7) score += 20;
  else if (avgSleep >= 5) score += 10;
  else score -= 10;
  
  // Vitals stability
  const tempVariance = calculateVariance(recentEntries.map(e => e.temperature));
  const hrVariance = calculateVariance(recentEntries.map(e => e.heartRate));
  
  if (tempVariance < 0.5 && hrVariance < 10) score += 15;
  
  // Symptom improvement
  const symptomTrend = analyzeSymptomTrend(recentEntries);
  if (symptomTrend === 'improving') score += 15;
  else if (symptomTrend === 'worsening') score -= 20;
  
  // Self-care activities
  const mealLoggingRate = recentEntries.filter(e => e.mealLogged).length / recentEntries.length;
  if (mealLoggingRate > 0.7) score += 10;
  
  return Math.max(0, Math.min(100, score));
};

const calculateVariance = (values: number[]): number => {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

const analyzeSymptomTrend = (entries: HistoricalData[]): 'improving' | 'stable' | 'worsening' => {
  if (entries.length < 3) return 'stable';
  
  const recentSymptoms = entries.slice(0, 3).map(e => e.symptoms.length);
  const olderSymptoms = entries.slice(3, 6).map(e => e.symptoms.length);
  
  const recentAvg = recentSymptoms.reduce((sum, len) => sum + len, 0) / recentSymptoms.length;
  const olderAvg = olderSymptoms.reduce((sum, len) => sum + len, 0) / olderSymptoms.length;
  
  if (recentAvg < olderAvg * 0.8) return 'improving';
  if (recentAvg > olderAvg * 1.2) return 'worsening';
  return 'stable';
};

export const generateRecoveryInsights = (profile: UserProfile): RecoveryInsight[] => {
  const insights: RecoveryInsight[] = [];
  
  if (!profile.recoveryMode?.isEnabled) return insights;
  
  const recentEntries = profile.historicalData.slice(0, 7);
  
  // Sleep analysis
  const poorSleepDays = recentEntries.filter(e => e.sleepHours && e.sleepHours < 5).length;
  if (poorSleepDays >= 3) {
    insights.push({
      type: 'sleep',
      message: `You've slept <5 hours for ${poorSleepDays} days. Sleep disruption can delay recovery. Would you like circadian rhythm tips or quiet breathing exercises?`,
      severity: 'warning',
      actionRequired: true,
      timestamp: new Date().toISOString()
    });
  }
  
  // Reinfection warning
  const concerningSymptoms = recentEntries.filter(entry => 
    entry.symptoms.toLowerCase().includes('chills') || 
    entry.heartRate > (profile.recoveryMode.recoveryBaseline?.heartRate || 100) + 20 ||
    entry.symptoms.toLowerCase().includes('pain')
  );
  
  if (concerningSymptoms.length >= 2) {
    insights.push({
      type: 'reinfection',
      message: 'These signs may indicate a possible reinfection. It\'s best to consult your provider within 24 hours.',
      severity: 'urgent',
      actionRequired: true,
      timestamp: new Date().toISOString()
    });
  }
  
  // Behavior coaching
  const mealLoggingGap = recentEntries.filter(e => !e.mealLogged).length;
  if (mealLoggingGap >= 5) {
    insights.push({
      type: 'behavior',
      message: 'Noticed you haven\'t logged meals this week — eating well supports tissue healing. Need some high-protein snack ideas?',
      severity: 'info',
      actionRequired: false,
      timestamp: new Date().toISOString()
    });
  }
  
  return insights;
};

export const adjustCheckInFrequency = (profile: UserProfile, recoveryScore: number): 'daily' | 'twice-daily' | '2-3x-week' => {
  if (recoveryScore >= 80) return '2-3x-week';
  if (recoveryScore >= 60) return 'daily';
  return 'twice-daily';
};

export const establishRecoveryBaseline = (profile: UserProfile): BaselineVitals | null => {
  if (profile.historicalData.length < 5) return null;
  
  const recentEntries = profile.historicalData.slice(0, 10);
  const avgTemp = recentEntries.reduce((sum, e) => sum + e.temperature, 0) / recentEntries.length;
  const avgHR = recentEntries.reduce((sum, e) => sum + e.heartRate, 0) / recentEntries.length;
  
  return {
    temperature: Math.round(avgTemp * 10) / 10,
    heartRate: Math.round(avgHR),
    normalSymptoms: 'Mild fatigue, recovery-related discomfort'
  };
};

export const getRecoveryScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

export const getRecoveryScoreEmoji = (score: number): string => {
  if (score >= 80) return '🟢';
  if (score >= 60) return '🟡';
  return '🔴';
};

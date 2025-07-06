
import { UserProfile, HistoricalData } from "@/types/sepsis";

export interface RecoveryTimelineData {
  daysSinceDischarge: number;
  symptomsProgression: 'Improving' | 'Same' | 'Worse';
  restQuality: '<4 hrs' | '4-6 hrs' | '6-8 hrs' | '>8 hrs';
  hydrationAndNutrition: boolean;
  medicationCompliance: boolean;
  weekOfRecovery: number;
}

export const calculateRecoveryWeek = (dischargeDateString: string): number => {
  if (!dischargeDateString) return 1;
  
  const dischargeDate = new Date(dischargeDateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - dischargeDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.ceil(diffDays / 7);
};

export const generateRecoveryProgressMessage = (
  timelineData: RecoveryTimelineData,
  profile: UserProfile
): string => {
  const { weekOfRecovery, symptomsProgression, hydrationAndNutrition, medicationCompliance } = timelineData;
  
  let message = `You're in Week ${weekOfRecovery} of a typical 6-week sepsis recovery window. `;
  
  // Symptom progression assessment
  if (symptomsProgression === 'Improving' && hydrationAndNutrition && medicationCompliance) {
    message += "Based on your improving symptoms and good adherence to care routines, your recovery appears to be progressing well. Keep it up!";
  } else if (symptomsProgression === 'Same' && hydrationAndNutrition) {
    message += "Your symptoms appear stable, which is typical during recovery. Maintaining good hydration and nutrition is helping support your healing process.";
  } else if (symptomsProgression === 'Worse' || !medicationCompliance) {
    message += "Some symptoms seem to be persisting or medication adherence may need attention. That's not unusual, but it may be worth checking in with your provider to make sure everything's on track.";
  } else {
    message += "Recovery can have ups and downs. Focus on rest, hydration, and following your care plan as your body continues to heal.";
  }
  
  return message;
};

export const generateWeeklyProgressSummary = (profile: UserProfile): string => {
  if (!profile.historicalData || profile.historicalData.length < 2) {
    return "Keep logging your daily check-ins to see your weekly progress summary!";
  }
  
  const recentEntries = profile.historicalData.slice(0, 7);
  const hydrationDays = recentEntries.filter(entry => entry.hydrationCompliance).length;
  const goodSleepDays = recentEntries.filter(entry => (entry.restHours || 0) >= 6).length;
  const improvingMood = recentEntries.some(entry => (entry.moodRating || 0) > 6);
  
  let summary = "This week: ";
  const improvements = [];
  
  if (hydrationDays >= 5) improvements.push("hydration was consistent");
  if (goodSleepDays >= 4) improvements.push("rest quality improved");
  if (improvingMood) improvements.push("mood showed positive signs");
  
  if (improvements.length > 0) {
    summary += improvements.join(", ") + ". Great progress!";
  } else {
    summary += "focus on maintaining consistent rest, hydration, and following your care plan.";
  }
  
  return summary;
};

export const getRecoveryProgressColor = (symptomsProgression: string, weekOfRecovery: number): string => {
  if (symptomsProgression === 'Improving') return 'text-green-600';
  if (symptomsProgression === 'Worse' && weekOfRecovery > 4) return 'text-red-600';
  if (symptomsProgression === 'Same' && weekOfRecovery <= 6) return 'text-blue-600';
  return 'text-yellow-600';
};

export const getRecoveryProgressPercentage = (weekOfRecovery: number, symptomsProgression: string): number => {
  const baseProgress = Math.min((weekOfRecovery / 6) * 100, 100);
  
  // Adjust based on symptoms
  if (symptomsProgression === 'Improving') return Math.min(baseProgress + 15, 100);
  if (symptomsProgression === 'Worse') return Math.max(baseProgress - 20, 10);
  
  return baseProgress;
};

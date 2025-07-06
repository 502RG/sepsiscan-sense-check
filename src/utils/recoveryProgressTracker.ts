
import { UserProfile, HistoricalData } from "@/types/sepsis";

export interface RecoveryTimelineData {
  daysSinceDischarge: number;
  symptomsProgression: 'Improving' | 'Same' | 'Worse';
  restQuality: '<4 hrs' | '4-6 hrs' | '6-8 hrs' | '>8 hrs';
  hydrationAndNutrition: boolean;
  medicationCompliance: boolean;
  weekOfRecovery: number;
}

export const calculateRecoveryWeek = (daysSinceDischarge: number): number => {
  if (!daysSinceDischarge || daysSinceDischarge <= 0) return 1;
  return Math.ceil(daysSinceDischarge / 7);
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

// Conversational check-in logic
export const generateConversationalGreeting = (profile: UserProfile): string => {
  const lastEntry = profile.historicalData?.[0];
  const daysSinceLastCheckin = lastEntry ? 
    Math.floor((Date.now() - lastEntry.timestamp) / (1000 * 60 * 60 * 24)) : 0;
  
  if (!lastEntry) {
    return "Hi! Welcome to your recovery check-in 😊 How are you feeling today?";
  }
  
  if (daysSinceLastCheckin === 0) {
    return "Hi again! Just checking in on your recovery today 😊";
  } else if (daysSinceLastCheckin === 1) {
    return "Good to see you back! How are things going since yesterday?";
  } else {
    return `Hi! It's been ${daysSinceLastCheckin} days since your last check-in. How have you been?`;
  }
};

export const generateFollowUpQuestion = (profile: UserProfile): string => {
  const lastEntry = profile.historicalData?.[0];
  
  if (!lastEntry) return "Let's start with how you're feeling overall today.";
  
  // Reference previous symptoms or concerns
  if (lastEntry.overallFeeling === 'Off' || lastEntry.overallFeeling === 'Sick') {
    return "Still feeling off like yesterday, or doing a bit better?";
  }
  
  if (lastEntry.recoverySymptoms && lastEntry.recoverySymptoms.includes('fatigue')) {
    return "Still feeling tired like yesterday, or has your energy improved?";
  }
  
  if (!lastEntry.hydrationCompliance) {
    return "How's your hydration going today? Were you able to drink more water?";
  }
  
  if (!lastEntry.medicationCompliance) {
    return "How are you doing with your medications today?";
  }
  
  return "How are things going since your last update?";
};

export const generateTrendFeedback = (profile: UserProfile): string[] => {
  if (!profile.historicalData || profile.historicalData.length < 2) {
    return [];
  }
  
  const feedback: string[] = [];
  const recentEntries = profile.historicalData.slice(0, 7);
  
  // Sleep trend
  const goodSleepDays = recentEntries.filter(entry => (entry.restHours || 0) >= 6).length;
  if (goodSleepDays >= 4) {
    feedback.push("Looks like your sleep improved this week — that's great! 😴");
  }
  
  // Hydration trend
  const goodHydrationDays = recentEntries.filter(entry => entry.hydrationCompliance).length;
  if (goodHydrationDays >= 5) {
    feedback.push("You've been staying hydrated consistently — keep it up! 💧");
  }
  
  // Symptom patterns
  const feverDays = recentEntries.filter(entry => 
    entry.recoverySymptoms?.includes('fever')
  ).length;
  
  if (feverDays === 0 && recentEntries.length >= 3) {
    feedback.push("No fever for several days now — that's encouraging! 🌡️");
  }
  
  // Mood tracking
  const moodImprovement = recentEntries.some(entry => (entry.moodRating || 0) > 7);
  if (moodImprovement) {
    feedback.push("Your mood seems to be lifting — that's wonderful to see! 😊");
  }
  
  return feedback;
};

export const shouldOfferQuickCheckIn = (profile: UserProfile): boolean => {
  if (!profile.historicalData || profile.historicalData.length < 3) {
    return false;
  }
  
  const recentEntries = profile.historicalData.slice(0, 3);
  const allStable = recentEntries.every(entry => 
    entry.overallFeeling === 'Great' || entry.overallFeeling === 'Okay'
  );
  
  const noRedFlags = recentEntries.every(entry => 
    !entry.recoverySymptoms?.some(symptom => 
      ['fever', 'confusion', 'severe breathing difficulty'].includes(symptom)
    )
  );
  
  return allStable && noRedFlags;
};


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
  
  // Use risk-aware language
  if (symptomsProgression === 'Improving' && hydrationAndNutrition && medicationCompliance) {
    message += "Based on your improving symptoms and good adherence to care routines, your recovery appears to be progressing well. Keep it up!";
  } else if (symptomsProgression === 'Same' && hydrationAndNutrition) {
    message += "Your symptoms appear stable, which is typical during recovery. Maintaining good hydration and nutrition is helping support your healing process.";
  } else if (symptomsProgression === 'Worse' || !medicationCompliance) {
    message += "Some symptoms seem to be persisting longer than expected. That's not unusual, but it may be worth checking in with your provider to make sure everything's on track.";
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

// Enhanced conversational check-in logic
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
  
  if (!lastEntry) return "How are things going since your last update?";
  
  // Adaptive questions based on previous responses
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
  
  // Sleep trend with specific day reference
  const goodSleepDays = recentEntries.filter(entry => (entry.restHours || 0) >= 6).length;
  if (goodSleepDays >= 4) {
    const lastGoodSleep = recentEntries.find(entry => (entry.restHours || 0) >= 6);
    const dayName = lastGoodSleep ? new Date(lastGoodSleep.timestamp).toLocaleDateString('en-US', { weekday: 'long' }) : 'recently';
    feedback.push(`Looks like your sleep improved since ${dayName} — that's great! 😴`);
  }
  
  // Hydration trend with encouragement
  const goodHydrationDays = recentEntries.filter(entry => entry.hydrationCompliance).length;
  if (goodHydrationDays >= 5) {
    feedback.push("You've been staying hydrated consistently — keep it up! 💧");
  }
  
  // Symptom patterns with specific tracking
  const feverDays = recentEntries.filter(entry => 
    entry.recoverySymptoms?.includes('fever')
  ).length;
  
  if (feverDays === 0 && recentEntries.length >= 3) {
    feedback.push("No fever for several days now — that's encouraging! 🌡️");
  }
  
  // Dizziness tracking
  const dizzyDays = recentEntries.filter(entry => 
    entry.recoverySymptoms?.includes('dizziness')
  ).length;
  
  if (dizzyDays >= 2) {
    feedback.push("You've logged dizziness two days in a row. Want me to flag that for follow-up?");
  }
  
  // Mood tracking with positive reinforcement
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

export const generateRiskAwareResponse = (response: string, profile: UserProfile): string => {
  const responseType = response.toLowerCase();
  
  if (responseType.includes('stable') || responseType === 'all-good') {
    return "Thanks for sharing — this helps us track your recovery journey. Keep following your care routine.";
  }
  
  if (responseType.includes('tired') || responseType.includes('fatigue')) {
    return "These symptoms can happen after sepsis. Let's keep an eye on them as you continue to heal.";
  }
  
  if (responseType.includes('pain') || responseType.includes('worried')) {
    return "This may warrant a quick chat with your provider to make sure everything's on track.";
  }
  
  return "Thanks for sharing — this helps us track your recovery journey.";
};

export const generateAdaptiveQuestions = (profile: UserProfile): {
  greeting?: string;
  followUp?: string;
  mainQuestion?: string;
  specificQuestion?: string;
  questions?: string[];
} => {
  const lastEntry = profile.historicalData?.[0];
  
  if (!lastEntry) {
    return {
      greeting: "Let's start tracking your recovery journey together! 😊",
      mainQuestion: "How are you feeling overall today?",
      questions: [
        "How did you sleep last night?",
        "Have you been able to stay hydrated today?",
        "Are you taking your medications as prescribed?"
      ]
    };
  }
  
  // Adaptive based on previous responses
  if (lastEntry.overallFeeling === 'Off' || lastEntry.overallFeeling === 'Sick') {
    return {
      greeting: "I remember you weren't feeling great yesterday 💙",
      followUp: "How are you doing today compared to yesterday?",
      mainQuestion: "Still feeling off, or are things improving?",
      specificQuestion: "Can you tell me more about what's been challenging?",
      questions: [
        "What symptoms are bothering you most today?",
        "Have you been able to rest?",
        "Are you keeping up with fluids?"
      ]
    };
  }
  
  if (lastEntry.recoverySymptoms?.includes('fatigue')) {
    return {
      greeting: "You mentioned feeling tired yesterday",
      followUp: "Has your energy improved since then?",
      mainQuestion: "How's your energy level today?",
      questions: [
        "Did you get better sleep last night?",
        "Have you been able to take breaks when needed?"
      ]
    };
  }
  
  return {
    mainQuestion: "How are you feeling today?",
    questions: [
      "Any changes since your last check-in?",
      "How's your overall energy?"
    ]
  };
};

export const detectRedFlags = (response: string): string[] => {
  const redFlags: string[] = [];
  const responseText = response.toLowerCase();
  
  // Check for concerning symptoms
  if (responseText.includes('fever') && responseText.includes('confusion')) {
    redFlags.push('Fever combined with confusion');
  }
  
  if (responseText.includes('breathing') && (responseText.includes('difficult') || responseText.includes('hard'))) {
    redFlags.push('Breathing difficulties');
  }
  
  if (responseText.includes('wound') && responseText.includes('swelling')) {
    redFlags.push('Wound swelling or changes');
  }
  
  if (responseText.includes('chest pain') || responseText.includes('heart racing')) {
    redFlags.push('Cardiac symptoms');
  }
  
  if (responseText.includes('very sick') || responseText.includes('terrible') || responseText.includes('emergency')) {
    redFlags.push('Severe overall symptoms');
  }
  
  return redFlags;
};

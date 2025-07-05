
import { UserProfile, HistoricalData, RecoveryInsight, RecoveryCoachData } from "@/types/sepsis";

export const RECOVERY_SYMPTOMS = [
  'wound pain',
  'swelling',
  'fever',
  'shortness of breath',
  'dizziness',
  'fatigue',
  'confusion',
  'nausea'
];

export const RED_FLAG_SYMPTOMS = [
  'persistent fever',
  'new confusion',
  'worsening wound',
  'severe breathing difficulty',
  'chest pain'
];

export const initializeRecoveryCoach = (profile: UserProfile): UserProfile => {
  if (!profile.recoveryMode?.coachEnabled) return profile;

  const recoveryCoachData: RecoveryCoachData = {
    lastCheckIn: new Date().toISOString(),
    weeklyMilestones: [
      {
        week: 1,
        goals: ['Complete medications daily', 'Stay hydrated', 'Rest 8+ hours'],
        completed: [],
        nextWeek: ['Light walking', 'Wound care routine']
      }
    ],
    redFlagAlerts: [],
    medicationReminders: {
      enabled: false,
      times: ['09:00', '21:00'],
      medications: profile.currentMedications?.split(',') || []
    },
    caregiverAlerts: [],
    cognitiveAssessments: [],
    progressTrends: {
      hydration: [],
      nutrition: [],
      mood: [],
      fatigue: []
    }
  };

  return {
    ...profile,
    recoveryMode: {
      ...profile.recoveryMode,
      recoveryCoachData,
      recoveryWeek: 1,
      lastCoachCheckIn: new Date().toISOString()
    }
  };
};

export const processRecoveryCheckIn = (
  profile: UserProfile,
  checkInData: {
    overallFeeling: 'Great' | 'Okay' | 'Off' | 'Sick';
    recoverySymptoms: string[];
    medicationCompliance: boolean;
    hydrationCompliance: boolean;
    nutritionCompliance: boolean;
    restHours: number;
    tookNaps: boolean;
    moodRating: number;
    woundChecked?: boolean;
    cognitiveIssues?: boolean;
  }
): {
  updatedProfile: UserProfile;
  insights: RecoveryInsight[];
  redFlags: string[];
} => {
  const insights: RecoveryInsight[] = [];
  const redFlags: string[] = [];

  // Check for red flag symptoms
  const hasRedFlags = checkInData.recoverySymptoms.some(symptom => 
    RED_FLAG_SYMPTOMS.some(redFlag => symptom.toLowerCase().includes(redFlag.toLowerCase()))
  );

  if (hasRedFlags || checkInData.overallFeeling === 'Sick') {
    redFlags.push("You've reported signs that may signal infection is returning. Please call your provider or seek urgent care now.");
    
    insights.push({
      type: 'reinfection',
      message: 'Critical symptoms detected. Contact healthcare provider immediately.',
      severity: 'urgent',
      actionRequired: true,
      timestamp: new Date().toISOString()
    });
  }

  // Medication compliance
  if (!checkInData.medicationCompliance) {
    insights.push({
      type: 'medication',
      message: 'Missed medications can slow recovery. Would you like help setting daily reminders?',
      severity: 'warning',
      actionRequired: true,
      timestamp: new Date().toISOString()
    });
  }

  // Hydration and nutrition
  if (!checkInData.hydrationCompliance) {
    insights.push({
      type: 'hydration',
      message: 'Drink at least 8 oz of water every 2 hours today. Proper hydration supports healing.',
      severity: 'info',
      actionRequired: false,
      timestamp: new Date().toISOString()
    });
  }

  if (!checkInData.nutritionCompliance) {
    insights.push({
      type: 'nutrition',
      message: 'Try easy-to-digest foods like soup, rice, bananas, or toast to support recovery.',
      severity: 'info',
      actionRequired: false,
      timestamp: new Date().toISOString()
    });
  }

  // Sleep and rest
  if (checkInData.restHours < 6) {
    insights.push({
      type: 'sleep',
      message: 'Your body needs adequate rest to heal. Aim for 7-8 hours of sleep per night.',
      severity: 'warning',
      actionRequired: false,
      timestamp: new Date().toISOString()
    });
  }

  if (!checkInData.tookNaps && checkInData.restHours < 7) {
    insights.push({
      type: 'sleep',
      message: 'Short naps (20-30 min) can reduce fatigue and promote healing.',
      severity: 'info',
      actionRequired: false,
      timestamp: new Date().toISOString()
    });
  }

  // Mood tracking
  if (checkInData.moodRating <= 3) {
    insights.push({
      type: 'mood',
      message: 'Try light journaling, music, or 10 minutes of deep breathing to boost your mood.',
      severity: 'info',
      actionRequired: false,
      timestamp: new Date().toISOString()
    });
  }

  // Cognitive issues
  if (checkInData.cognitiveIssues) {
    insights.push({
      type: 'cognitive',
      message: 'Cognitive changes after sepsis are common but should be monitored. Consider discussing with your provider.',
      severity: 'warning',
      actionRequired: true,
      timestamp: new Date().toISOString()
    });
  }

  // Update profile with new data
  const newHistoricalEntry: HistoricalData = {
    date: new Date().toLocaleDateString(),
    temperature: profile.baseline?.temperature || 98.6,
    heartRate: profile.baseline?.heartRate || 70,
    symptoms: checkInData.recoverySymptoms.join(', '),
    riskLevel: hasRedFlags ? 'High' : checkInData.overallFeeling === 'Off' ? 'Moderate' : 'Low',
    timestamp: Date.now(),
    overallFeeling: checkInData.overallFeeling,
    recoverySymptoms: checkInData.recoverySymptoms,
    medicationCompliance: checkInData.medicationCompliance,
    hydrationCompliance: checkInData.hydrationCompliance,
    nutritionCompliance: checkInData.nutritionCompliance,
    restHours: checkInData.restHours,
    tookNaps: checkInData.tookNaps,
    moodRating: checkInData.moodRating,
    woundChecked: checkInData.woundChecked,
    cognitiveIssues: checkInData.cognitiveIssues
  };

  const updatedProfile: UserProfile = {
    ...profile,
    historicalData: [newHistoricalEntry, ...profile.historicalData],
    recoveryMode: {
      ...profile.recoveryMode!,
      lastCoachCheckIn: new Date().toISOString(),
      recoveryCoachData: {
        ...profile.recoveryMode!.recoveryCoachData!,
        lastCheckIn: new Date().toISOString(),
        progressTrends: {
          hydration: [...(profile.recoveryMode!.recoveryCoachData?.progressTrends.hydration || []), checkInData.hydrationCompliance ? 1 : 0].slice(-7),
          nutrition: [...(profile.recoveryMode!.recoveryCoachData?.progressTrends.nutrition || []), checkInData.nutritionCompliance ? 1 : 0].slice(-7),
          mood: [...(profile.recoveryMode!.recoveryCoachData?.progressTrends.mood || []), checkInData.moodRating].slice(-7),
          fatigue: [...(profile.recoveryMode!.recoveryCoachData?.progressTrends.fatigue || []), checkInData.restHours].slice(-7)
        }
      }
    }
  };

  return { updatedProfile, insights, redFlags };
};

export const generateWeeklyMilestones = (profile: UserProfile, week: number): string[] => {
  const baseGoals = [
    'Complete prescribed medications daily',
    'Stay well hydrated (8+ glasses water)',
    'Get adequate rest (7-8 hours sleep)'
  ];

  switch (week) {
    case 1:
      return [...baseGoals, 'Monitor wound healing', 'Track symptoms daily'];
    case 2:
      return [...baseGoals, 'Light walking (5-10 minutes)', 'Social interaction'];
    case 3:
      return [...baseGoals, 'Increase activity gradually', 'Return to light household tasks'];
    case 4:
      return [...baseGoals, 'Consider return to work discussion', 'Regular exercise routine'];
    default:
      return [...baseGoals, 'Maintain healthy routines', 'Continue monitoring'];
  }
};

export const generateWeeklyProgressSummary = (profile: UserProfile): string[] => {
  if (!profile.recoveryMode?.recoveryCoachData) return [];

  const trends = profile.recoveryMode.recoveryCoachData.progressTrends;
  const summary: string[] = [];

  // Hydration analysis
  const hydrationRate = trends.hydration.filter(h => h === 1).length;
  if (hydrationRate >= 5) {
    summary.push("💧 Hydration improved 5+ out of 7 days this week — excellent work!");
  } else if (hydrationRate >= 3) {
    summary.push("💧 Hydration was good 3-4 days this week — let's aim for more consistent hydration.");
  } else {
    summary.push("💧 Hydration needs attention — try setting hourly water reminders.");
  }

  // Nutrition analysis
  const nutritionRate = trends.nutrition.filter(n => n === 1).length;
  if (nutritionRate >= 5) {
    summary.push("🍎 Nutrition goals met most days — great job fueling your recovery!");
  } else {
    summary.push("🍎 Nutrition could be improved — try meal prep or simple, nutritious snacks.");
  }

  // Mood trends
  const avgMood = trends.mood.reduce((sum, mood) => sum + mood, 0) / trends.mood.length;
  if (avgMood >= 7) {
    summary.push("😊 Your mood has been consistently positive this week!");
  } else if (avgMood >= 5) {
    summary.push("😐 Your mood has been stable — consider activities that bring you joy.");
  } else {
    summary.push("😔 Your mood has been low — this is normal during recovery, but consider talking to someone.");
  }

  return summary;
};

export const getRecoveryFAQResponse = (question: string): string => {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes('eat') || lowerQuestion.includes('food') || lowerQuestion.includes('nutrition')) {
    return "Focus on easy-to-digest, protein-rich foods like chicken soup, eggs, yogurt, bananas, and rice. Stay hydrated and eat small, frequent meals. Avoid processed foods and alcohol.";
  }

  if (lowerQuestion.includes('work') || lowerQuestion.includes('job')) {
    return "Return to work timing varies by individual. Most people need 2-4 weeks for desk jobs, longer for physical work. Start with reduced hours if possible. Fatigue is common for weeks to months.";
  }

  if (lowerQuestion.includes('wound') || lowerQuestion.includes('pain')) {
    return "Mild wound discomfort is normal during healing. Watch for increased redness, pus, warmth, or worsening pain, which could indicate infection. Keep wounds clean and dry, change dressings as directed.";
  }

  if (lowerQuestion.includes('tired') || lowerQuestion.includes('fatigue')) {
    return "Post-sepsis fatigue can last weeks to months. Rest when needed, take short naps (20-30 min), gradually increase activity, and maintain good sleep hygiene. This is a normal part of recovery.";
  }

  if (lowerQuestion.includes('exercise') || lowerQuestion.includes('activity')) {
    return "Start with gentle activities like short walks. Gradually increase duration and intensity based on how you feel. Listen to your body and rest when needed. Avoid strenuous exercise until cleared by your doctor.";
  }

  return "I understand you have questions about your recovery. For specific medical concerns, please consult with your healthcare provider. I'm here to support you with general recovery guidance and monitoring.";
};

export const shouldEscalateToProvider = (profile: UserProfile): boolean => {
  if (!profile.recoveryMode?.recoveryCoachData) return false;

  const recentEntries = profile.historicalData.slice(0, 3);
  
  // Check for persistent concerning symptoms
  const persistentSymptoms = recentEntries.filter(entry => 
    entry.overallFeeling === 'Sick' || 
    entry.recoverySymptoms?.some(symptom => RED_FLAG_SYMPTOMS.some(red => symptom.includes(red)))
  ).length;

  // Check for missed medications
  const missedMedications = recentEntries.filter(entry => 
    entry.medicationCompliance === false
  ).length;

  // Check for cognitive concerns
  const cognitiveIssues = recentEntries.some(entry => entry.cognitiveIssues);

  return persistentSymptoms >= 2 || missedMedications >= 2 || cognitiveIssues;
};

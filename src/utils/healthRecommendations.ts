import { UserInputs, UserProfile, RiskAssessment, HistoricalData } from "@/types/sepsis";

export interface HealthRecommendation {
  id: string;
  message: string;
  category: 'hydration' | 'rest' | 'wound-care' | 'breathing' | 'medication' | 'monitoring';
  isPersonalized: boolean;
  basedOnSymptoms: string[];
}

export interface RecommendationFeedback {
  recommendationId: string;
  rating: 'helpful' | 'not-relevant' | 'not-helpful';
  timestamp: string;
}

export const generateHealthRecommendations = (
  userInputs: UserInputs,
  profile: UserProfile,
  riskAssessment: RiskAssessment
): HealthRecommendation[] => {
  // Don't show recommendations for high-risk situations
  if (riskAssessment.level === 'High' || riskAssessment.alertLevel === 'Urgent') {
    return [];
  }

  // Check for severe symptoms that should not receive recommendations
  const severeSymptoms = ['confusion', 'shortness of breath', 'unresponsive', 'severe breathing'];
  const hasSevereSymptoms = severeSymptoms.some(symptom => 
    userInputs.symptoms.toLowerCase().includes(symptom)
  );
  
  if (hasSevereSymptoms) {
    return [];
  }

  const recommendations: HealthRecommendation[] = [];
  const symptoms = userInputs.symptoms.toLowerCase();
  const temp = parseFloat(userInputs.temperature);
  const hr = parseFloat(userInputs.heartRate);
  const currentTime = new Date();
  const isNightTime = currentTime.getHours() >= 22 || currentTime.getHours() <= 6;

  // Analyze symptom history for personalization
  const recentEntries = profile.historicalData.slice(0, 7);
  const persistentSymptoms = findPersistentSymptoms(recentEntries, symptoms);

  // Fever and chills recommendations
  if (temp > 99.5 && (symptoms.includes('chills') || symptoms.includes('cold'))) {
    let message = "Drink warm fluids and rest in a comfortable, warm environment.";
    
    if (persistentSymptoms.includes('chills')) {
      message = "You've reported chills multiple times recently. " + message + " Consider layered clothing you can adjust as needed.";
    }
    
    if (isNightTime) {
      message += " Since it's nighttime, focus on staying warm and getting quality rest.";
    }

    recommendations.push({
      id: 'fever-chills',
      message,
      category: 'rest',
      isPersonalized: persistentSymptoms.includes('chills') || isNightTime,
      basedOnSymptoms: ['fever', 'chills']
    });
  }

  // Fatigue recommendations
  if (symptoms.includes('fatigue') || symptoms.includes('tired') || symptoms.includes('weakness')) {
    let message = "Avoid strenuous activity today and prioritize rest. Stay hydrated with water or electrolyte drinks.";
    
    if (userInputs.activityLevel === 'Exercising') {
      message = "Consider reducing exercise intensity today. " + message;
    }
    
    if (persistentSymptoms.includes('fatigue')) {
      message = "Your fatigue has persisted across multiple check-ins. " + message + " Monitor for any worsening symptoms.";
    }

    recommendations.push({
      id: 'fatigue-rest',
      message,
      category: 'rest',
      isPersonalized: persistentSymptoms.includes('fatigue'),
      basedOnSymptoms: ['fatigue', 'weakness']
    });
  }

  // Wound care recommendations
  if (symptoms.includes('wound') || symptoms.includes('cut') || symptoms.includes('surgical site')) {
    let message = "Monitor the wound area for increased redness, swelling, or warmth. Keep it clean and dry.";
    
    // Personalize for diabetics
    if (profile.knownConditions.some(condition => condition.toLowerCase().includes('diabetes'))) {
      message += " Since you have diabetes, check your blood sugar regularly and watch for slow healing.";
    }
    
    if (profile.knownConditions.some(condition => condition.toLowerCase().includes('surgery'))) {
      message = "Monitor your surgical site closely. " + message + " Contact your surgeon if you notice drainage or increased pain.";
    }

    recommendations.push({
      id: 'wound-care',
      message,
      category: 'wound-care',
      isPersonalized: profile.knownConditions.length > 0,
      basedOnSymptoms: ['wound']
    });
  }

  // Breathing recommendations (only for mild symptoms)
  if ((symptoms.includes('breathing') || symptoms.includes('cough')) && !symptoms.includes('shortness')) {
    let message = "Rest in an upright position and avoid cold air or known triggers.";
    
    if (isNightTime) {
      message += " Use extra pillows to elevate your head while sleeping.";
    }

    recommendations.push({
      id: 'mild-breathing',
      message,
      category: 'breathing',
      isPersonalized: isNightTime,
      basedOnSymptoms: ['breathing', 'cough']
    });
  }

  // Lightheadedness/dizziness recommendations
  if (symptoms.includes('dizzy') || symptoms.includes('lightheaded') || symptoms.includes('weak')) {
    let message = "Sit or lie down immediately. Elevate your legs if possible and recheck your vitals in 15 minutes.";
    
    if (hr > 100) {
      message += " Your elevated heart rate may be contributing to these symptoms.";
    }

    recommendations.push({
      id: 'dizziness',
      message,
      category: 'monitoring',
      isPersonalized: hr > 100,
      basedOnSymptoms: ['dizziness', 'lightheaded']
    });
  }

  // Medication adherence recommendations
  if (profile.currentMedications && profile.currentMedications.toLowerCase().includes('antibiotic')) {
    recommendations.push({
      id: 'antibiotic-adherence',
      message: "Continue taking your antibiotics as prescribed, even if you feel better. Avoid alcohol and report any severe side effects to your provider.",
      category: 'medication',
      isPersonalized: true,
      basedOnSymptoms: []
    });
  }

  // Hydration recommendations (general wellness)
  if (temp > 99.0 || symptoms.includes('fatigue') || hr > profile.baseline?.heartRate || 90) {
    recommendations.push({
      id: 'hydration',
      message: "Increase fluid intake with water, clear broths, or electrolyte solutions. Avoid caffeine and alcohol.",
      category: 'hydration',
      isPersonalized: false,
      basedOnSymptoms: ['fever', 'fatigue']
    });
  }

  return recommendations.slice(0, 2); // Limit to 2 recommendations max
};

const findPersistentSymptoms = (entries: HistoricalData[], currentSymptoms: string): string[] => {
  const symptoms = ['fatigue', 'chills', 'breathing', 'wound', 'dizziness'];
  const persistent: string[] = [];
  
  symptoms.forEach(symptom => {
    if (currentSymptoms.includes(symptom)) {
      let count = 1;
      for (const entry of entries.slice(0, 3)) {
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

export const shouldSuppressRecommendations = (
  userInputs: UserInputs,
  riskAssessment: RiskAssessment
): boolean => {
  // Suppress if high risk
  if (riskAssessment.level === 'High' || riskAssessment.alertLevel === 'Urgent') {
    return true;
  }

  // Suppress if vital signs are worsening significantly
  const temp = parseFloat(userInputs.temperature);
  const hr = parseFloat(userInputs.heartRate);
  
  if (temp > 103 || hr > 120) {
    return true;
  }

  // Suppress if user reports feeling very sick
  if (userInputs.subjectiveFeedback?.toLowerCase().includes('very sick') || 
      userInputs.subjectiveFeedback?.toLowerCase().includes('terrible')) {
    return true;
  }

  // Suppress if multiple red flag symptoms
  const redFlags = ['confusion', 'shortness', 'severe', 'unresponsive', 'chest pain'];
  const flagCount = redFlags.filter(flag => 
    userInputs.symptoms.toLowerCase().includes(flag)
  ).length;
  
  return flagCount >= 2;
};


import { UserInputs, UserProfile } from "@/types/sepsis";

export interface LowVitalThresholds {
  temperature: number; // < 96.8°F
  heartRate: number; // < 60 bpm
  spO2: number; // < 92%
  systolicBP: number; // < 90 mmHg
  respiratoryRate: number; // < 12 bpm
}

export const LOW_VITAL_THRESHOLDS: LowVitalThresholds = {
  temperature: 96.8,
  heartRate: 60,
  spO2: 92,
  systolicBP: 90,
  respiratoryRate: 12
};

export const detectLowVitals = (userInputs: UserInputs, profile: UserProfile) => {
  const lowVitalFlags: string[] = [];
  let lowVitalCount = 0;
  
  const temp = parseFloat(userInputs.temperature);
  const hr = parseFloat(userInputs.heartRate);
  const spO2 = userInputs.spO2 ? parseFloat(userInputs.spO2) : null;
  const systolicBP = userInputs.systolicBP ? parseFloat(userInputs.systolicBP) : null;
  const respiratoryRate = userInputs.respiratoryRate ? parseFloat(userInputs.respiratoryRate) : null;
  
  // Check temperature
  if (temp < LOW_VITAL_THRESHOLDS.temperature) {
    lowVitalFlags.push(`Dangerously low temperature (${temp}°F) - below 96.8°F indicates potential hypothermia or severe infection`);
    lowVitalCount++;
  }
  
  // Check heart rate (only if symptomatic)
  const hasSymptoms = userInputs.symptoms.toLowerCase().includes('fatigue') || 
                     userInputs.symptoms.toLowerCase().includes('confusion') ||
                     userInputs.symptoms.toLowerCase().includes('dizzy') ||
                     userInputs.symptoms.toLowerCase().includes('weak');
  
  if (hr < LOW_VITAL_THRESHOLDS.heartRate && hasSymptoms) {
    lowVitalFlags.push(`Critically low heart rate (${hr} bpm) with symptoms - may indicate cardiac complications or severe sepsis`);
    lowVitalCount++;
  }
  
  // Check SpO2 if available
  if (spO2 !== null && spO2 < LOW_VITAL_THRESHOLDS.spO2) {
    lowVitalFlags.push(`Dangerously low oxygen saturation (${spO2}%) - indicates respiratory compromise`);
    lowVitalCount++;
  }
  
  // Check blood pressure if available
  if (systolicBP !== null && systolicBP < LOW_VITAL_THRESHOLDS.systolicBP) {
    lowVitalFlags.push(`Critically low blood pressure (${systolicBP} mmHg) - indicates potential shock or severe hypotension`);
    lowVitalCount++;
  }
  
  // Check respiratory rate if available
  if (respiratoryRate !== null && respiratoryRate < LOW_VITAL_THRESHOLDS.respiratoryRate) {
    lowVitalFlags.push(`Dangerously low respiratory rate (${respiratoryRate} breaths/min) - indicates respiratory depression`);
    lowVitalCount++;
  }
  
  return {
    lowVitalFlags,
    lowVitalCount,
    isCritical: lowVitalCount >= 2
  };
};

export const checkEmergencyBypass = (
  userInputs: UserInputs, 
  profile: UserProfile, 
  lowVitalCount: number
): boolean => {
  if (!profile.emergencySettings?.autoAlertBypassEnabled) return false;
  
  const hasSeriousSymptoms = userInputs.symptoms.toLowerCase().includes('confusion') ||
                           userInputs.symptoms.toLowerCase().includes('unresponsive') ||
                           userInputs.symptoms.toLowerCase().includes('dizzy');
  
  const consecutiveMissed = profile.emergencySettings.consecutiveMissedCheckins || 0;
  
  // Trigger if 2+ low vitals + serious symptoms + user hasn't responded to recent check-ins
  return lowVitalCount >= 2 && hasSeriousSymptoms && consecutiveMissed >= 2;
};

export const getLowVitalRiskEscalation = (lowVitalCount: number, hasSymptoms: boolean): {
  riskIncrease: number;
  escalationMessage: string;
} => {
  if (lowVitalCount === 0) {
    return { riskIncrease: 0, escalationMessage: '' };
  }
  
  let riskIncrease = lowVitalCount * 2; // Each low vital adds 2 risk points
  let escalationMessage = '';
  
  if (lowVitalCount === 1) {
    escalationMessage = "Your vital signs appear lower than healthy ranges. Low values like this, especially when paired with symptoms, can indicate serious health deterioration such as late-stage sepsis, cardiac complications, or medication side effects. Based on this, I'm escalating your risk level. Please contact your provider immediately or seek urgent care.";
    if (hasSymptoms) riskIncrease += 1;
  } else if (lowVitalCount >= 2) {
    escalationMessage = "Multiple vital signs are critically low. This combination can indicate severe health deterioration, late-stage sepsis, shock, or life-threatening complications. IMMEDIATE medical attention is required. Please call 911 or go to the emergency room now.";
    riskIncrease += 3; // Additional escalation for multiple low vitals
  }
  
  return { riskIncrease, escalationMessage };
};

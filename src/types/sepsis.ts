export interface BaselineVitals {
  temperature: number;
  heartRate: number;
  normalSymptoms: string;
}

export interface UserInputs {
  temperature: string;
  heartRate: string;
  symptoms: string;
  symptomDuration: string;
  activityLevel: string;
  medications: string;
  userMode: string;
  subjectiveFeedback?: string;
  spO2?: string;
  systolicBP?: string;
  respiratoryRate?: string;
}

export interface RiskAssessment {
  level: 'Low' | 'Moderate' | 'High';
  confidence: 'Low' | 'Medium' | 'High';
  flaggedRisks: string[];
  recommendation: string;
  reassurance: string;
  patternAnalysis: string[];
  trendAnalysis?: string;
  alertLevel?: 'None' | 'Monitor' | 'Urgent';
  adaptiveThresholdSuggestion?: string;
  infectionTimelineEstimate?: string;
  nightModeMessage?: string;
  providerIntegrationSuggestion?: string;
  conversationalMemory?: string[];
  missedCheckinAlert?: string;
  personalizedInsights?: string[];
  lowVitalFlags?: string[];
  criticalLowVitalAlert?: boolean;
  emergencyBypassTriggered?: boolean;
}

export interface HistoricalData {
  date: string;
  temperature: number;
  heartRate: number;
  symptoms: string;
  riskLevel: string;
  timestamp: number;
  subjectiveFeedback?: string;
  isExercising?: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  sleepHours?: number;
  recoveryScore?: number;
  woundStatus?: string;
  mealLogged?: boolean;
  waterIntake?: number;
  // Recovery Coach specific fields
  overallFeeling?: 'Great' | 'Okay' | 'Off' | 'Sick';
  recoverySymptoms?: string[];
  medicationCompliance?: boolean;
  hydrationCompliance?: boolean;
  nutritionCompliance?: boolean;
  restHours?: number;
  tookNaps?: boolean;
  moodRating?: number;
  woundChecked?: boolean;
  cognitiveIssues?: boolean;
}

export interface RecoveryCoachData {
  lastCheckIn: string;
  weeklyMilestones: {
    week: number;
    goals: string[];
    completed: string[];
    nextWeek: string[];
  }[];
  redFlagAlerts: {
    date: string;
    symptoms: string[];
    escalated: boolean;
  }[];
  medicationReminders: {
    enabled: boolean;
    times: string[];
    medications: string[];
  };
  caregiverAlerts: {
    lastAlert: string;
    alertType: 'symptoms' | 'medication' | 'mood';
    resolved: boolean;
  }[];
  cognitiveAssessments: {
    date: string;
    hasIssues: boolean;
    details: string;
  }[];
  progressTrends: {
    hydration: number[];
    nutrition: number[];
    mood: number[];
    fatigue: number[];
  };
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  knownConditions: string[];
  currentMedications?: string;
  baseline?: BaselineVitals;
  historicalData: HistoricalData[];
  createdAt: string;
  adaptiveThresholds?: {
    heartRate?: number;
    temperature?: number;
    lastUpdated: string;
  };
  locationEnabled?: boolean;
  personalPatterns?: {
    symptomLanguage: string[];
    timeOfDayPatterns: {
      morning: { avgHR: number; avgTemp: number };
      afternoon: { avgHR: number; avgTemp: number };
      evening: { avgHR: number; avgTemp: number };
      night: { avgHR: number; avgTemp: number };
    };
    dangerousSymptomCombos: string[][];
    lastCheckinTime?: string;
    missedCheckinCount?: number;
  };
  deviceMonitoring?: {
    isActive: boolean;
    lastActivity: string;
    wearableConnected: boolean;
    batteryLevel?: number;
    inactivityCount: number;
  };
  privacySettings?: {
    zeroKnowledgeMode: boolean;
    autoDeleteDays: number;
    cloudBackupEnabled: boolean;
    hipaaCompliant: boolean;
  };
  recoveryMode?: {
    isEnabled: boolean;
    startDate: string;
    baselineEstablished: boolean;
    recoveryBaseline?: BaselineVitals;
    checkInFrequency: 'daily' | 'twice-daily' | '2-3x-week';
    lastRecoveryScore?: number;
    caregiverNotifications: boolean;
    caregiverContact?: string;
    // Recovery Coach specific fields
    coachEnabled?: boolean;
    recoveryWeek?: number;
    lastCoachCheckIn?: string;
    recoveryCoachData?: RecoveryCoachData;
  };
  caregiverContacts?: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
    notifyAfterHours: number;
  }[];
  emergencySettings?: {
    autoAlertBypassEnabled: boolean;
    emergencyContact?: string;
    lastResponseTime?: string;
    consecutiveMissedCheckins: number;
  };
}

export interface GeolocationAlert {
  type: 'outbreak' | 'hospital_alert' | 'regional_risk';
  message: string;
  severity: 'info' | 'warning' | 'urgent';
  location: string;
}

export interface DeviceStatus {
  isOnline: boolean;
  batteryLevel?: number;
  lastSync: string;
  wearableConnected: boolean;
  tamperDetected: boolean;
}

export interface RecoveryInsight {
  type: 'sleep' | 'symptom' | 'behavior' | 'reinfection' | 'improvement' | 'hydration' | 'nutrition' | 'medication' | 'mood' | 'cognitive';
  message: string;
  severity: 'info' | 'warning' | 'urgent';
  actionRequired: boolean;
  timestamp: string;
}

export interface PrivacyMode {
  enabled: boolean;
  encryptionLevel: 'device-only' | 'end-to-end';
  dataRetentionDays: number;
  complianceFlags: ('HIPAA' | 'GDPR')[];
}

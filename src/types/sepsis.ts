
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
}

export interface HistoricalData {
  date: string;
  temperature: number;
  heartRate: number;
  symptoms: string;
  riskLevel: string;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  knownConditions: string[];
  baseline?: BaselineVitals;
  historicalData: HistoricalData[];
  createdAt: string;
}

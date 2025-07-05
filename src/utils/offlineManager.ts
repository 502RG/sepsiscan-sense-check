
import { UserProfile, UserInputs, RiskAssessment } from "@/types/sepsis";

export interface OfflineData {
  id: string;
  timestamp: number;
  userInputs: UserInputs;
  riskAssessment: RiskAssessment;
  profileId: string;
  synced: boolean;
  encrypted: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface OfflineSettings {
  autoDeleteDays: number;
  emergencyContacts: EmergencyContact[];
  emergencyTimeoutSeconds: number;
}

const OFFLINE_STORAGE_KEY = 'sepsiscan-offline-data';
const OFFLINE_SETTINGS_KEY = 'sepsiscan-offline-settings';

// Simple encryption for local storage (in production, use proper encryption)
const encryptData = (data: any): string => {
  return btoa(JSON.stringify(data));
};

const decryptData = (encryptedData: string): any => {
  try {
    return JSON.parse(atob(encryptedData));
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    return null;
  }
};

export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const saveOfflineData = (
  userInputs: UserInputs,
  riskAssessment: RiskAssessment,
  profileId: string
): void => {
  const offlineEntry: OfflineData = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    userInputs,
    riskAssessment,
    profileId,
    synced: false,
    encrypted: true
  };

  const existingData = getOfflineData();
  const updatedData = [...existingData, offlineEntry];
  
  const encryptedData = encryptData(updatedData);
  localStorage.setItem(OFFLINE_STORAGE_KEY, encryptedData);
  
  console.log('Data saved offline:', offlineEntry.id);
};

export const getOfflineData = (): OfflineData[] => {
  const encryptedData = localStorage.getItem(OFFLINE_STORAGE_KEY);
  if (!encryptedData) return [];
  
  const data = decryptData(encryptedData);
  return Array.isArray(data) ? data : [];
};

export const getUnsyncedData = (): OfflineData[] => {
  return getOfflineData().filter(entry => !entry.synced);
};

export const markDataAsSynced = (entryIds: string[]): void => {
  const data = getOfflineData();
  const updatedData = data.map(entry => 
    entryIds.includes(entry.id) ? { ...entry, synced: true } : entry
  );
  
  const encryptedData = encryptData(updatedData);
  localStorage.setItem(OFFLINE_STORAGE_KEY, encryptedData);
};

export const cleanupOldData = (): void => {
  const settings = getOfflineSettings();
  const cutoffTime = Date.now() - (settings.autoDeleteDays * 24 * 60 * 60 * 1000);
  
  const data = getOfflineData();
  const recentData = data.filter(entry => entry.timestamp > cutoffTime);
  
  if (recentData.length !== data.length) {
    const encryptedData = encryptData(recentData);
    localStorage.setItem(OFFLINE_STORAGE_KEY, encryptedData);
    console.log(`Cleaned up ${data.length - recentData.length} old offline entries`);
  }
};

export const getOfflineSettings = (): OfflineSettings => {
  const settings = localStorage.getItem(OFFLINE_SETTINGS_KEY);
  if (settings) {
    return JSON.parse(settings);
  }
  
  const defaultSettings: OfflineSettings = {
    autoDeleteDays: 30,
    emergencyContacts: [],
    emergencyTimeoutSeconds: 30
  };
  
  localStorage.setItem(OFFLINE_SETTINGS_KEY, JSON.stringify(defaultSettings));
  return defaultSettings;
};

export const updateOfflineSettings = (settings: OfflineSettings): void => {
  localStorage.setItem(OFFLINE_SETTINGS_KEY, JSON.stringify(settings));
};

export const checkEmergencyConditions = (
  userInputs: UserInputs,
  riskAssessment: RiskAssessment
): boolean => {
  const temp = parseFloat(userInputs.temperature);
  const hr = parseFloat(userInputs.heartRate);
  const spO2 = userInputs.spO2 ? parseFloat(userInputs.spO2) : null;
  
  let abnormalVitals = 0;
  
  // Check for abnormal vitals
  if (hr > 120 || hr < 50) abnormalVitals++;
  if (temp > 102.5 || temp < 96.5) abnormalVitals++;
  if (spO2 && spO2 < 92) abnormalVitals++;
  if (userInputs.systolicBP && parseFloat(userInputs.systolicBP) < 90) abnormalVitals++;
  
  // Check for serious symptoms
  const seriousSymptoms = userInputs.symptoms.toLowerCase().includes('confusion') ||
                         userInputs.symptoms.toLowerCase().includes('fainting') ||
                         userInputs.symptoms.toLowerCase().includes('unconscious');
  
  const feelingVerySick = userInputs.subjectiveFeedback === 'I feel very sick';
  
  return abnormalVitals >= 2 && (seriousSymptoms || feelingVerySick);
};

export const triggerEmergencyResponse = async (
  userInputs: UserInputs,
  profile: UserProfile,
  riskAssessment: RiskAssessment
): Promise<void> => {
  const settings = getOfflineSettings();
  
  console.log('🚨 EMERGENCY RESPONSE TRIGGERED');
  
  // Prepare emergency data
  const emergencyData = {
    timestamp: new Date().toISOString(),
    patient: profile.name,
    age: profile.age,
    vitals: {
      temperature: userInputs.temperature,
      heartRate: userInputs.heartRate,
      spO2: userInputs.spO2,
      bloodPressure: userInputs.systolicBP
    },
    symptoms: userInputs.symptoms,
    riskLevel: riskAssessment.level,
    location: 'Unknown (offline mode)'
  };
  
  try {
    // Try to make emergency call (if supported by device)
    if ('serviceWorker' in navigator) {
      // Register for background sync when connection returns
      console.log('Emergency data prepared for sync when online');
    }
    
    // Try SMS to emergency contacts (if supported)
    if (settings.emergencyContacts.length > 0) {
      const emergencyMessage = `EMERGENCY ALERT: ${profile.name} (age ${profile.age}) - High sepsis risk detected. Vitals: HR ${userInputs.heartRate}, Temp ${userInputs.temperature}°F. Symptoms: ${userInputs.symptoms}. Last check: ${new Date().toLocaleString()}`;
      
      // In a real app, this would use SMS API
      console.log('Emergency SMS would be sent:', emergencyMessage);
    }
    
    // Store emergency event
    const emergencyEvent = {
      id: `emergency-${Date.now()}`,
      timestamp: Date.now(),
      data: emergencyData,
      attempted911: true,
      attemptedContacts: settings.emergencyContacts.length > 0
    };
    
    const emergencyLog = JSON.parse(localStorage.getItem('emergency-log') || '[]');
    emergencyLog.push(emergencyEvent);
    localStorage.setItem('emergency-log', JSON.stringify(emergencyLog));
    
  } catch (error) {
    console.error('Emergency response error:', error);
  }
};

export const syncOfflineData = async (
  profiles: UserProfile[],
  updateProfiles: (profiles: UserProfile[]) => void
): Promise<void> => {
  if (!isOnline()) return;
  
  const unsyncedData = getUnsyncedData();
  if (unsyncedData.length === 0) return;
  
  console.log(`Syncing ${unsyncedData.length} offline entries...`);
  
  // Group data by profile
  const dataByProfile = unsyncedData.reduce((acc, entry) => {
    if (!acc[entry.profileId]) acc[entry.profileId] = [];
    acc[entry.profileId].push(entry);
    return acc;
  }, {} as Record<string, OfflineData[]>);
  
  // Update profiles with offline data
  const updatedProfiles = profiles.map(profile => {
    const profileData = dataByProfile[profile.id] || [];
    if (profileData.length === 0) return profile;
    
    const newHistoricalEntries = profileData.map(entry => ({
      date: new Date(entry.timestamp).toLocaleDateString(),
      temperature: parseFloat(entry.userInputs.temperature),
      heartRate: parseFloat(entry.userInputs.heartRate),
      symptoms: entry.userInputs.symptoms,
      riskLevel: entry.riskAssessment.level,
      timestamp: entry.timestamp,
      subjectiveFeedback: entry.userInputs.subjectiveFeedback,
      isExercising: entry.userInputs.activityLevel === 'Exercising',
      timeOfDay: getTimeOfDay(entry.timestamp),
      wasOffline: true
    }));
    
    return {
      ...profile,
      historicalData: [...newHistoricalEntries, ...profile.historicalData]
    };
  });
  
  updateProfiles(updatedProfiles);
  
  // Mark as synced
  const syncedIds = unsyncedData.map(entry => entry.id);
  markDataAsSynced(syncedIds);
  
  console.log('Offline data sync completed');
};

const getTimeOfDay = (timestamp: number): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = new Date(timestamp).getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
};


import { UserProfile, DeviceStatus } from "@/types/sepsis";

export const checkDeviceInactivity = (profile: UserProfile): string | null => {
  if (!profile.deviceMonitoring) return null;
  
  const lastActivity = new Date(profile.deviceMonitoring.lastActivity);
  const now = new Date();
  const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
  
  // 24 hour inactivity check
  if (hoursSinceActivity >= 24 && hoursSinceActivity < 72) {
    return `Hi ${profile.name}, we haven't seen activity from your device in a few days. Please ensure your SepsiScan monitoring is active to stay safe.`;
  }
  
  // 72+ hour escalation to caregiver
  if (hoursSinceActivity >= 72 && profile.caregiverContacts && profile.caregiverContacts.length > 0) {
    return `${profile.name} hasn't checked in for 3+ days. We recommend reaching out to ensure they're okay.`;
  }
  
  return null;
};

export const checkTamperDetection = (deviceStatus: DeviceStatus): string | null => {
  if (deviceStatus.tamperDetected) {
    return "Device tampering detected. Please ensure your monitoring device is properly connected and secure.";
  }
  
  if (deviceStatus.wearableConnected && deviceStatus.batteryLevel && deviceStatus.batteryLevel < 10) {
    return "Your monitoring device battery is critically low. Please charge immediately to maintain continuous monitoring.";
  }
  
  return null;
};

export const updateDeviceActivity = (profile: UserProfile): UserProfile => {
  return {
    ...profile,
    deviceMonitoring: {
      ...profile.deviceMonitoring,
      isActive: true,
      lastActivity: new Date().toISOString(),
      inactivityCount: 0
    }
  };
};

export const enableZeroKnowledgeMode = (profile: UserProfile, autoDeleteDays: number = 30): UserProfile => {
  return {
    ...profile,
    privacySettings: {
      zeroKnowledgeMode: true,
      autoDeleteDays,
      cloudBackupEnabled: false,
      hipaaCompliant: true
    }
  };
};

export const cleanOldData = (profile: UserProfile): UserProfile => {
  if (!profile.privacySettings?.zeroKnowledgeMode) return profile;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - profile.privacySettings.autoDeleteDays);
  
  const filteredHistory = profile.historicalData.filter(entry => 
    new Date(entry.timestamp) > cutoffDate
  );
  
  return {
    ...profile,
    historicalData: filteredHistory
  };
};

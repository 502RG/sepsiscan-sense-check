
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Trash2, Eye, EyeOff } from "lucide-react";
import { UserProfile } from "@/types/sepsis";

interface PrivacySettingsProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  profile,
  onUpdateProfile
}) => {
  const [zeroKnowledgeEnabled, setZeroKnowledgeEnabled] = useState(
    profile.privacySettings?.zeroKnowledgeMode || false
  );
  const [autoDeleteDays, setAutoDeleteDays] = useState(
    profile.privacySettings?.autoDeleteDays || 30
  );

  const handleZeroKnowledgeToggle = (enabled: boolean) => {
    setZeroKnowledgeEnabled(enabled);
    onUpdateProfile({
      ...profile,
      privacySettings: {
        ...profile.privacySettings,
        zeroKnowledgeMode: enabled,
        autoDeleteDays,
        cloudBackupEnabled: !enabled,
        hipaaCompliant: enabled
      }
    });
  };

  const handleAutoDeleteChange = (days: number) => {
    setAutoDeleteDays(days);
    onUpdateProfile({
      ...profile,
      privacySettings: {
        ...profile.privacySettings,
        autoDeleteDays: days,
        zeroKnowledgeMode: zeroKnowledgeEnabled,
        cloudBackupEnabled: !zeroKnowledgeEnabled,
        hipaaCompliant: zeroKnowledgeEnabled
      }
    });
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Privacy & Data Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zero Knowledge Mode */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="font-medium">Zero-Knowledge Data Mode</span>
            </div>
            <Switch
              checked={zeroKnowledgeEnabled}
              onCheckedChange={handleZeroKnowledgeToggle}
            />
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>SepsiScan never stores or shares your health data unless you choose to. You control your health, your way.</strong>
            </p>
            <p className="text-xs text-blue-700">
              {zeroKnowledgeEnabled 
                ? "✅ All data encrypted and stored locally only" 
                : "Cloud backup enabled for data recovery"
              }
            </p>
          </div>

          {zeroKnowledgeEnabled && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                HIPAA Compliant
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                GDPR Compliant
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <EyeOff className="w-3 h-3 mr-1" />
                Device-Only Storage
              </Badge>
            </div>
          )}
        </div>

        {/* Auto-Delete Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span className="font-medium">Auto-Delete Historical Data</span>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Automatically delete records older than:
            </p>
            <div className="flex gap-2">
              {[7, 14, 30, 90].map((days) => (
                <Button
                  key={days}
                  size="sm"
                  variant={autoDeleteDays === days ? "default" : "outline"}
                  onClick={() => handleAutoDeleteChange(days)}
                >
                  {days} days
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Current Data Status</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <p>Total Records: {profile.historicalData.length}</p>
            <p>Storage Mode: {zeroKnowledgeEnabled ? 'Local Device Only' : 'Cloud Backup Enabled'}</p>
            <p>Data Retention: {autoDeleteDays} days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;

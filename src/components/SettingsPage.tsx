import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Heart } from "lucide-react";
import { UserProfile } from "@/types/sepsis";
import PrivacySettings from "./PrivacySettings";
import RecoveryDashboard from "./RecoveryDashboard";

interface SettingsPageProps {
  profile: UserProfile;
  onBack: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
  view: 'main' | 'privacy' | 'recovery';
  onViewChange: (view: 'main' | 'privacy' | 'recovery') => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  profile, 
  onBack, 
  onUpdateProfile, 
  view, 
  onViewChange 
}) => {
  if (view === 'privacy') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => onViewChange('main')}
            variant="ghost"
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Button>
          <PrivacySettings profile={profile} onUpdateProfile={onUpdateProfile} />
        </div>
      </div>
    );
  }

  if (view === 'recovery') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4">
        <div className="max-w-3xl mx-auto">
          <Button
            onClick={() => onViewChange('main')}
            variant="ghost"
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Button>
          <RecoveryDashboard profile={profile} onUpdateProfile={onUpdateProfile} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
          <CardHeader>
            <Button
              onClick={onBack}
              variant="ghost"
              className="mb-4 flex items-center gap-2 self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Main
            </Button>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Settings for {profile.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => onViewChange('privacy')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 flex items-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Privacy & Zero-Knowledge Mode
            </Button>
            
            <Button
              onClick={() => onViewChange('recovery')}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 flex items-center gap-2"
              disabled={!profile.recoveryMode?.isEnabled}
            >
              <Heart className="w-5 h-5" />
              Recovery Dashboard
              {!profile.recoveryMode?.isEnabled && (
                <span className="text-xs opacity-75 ml-2">(Enable in Profile)</span>
              )}
            </Button>

            <div className="text-sm text-gray-600 space-y-2 mt-6">
              <p><strong>Privacy Settings:</strong> Enable Zero-Knowledge Mode for maximum data privacy with local-only storage.</p>
              <p><strong>Recovery Dashboard:</strong> Track your post-sepsis recovery progress with adaptive insights.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;

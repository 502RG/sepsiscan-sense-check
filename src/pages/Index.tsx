import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Activity, Users, Settings } from "lucide-react";
import { UserInputs, UserProfile, HistoricalData } from "@/types/sepsis";
import { performRiskAnalysis } from "@/utils/riskAnalysis";
import ProfileManagement from "@/components/ProfileManagement";
import SettingsPage from "@/components/SettingsPage";
import SepsisAssessment from "@/components/SepsisAssessment";

const Index = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'profile-select' | 'assessment' | 'settings'>('profile-select');
  const [settingsView, setSettingsView] = useState<'main' | 'privacy' | 'recovery'>('main');

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      saveToStorage('selectedProfileId', selectedProfile.id);
    }
  }, [selectedProfile]);

  const loadProfiles = async () => {
    try {
      const storedProfiles = localStorage.getItem('userProfiles');
      if (storedProfiles) {
        const parsedProfiles = JSON.parse(storedProfiles) as UserProfile[];
        setProfiles(parsedProfiles);

        const selectedProfileId = localStorage.getItem('selectedProfileId');
        if (selectedProfileId) {
          const profile = parsedProfiles.find(p => p.id === selectedProfileId);
          if (profile) {
            setSelectedProfile(profile);
            setView('assessment');
          }
        }
      }
    } catch (error) {
      console.error("Error loading profiles from local storage:", error);
    }
  };

  const saveToStorage = (key: string, value: string) => {
    localStorage.setItem(key, value);
  };

  const handleProfileCreate = (profile: Omit<UserProfile, 'id' | 'historicalData' | 'createdAt'>) => {
    const newProfile: UserProfile = {
      ...profile,
      id: Math.random().toString(36).substring(7),
      historicalData: [],
      createdAt: new Date().toISOString(),
    };

    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem('userProfiles', JSON.stringify(updatedProfiles));
  };

  const handleProfileDelete = (profileId: string) => {
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(updatedProfiles);
    localStorage.setItem('userProfiles', JSON.stringify(updatedProfiles));
    setSelectedProfile(null);
    setView('profile-select');
    localStorage.removeItem('selectedProfileId');
  };

  const handleProfileSelect = (profile: UserProfile) => {
    setSelectedProfile(profile);
    setView('assessment');
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfiles(profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    if (selectedProfile?.id === updatedProfile.id) {
      setSelectedProfile(updatedProfile);
    }
  };

  if (view === 'settings') {
    return (
      <SettingsPage
        profile={selectedProfile!}
        onBack={() => setView('assessment')}
        onUpdateProfile={handleProfileUpdate}
        view={settingsView}
        onViewChange={setSettingsView}
      />
    );
  }

  if (view === 'profile-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="container mx-auto max-w-md">
          <ProfileManagement
            profiles={profiles}
            onProfileSelect={handleProfileSelect}
            onProfileCreate={handleProfileCreate}
            onProfileDelete={handleProfileDelete}
            onProfileUpdate={handleProfileUpdate}
          />
        </div>
      </div>
    );
  }

  if (view === 'assessment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4">
        <div className="container mx-auto max-w-2xl">
          <Button
            onClick={() => setView('profile-select')}
            variant="ghost"
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile Select
          </Button>
          <SepsisAssessment
            profile={selectedProfile!}
            onProfileUpdate={handleProfileUpdate}
            onSettingsClick={() => setView('settings')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex items-center justify-center">
      <Card className="shadow-md rounded-md p-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Welcome to Sepsis Risk Assessment Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please select a profile to start the assessment.</p>
          <Button onClick={() => setView('profile-select')}>
            Go to Profile Selection
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;

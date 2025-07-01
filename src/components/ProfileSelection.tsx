
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, User, ArrowLeft } from "lucide-react";
import { UserProfile } from "@/types/sepsis";

interface ProfileSelectionProps {
  profiles: UserProfile[];
  onProfileSelect: (profile: UserProfile) => void;
  onProfileCreate: (profile: Omit<UserProfile, 'id' | 'historicalData' | 'createdAt'>) => void;
}

const ProfileSelection: React.FC<ProfileSelectionProps> = ({
  profiles,
  onProfileSelect,
  onProfileCreate,
}) => {
  const [step, setStep] = useState<'select' | 'create'>('select');
  const [newProfile, setNewProfile] = useState({
    name: '',
    age: '',
    knownConditions: [] as string[],
    conditionsText: '',
  });

  const handleCreateProfile = () => {
    const conditions = newProfile.conditionsText
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    onProfileCreate({
      name: newProfile.name,
      age: parseInt(newProfile.age),
      knownConditions: conditions,
    });
  };

  if (step === 'create') {
    return (
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('select')}
              className="p-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Create New Profile
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={newProfile.name}
              onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="Enter age"
              value={newProfile.age}
              onChange={(e) => setNewProfile({...newProfile, age: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conditions">Known Medical Conditions</Label>
            <Textarea
              id="conditions"
              placeholder="e.g., diabetes, cancer, recent surgery (separate with commas)"
              value={newProfile.conditionsText}
              onChange={(e) => setNewProfile({...newProfile, conditionsText: e.target.value})}
              className="min-h-20"
            />
          </div>

          <Button
            onClick={handleCreateProfile}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!newProfile.name || !newProfile.age}
          >
            Create Profile & Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold text-gray-900">Who is this for?</CardTitle>
        <p className="text-gray-600 mt-2">
          Select an existing profile or create a new one to track health over time.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {profiles.length > 0 && (
          <div className="space-y-2">
            <Label>Existing Profiles</Label>
            <div className="space-y-2">
              {profiles.map((profile) => (
                <Button
                  key={profile.id}
                  variant="outline"
                  className="w-full justify-start p-4 h-auto"
                  onClick={() => onProfileSelect(profile)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <User className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium">{profile.name}</div>
                      <div className="text-sm text-gray-500">
                        Age {profile.age} • {profile.historicalData.length} check-ins
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          onClick={() => setStep('create')}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Create New Profile
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileSelection;

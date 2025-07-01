
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserPlus, User, ArrowLeft, Trash2, Users } from "lucide-react";
import { UserProfile } from "@/types/sepsis";

interface ProfileManagementProps {
  profiles: UserProfile[];
  onProfileSelect: (profile: UserProfile) => void;
  onProfileCreate: (profile: Omit<UserProfile, 'id' | 'historicalData' | 'createdAt'>) => void;
  onProfileDelete: (profileId: string) => void;
}

const ProfileManagement: React.FC<ProfileManagementProps> = ({
  profiles,
  onProfileSelect,
  onProfileCreate,
  onProfileDelete,
}) => {
  const [step, setStep] = useState<'select' | 'create'>('select');
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [newProfile, setNewProfile] = useState({
    name: '',
    age: '',
    knownConditions: [] as string[],
    conditionsText: '',
    currentMedications: '',
    baselineTemp: '',
    baselineHR: '',
  });

  const handleCreateProfile = () => {
    const conditions = newProfile.conditionsText
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const baseline = newProfile.baselineTemp && newProfile.baselineHR ? {
      temperature: parseFloat(newProfile.baselineTemp),
      heartRate: parseFloat(newProfile.baselineHR),
      normalSymptoms: '',
    } : undefined;

    onProfileCreate({
      name: newProfile.name,
      age: parseInt(newProfile.age),
      knownConditions: conditions,
      currentMedications: newProfile.currentMedications || undefined,
      baseline,
    });
  };

  const handleDeleteConfirm = (profileId: string) => {
    onProfileDelete(profileId);
    setShowDeleteDialog(null);
  };

  const profileToDelete = profiles.find(p => p.id === showDeleteDialog);

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
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={newProfile.name}
              onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age *</Label>
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

          <div className="space-y-2">
            <Label htmlFor="medications">Current Medications</Label>
            <Input
              id="medications"
              placeholder="List current medications"
              value={newProfile.currentMedications}
              onChange={(e) => setNewProfile({...newProfile, currentMedications: e.target.value})}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <Label className="text-sm font-medium text-gray-700">Personal Baseline (Optional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="baselineTemp" className="text-xs">Normal Temperature (°F)</Label>
                <Input
                  id="baselineTemp"
                  type="number"
                  step="0.1"
                  placeholder="98.6"
                  value={newProfile.baselineTemp}
                  onChange={(e) => setNewProfile({...newProfile, baselineTemp: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="baselineHR" className="text-xs">Normal Heart Rate (bpm)</Label>
                <Input
                  id="baselineHR"
                  type="number"
                  placeholder="70"
                  value={newProfile.baselineHR}
                  onChange={(e) => setNewProfile({...newProfile, baselineHR: e.target.value})}
                />
              </div>
            </div>
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
    <>
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Users className="w-5 h-5" />
            Who are we checking today?
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Select an existing profile, create a new one, or manage existing profiles.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {profiles.length > 0 && (
            <div className="space-y-2">
              <Label>Existing Profiles</Label>
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 justify-start p-4 h-auto"
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteDialog(profile.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                {profiles.length > 0 ? 'Or' : 'Get Started'}
              </span>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Profile</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to permanently delete the profile for{' '}
              <strong>{profileToDelete?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This will remove all {profileToDelete?.historicalData.length || 0} check-ins and cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteDialog && handleDeleteConfirm(showDeleteDialog)}
            >
              Delete Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileManagement;

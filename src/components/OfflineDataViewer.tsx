
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { OfflineData } from "@/utils/offlineManager";

interface OfflineDataViewerProps {
  offlineData: OfflineData[];
  onClose: () => void;
}

const OfflineDataViewer: React.FC<OfflineDataViewerProps> = ({ offlineData, onClose }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'destructive';
      case 'Moderate': return 'default';
      case 'Low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Offline Data ({offlineData.length} entries)
            </CardTitle>
            <Button onClick={onClose} variant="ghost" size="sm">
              ✕ Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {offlineData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No offline data stored</p>
              ) : (
                offlineData
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((entry) => (
                    <Card key={entry.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getRiskColor(entry.riskAssessment.level)}>
                              {entry.riskAssessment.level} Risk
                            </Badge>
                            {entry.synced ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Temperature:</span> {entry.userInputs.temperature}°F
                          </div>
                          <div>
                            <span className="font-medium">Heart Rate:</span> {entry.userInputs.heartRate} bpm
                          </div>
                          {entry.userInputs.spO2 && (
                            <div>
                              <span className="font-medium">SpO₂:</span> {entry.userInputs.spO2}%
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Activity:</span> {entry.userInputs.activityLevel}
                          </div>
                        </div>
                        
                        {entry.userInputs.symptoms && (
                          <div className="mt-2">
                            <span className="font-medium text-sm">Symptoms:</span>
                            <p className="text-sm text-gray-700">{entry.userInputs.symptoms}</p>
                          </div>
                        )}
                        
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            Status: {entry.synced ? 'Synced' : 'Pending sync'}
                          </span>
                          {entry.riskAssessment.alertLevel === 'Urgent' && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineDataViewer;

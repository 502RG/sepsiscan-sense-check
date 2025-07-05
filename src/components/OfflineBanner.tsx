
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Clock } from "lucide-react";

interface OfflineBannerProps {
  isOffline: boolean;
  unsyncedCount: number;
  onViewOfflineData?: () => void;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ 
  isOffline, 
  unsyncedCount,
  onViewOfflineData 
}) => {
  if (!isOffline && unsyncedCount === 0) return null;

  return (
    <Alert className={`${isOffline ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'} mb-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOffline ? (
            <WifiOff className="w-4 h-4 text-orange-600" />
          ) : (
            <Wifi className="w-4 h-4 text-blue-600" />
          )}
          <AlertDescription className={`${isOffline ? 'text-orange-800' : 'text-blue-800'} font-medium`}>
            {isOffline ? (
              <>
                <Badge variant="secondary" className="mr-2">Offline Mode</Badge>
                Monitoring locally — Data will sync when connection resumes
              </>
            ) : (
              <>
                <Badge variant="secondary" className="mr-2">Online</Badge>
                Connected — All features available
              </>
            )}
          </AlertDescription>
        </div>
        
        {unsyncedCount > 0 && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              {unsyncedCount} unsynced
            </span>
            {onViewOfflineData && (
              <button
                onClick={onViewOfflineData}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                View
              </button>
            )}
          </div>
        )}
      </div>
      
      {isOffline && (
        <div className="mt-2 text-xs text-orange-700">
          Emergency features remain active. If you experience severe symptoms, use emergency services directly.
        </div>
      )}
    </Alert>
  );
};

export default OfflineBanner;

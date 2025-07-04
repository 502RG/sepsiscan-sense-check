
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Droplets, Moon, Stethoscope, Pill, Eye, ThumbsUp, AlertTriangle, ThumbsDown } from "lucide-react";

interface HealthRecommendation {
  id: string;
  message: string;
  category: 'hydration' | 'rest' | 'wound-care' | 'breathing' | 'medication' | 'monitoring';
  isPersonalized: boolean;
  basedOnSymptoms: string[];
}

interface HealthRecommendationsProps {
  recommendations: HealthRecommendation[];
  onFeedback?: (recommendationId: string, rating: 'helpful' | 'not-relevant' | 'not-helpful') => void;
}

const HealthRecommendations: React.FC<HealthRecommendationsProps> = ({ 
  recommendations, 
  onFeedback 
}) => {
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hydration': return <Droplets className="w-4 h-4 text-blue-500" />;
      case 'rest': return <Moon className="w-4 h-4 text-purple-500" />;
      case 'wound-care': return <Heart className="w-4 h-4 text-red-500" />;
      case 'breathing': return <Stethoscope className="w-4 h-4 text-green-500" />;
      case 'medication': return <Pill className="w-4 h-4 text-orange-500" />;
      case 'monitoring': return <Eye className="w-4 h-4 text-gray-500" />;
      default: return <Heart className="w-4 h-4 text-blue-500" />;
    }
  };

  const handleFeedback = (recommendationId: string, rating: 'helpful' | 'not-relevant' | 'not-helpful') => {
    if (onFeedback) {
      onFeedback(recommendationId, rating);
    }
    setFeedbackGiven(prev => new Set(prev).add(recommendationId));
  };

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Personalized Health Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="bg-white p-4 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              {getCategoryIcon(rec.category)}
              <div className="flex-1">
                <p className="text-gray-800 mb-2">{rec.message}</p>
                {rec.isPersonalized && (
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full mb-2">
                    Personalized for you
                  </span>
                )}
                
                {!feedbackGiven.has(rec.id) && onFeedback && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm text-gray-600">Was this helpful?</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFeedback(rec.id, 'helpful')}
                      className="text-green-600 hover:bg-green-50"
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Helpful
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFeedback(rec.id, 'not-relevant')}
                      className="text-yellow-600 hover:bg-yellow-50"
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Not relevant
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFeedback(rec.id, 'not-helpful')}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <ThumbsDown className="w-3 h-3 mr-1" />
                      Not helpful
                    </Button>
                  </div>
                )}
                
                {feedbackGiven.has(rec.id) && (
                  <p className="text-sm text-gray-500 mt-2 italic">Thank you for your feedback!</p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mt-4">
          <p className="text-sm text-yellow-800">
            <strong>Safety Notice:</strong> These tips are supportive and based on your reported symptoms. 
            They are not medical advice. If you feel worse or your risk increases, please seek professional care.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthRecommendations;

import { useState } from 'react';

export const useTrip = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  return {
    isGenerating,
    setIsGenerating,
  };
};

'use client';

import { useState, useEffect } from 'react';
import { sempozyumService } from '@/lib/services';

export function useSymposium() {
  const [symposium, setSymposium] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSymposium = async () => {
      try {
        const data = await sempozyumService.getAktifSempozyum();
        setSymposium(data);
      } catch (error) {
        console.error('Error fetching symposium info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSymposium();
  }, []);

  return { symposium, loading };
} 
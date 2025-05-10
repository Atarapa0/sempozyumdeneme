"use client";

import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex flex-wrap justify-center gap-4">
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 w-20 text-center">
        <div className="text-3xl font-bold">{timeLeft.days}</div>
        <div className="text-sm">Gün</div>
      </div>
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 w-20 text-center">
        <div className="text-3xl font-bold">{timeLeft.hours}</div>
        <div className="text-sm">Saat</div>
      </div>
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 w-20 text-center">
        <div className="text-3xl font-bold">{timeLeft.minutes}</div>
        <div className="text-sm">Dakika</div>
      </div>
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 w-20 text-center">
        <div className="text-3xl font-bold">{timeLeft.seconds}</div>
        <div className="text-sm">Saniye</div>
      </div>
    </div>
  );
} 
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

interface Step {
  id: string;
  stepNumber: number;
  instruction: string;
  timerSeconds: number | null;
  temperatureC: number | null;
  speed: string | null;
}

export default function CookingClient({ recipeId, steps }: { recipeId: string; steps: Step[] }) {
  const storageKey = `ai-chef-progress-${recipeId}`;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = Number.parseInt(stored, 10);
      if (!Number.isNaN(parsed)) {
        setCurrentIndex(parsed);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, currentIndex.toString());
  }, [currentIndex, storageKey]);

  const currentStep = steps[currentIndex];

  useEffect(() => {
    setTimer(currentStep?.timerSeconds ?? null);
    setRunning(false);
  }, [currentIndex, currentStep?.timerSeconds]);

  useEffect(() => {
    if (!running || timer === null) {
      return;
    }
    if (timer <= 0) {
      setRunning(false);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => (prev === null ? null : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [running, timer]);

  const formattedTimer = useMemo(() => {
    if (timer === null) {
      return null;
    }
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timer]);

  if (!currentStep) {
    return <p className="text-slate-300">No steps found.</p>;
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
      <div>
        <p className="text-sm text-slate-400">Step {currentStep.stepNumber} of {steps.length}</p>
        <h3 className="text-xl font-semibold text-white">{currentStep.instruction}</h3>
        <p className="text-xs text-slate-500">
          {currentStep.temperatureC ? `Temp ${currentStep.temperatureC}°C` : ''}
          {currentStep.speed ? ` • Speed ${currentStep.speed}` : ''}
        </p>
      </div>

      {currentStep.timerSeconds ? (
        <div className="rounded-md border border-slate-800 p-4">
          <p className="text-sm text-slate-400">Timer</p>
          <p className="text-2xl font-semibold text-white">{formattedTimer}</p>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => setRunning((prev) => !prev)}>
              {running ? 'Pause' : 'Start'}
            </Button>
            <Button variant="outline" onClick={() => setTimer(currentStep.timerSeconds)}>
              Reset
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
          disabled={currentIndex === 0}
        >
          Back
        </Button>
        <Button
          onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, steps.length - 1))}
          disabled={currentIndex === steps.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

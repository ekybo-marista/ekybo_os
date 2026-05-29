"use client";

import { useEffect, useState } from "react";

const bootSteps = [
  "BOOTING EKYBO_OS...",
  "INITIALIZING ARCHITECT_MODE...",
  "LOADING PROJECT_DATABASE...",
  "SYNCING VISUAL_ENGINE...",
  "EKYBO_STUDIO LOADED",
  "ACCESS GRANTED",
];

export default function BootScreen() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [displayedSteps, setDisplayedSteps] = useState<string[]>([]);

  useEffect(() => {
    const timers: number[] = [];

    const stepDelays = [650, 1350, 2050, 2750, 3450, 5450];

    bootSteps.forEach((step, index) => {
      timers.push(
        window.setTimeout(() => {
          setDisplayedSteps((prev) => [...prev, step]);
        }, stepDelays[index])
      );
    });

    timers.push(window.setTimeout(() => setExiting(true), 6400));
    timers.push(window.setTimeout(() => setVisible(false), 7000));

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  if (!visible) {
    return null;
  }

  const studioLoaded = displayedSteps.includes("EKYBO_STUDIO LOADED");
  const accessGranted = displayedSteps.includes("ACCESS GRANTED");

  return (
    <div className={exiting ? "boot-screen boot-screen-exit" : "boot-screen"}>
      <div className="boot-inner">
        <div className="boot-console" aria-label="System boot sequence">
          {displayedSteps.map((step) => (
            <div
              key={step}
              className={step === "EKYBO_STUDIO LOADED" ? "boot-line-primary" : step === "ACCESS GRANTED" ? "boot-line-active" : "boot-line"}
            >
              {step}
            </div>
          ))}
          {!accessGranted && <div className="boot-cursor">_</div>}
        </div>

        {studioLoaded && (
          <div className="boot-logo-stage" aria-label="EKYBO logo initializing">
            <div className="boot-code-lines boot-code-lines-left">
              <span>SYS_RENDER: VECTOR</span>
              <span>MASK_SYNC: TRUE</span>
              <span>GLYPH_LOCK: OK</span>
            </div>
            <div className="boot-logo-frame">
              <div className="boot-logo" />
              <div className="boot-logo-scan" />
            </div>
            <div className="boot-code-lines boot-code-lines-right">
              <span>ARCH_MODE: ACTIVE</span>
              <span>DATABASE: ONLINE</span>
              <span>ACCESS: GRANTED</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

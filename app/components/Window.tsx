"use client";

import React from "react";

type Props = {
  title?: string;
  children?: React.ReactNode;
  className?: string;
  onClose?: () => void;
};

export default function Window({ title, children, className = "", onClose }: Props) {
  return (
    <div className={`os-window ${className}`}>
      <div className="os-titlebar">
        <div className="os-controls">
          <div className="os-dot close" />
          <div className="os-dot min" />
          <div className="os-dot" />
        </div>
        <div className="text-xs arch-ghost">{title}</div>
        {onClose ? (
          <button type="button" className="window-close" onClick={onClose} aria-label="Close window">
            Close
          </button>
        ) : (
          <div style={{ width: 36 }} />
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

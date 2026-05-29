"use client";

import React from "react";

type Props = {
  project: import("../projects/data").Project;
  onOpen: (p: import("../projects/data").Project) => void;
};

export default function ProjectCard({ project, onOpen }: Props) {
  return (
    <div className="hover:scale-[1.02] transition-transform duration-150">
      <div className="os-window">
        <div className="os-titlebar">
          <div className="os-controls">
            <div className="os-dot" />
            <div className="os-dot" />
            <div className="os-dot" />
          </div>
          <div className="text-xs arch-ghost">{project.code}</div>
          <div style={{ width: 36 }} />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold">{project.name}</h3>
          <div className="mt-2 text-sm arch-ghost">
            {project.status} / {project.year}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => onOpen(project)}
              className="rounded-md px-3 py-2 bg-white/6 text-sm"
            >
              OPEN FILE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

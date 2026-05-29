"use client";

import React from "react";
import Window from "./Window";

type Props = {
  project: import("../projects/data").Project | null;
  open: boolean;
  onClose: () => void;
};

export default function ProjectModal({ project, open, onClose }: Props) {
  if (!open || !project) {
    return null;
  }

  return (
    <div className="arch-modal-backdrop">
      <Window title={`${project.code} - ${project.name}`} onClose={onClose}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm arch-ghost">
              {project.code} / {project.status} / {project.year}
            </div>
            <h2 className="text-2xl font-semibold mt-2">{project.name}</h2>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <section>
            <h4 className="text-sm arch-ghost">Metadata</h4>
            <p className="mt-2">
              {project.type} / {project.location} / {project.assets.join(" / ")} / {project.files}
            </p>
          </section>

          <section>
            <h4 className="text-sm arch-ghost">Concept</h4>
            <div className="mt-2 arch-ghost">Concept visuals and short notes placeholder.</div>
          </section>

          <section className="grid grid-cols-2 gap-4 mt-2">
            <div className="p-3 arch-card">Drawings placeholder</div>
            <div className="p-3 arch-card">Renders placeholder</div>
            <div className="col-span-2 p-3 arch-card">3D Model placeholder</div>
          </section>

          <div className="mt-4 flex justify-end">
            <button type="button" className="px-4 py-2 rounded-md border border-white/10" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </Window>
    </div>
  );
}

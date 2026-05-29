"use client";

import type { ProjectStats } from "../projects/data";

type View = "home" | "projects" | "studio" | "cv" | "contact" | "project_view";

type Props = {
  view: View;
  projectStats: ProjectStats;
};

export default function TopBar({ view, projectStats }: Props) {
  const isProjects = view === "projects" || view === "project_view";

  return (
    <header className="top-bar">
      <div className="top-bar-brand">
        <span>EKYBO_OS</span>
        <span className="top-bar-muted">/ {isProjects ? "PROJECT_INDEX" : "ARCHITECT_MODE"}</span>
      </div>

      <div className="top-bar-status" aria-label="System status">
        <span>
          DATABASE ONLINE <span className="status-dot" />
        </span>
        <span>PROJECTS: <strong>{projectStats.totalProjects}</strong></span>
        <span>RENDERS: <strong>{projectStats.totalRenders}</strong></span>
        <span>DRAWINGS: <strong>{projectStats.totalDrawings}</strong></span>
        <span>SECTIONS: <strong>{projectStats.totalSections}</strong></span>
        <span>PLANS: <strong>{projectStats.totalPlans}</strong></span>
        <span>SITE_DATA: <strong>{projectStats.totalSiteData}</strong></span>
      </div>
    </header>
  );
}

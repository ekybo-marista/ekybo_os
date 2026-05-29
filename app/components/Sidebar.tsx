"use client";

type View = "home" | "projects" | "studio" | "cv" | "contact" | "project_view";

type Props = {
  activeView: View;
  onNavigate: (view: Exclude<View, "project_view">) => void;
};

const items: Array<{ view: Exclude<View, "project_view">; label: string }> = [
  { view: "home", label: "HOME" },
  { view: "projects", label: "PROJECTS" },
  { view: "studio", label: "PROFILE" },
  { view: "cv", label: "CV" },
  { view: "contact", label: "CONTACT" },
];

export default function Sidebar({ activeView, onNavigate }: Props) {
  const normalizedActiveView = activeView === "project_view" ? "projects" : activeView;

  return (
    <aside className="side-rail" aria-label="Primary navigation">
      <nav className="side-rail-nav">
        {items.map((item) => {
          const isActive = normalizedActiveView === item.view;

          return (
            <button
              key={item.label}
              type="button"
              className={isActive ? "side-link side-link-active" : "side-link"}
              onClick={() => onNavigate(item.view)}
            >
              {isActive ? "> " : ""}[ {item.label} ]
            </button>
          );
        })}
      </nav>
      <div className="side-rail-footer">
        <div>EKYBO_OS</div>
        <div>v1.0</div>
      </div>
    </aside>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps, ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MotionProps } from "framer-motion";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import HologramModel from "./components/HologramModel";
import type { Project, ProjectStats, VisualItem } from "./projects/data";

type View = "home" | "projects" | "studio" | "cv" | "contact" | "project_view";
type ProjectSection = "concept" | "renders" | "drawings" | "sections" | "plans" | "model3d" | "siteData";
type ProjectViewerState = {
  section: ProjectSection | null;
  renderIndex: number;
  drawingIndex: number;
  sectionIndex: number;
  planIndex: number;
  siteDataIndex: number;
};

const projectSections: Array<{ id: ProjectSection; label: string }> = [
  { id: "concept", label: "CONCEPT" },
  { id: "renders", label: "RENDERS" },
  { id: "drawings", label: "DRAWINGS" },
  { id: "sections", label: "SECTIONS" },
  { id: "plans", label: "PLANS" },
  { id: "model3d", label: "MODELS_3D" },
  { id: "siteData", label: "SITE_DATA" },
];

// Mapping between URL-friendly section slugs and internal section ids
const sectionParamToId: Record<string, ProjectSection> = {
  concept: "concept",
  renders: "renders",
  drawings: "drawings",
  sections: "sections",
  plans: "plans",
  models_3d: "model3d",
  site_data: "siteData",
};

const idToSectionParam: Record<ProjectSection, string> = {
  concept: "concept",
  renders: "renders",
  drawings: "drawings",
  sections: "sections",
  plans: "plans",
  model3d: "models_3d",
  siteData: "site_data",
};

function slugifyProjectName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getProjectSectionOptions(project: Project) {
  return projectSections.filter((section) => {
    switch (section.id) {
      case "concept":
        return project.hasConcept;
      case "renders":
        return project.renders.length > 0;
      case "drawings":
        return project.drawings.length > 0;
      case "sections":
        return project.sections.length > 0;
      case "plans":
        return project.plans.length > 0;
      case "model3d":
        return project.hasModel3d;
      case "siteData":
        return project.siteData.images.length > 0;
      default:
        return false;
    }
  });
}

function clampIndex(value: number, length: number) {
  if (length < 1) {
    return 0;
  }

  return Math.min(Math.max(value, 0), length - 1);
}

function normalizeViewerState(viewerState: ProjectViewerState, project: Project) {
  return {
    section: viewerState.section,
    renderIndex: clampIndex(viewerState.renderIndex, project.renders.length),
    drawingIndex: clampIndex(viewerState.drawingIndex, project.drawings.length),
    sectionIndex: clampIndex(viewerState.sectionIndex, project.sections.length),
    planIndex: clampIndex(viewerState.planIndex, project.plans.length),
    siteDataIndex: clampIndex(viewerState.siteDataIndex, project.siteData.images.length),
  };
}

const viewTransition = {
  duration: 0.65,
  delay: 0.05,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

const viewExitTransition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

const viewMotion = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 12, scale: 0.99, transition: viewExitTransition },
  transition: viewTransition,
};

const MotionMain = motion.main as ComponentType<ComponentProps<"main"> & MotionProps>;
const MotionDiv = motion.div as ComponentType<ComponentProps<"div"> & MotionProps>;

const profileLines = [
  "INITIALIZING_PROFILE...",
  "LOADING_USER_DATA...",
  "ACCESS_GRANTED",
  "",
  "> USER: ERIC_GONZALEZ",
  "",
  "Estudiante de arquitectura radicado en Mérida, Yucatán.",
  "",
  "Enfocado en diseño urbano, visualización arquitectónica,",
  "flujos de trabajo digitales y tecnología aplicada a la arquitectura.",
  "",
  "Módulos personales detectados:",
  "",
  "WAKEBOARD",
  "MMA",
  "PESCA",
  "GIMNASIO",
  "CANTO",
  "",
  "Desarrollando actualmente:",
  "EKYBO_OS",
];

const profileTerminalText = profileLines.join("\n");

const profileMedia = [
  {
    src: "/profile/videos/wakeboard_fail.mp4",
    cue: "WAKEBOARD",
  },
  {
    src: "/profile/videos/mma_fail.mp4",
    cue: "MMA",
  },
  {
    src: "/profile/videos/pesca.mp4",
    cue: "PESCA",
  },
  {
    src: "/profile/videos/gym.mp4",
    cue: "GIMNASIO",
  },
  {
    src: "/profile/videos/bailecito.mp4",
    cue: "CANTO",
  },
  {
    src: "/profile/videos/mojarra.mp4",
    cue: "CANTO",
  },
];

const profileMetadata = [
  ["UBICACIÓN", ["MERIDA_YUCATAN_MX"]],
  ["EDAD", ["20"]],
  ["SEXO", ["MASCULINO"]],
  ["ESTADO", ["ESTUDIANTE_ARQUITECTURA"]],
  ["ENFOQUE", ["DISEÑO_URBANO", "VISUALIZACIÓN_ARQUITECTÓNICA", "FLUJOS_DIGITALES"]],
  ["ACTIVIDADES", ["WAKEBOARD", "MMA", "PESCA", "GIMNASIO", "CANTO"]],
  ["SISTEMA", ["EKYBO_OS"]],
] as const;

const cvBootLines = [
  ["ACCESSING CURRICULUM...", "CURRICULUM ACCESSED"],
  ["LOADING EXPERIENCE...", "EXPERIENCE LOADED"],
  ["VERIFYING PROFILE...", "PROFILE VERIFIED ✓"],
] as const;

const contactBootLines = [
  ["INITIALIZING COMMUNICATION MODULE...", "COMMUNICATION MODULE INITIALIZED"],
  ["ESTABLISHING CONNECTION...", "CONNECTION ESTABLISHED"],
  ["CHANNELS ONLINE ✓", "CHANNELS ONLINE ✓"],
] as const;

const contactNodeInfo = [
  ["USER", "ERIC_GONZALEZ"],
  ["STATUS", "AVAILABLE"],
  ["LOCATION", "MERIDA_YUCATAN_MX"],
  ["CONNECTION", "STABLE"],
  ["LATENCY", "12ms"],
  ["IP", "172.31.26.41"],
] as const;

const communicationChannels = [
  ["PHONE", "9991388717"],
  ["EMAIL", "eric.gonzalez.medina@gmail.com"],
  ["INSTAGRAM", "@ericgm._"],
  ["GITHUB", "github.com/ekybo"],
] as const;

const networkStatus = [
  ["PHONE", "ONLINE"],
  ["EMAIL", "ONLINE"],
  ["INSTAGRAM", "ONLINE"],
  ["GITHUB", "ONLINE"],
  ["DATABASE", "VERIFIED"],
] as const;

const cvSkills = [
  ["VISUALIZACIÓN ARQUITECTÓNICA", 90],
  ["MODELADO 3D", 75],
  ["DIBUJO ARQUITECTÓNICO", 80],
  ["REVIT", 60],
  ["AUTOCAD", 70],
  ["PHOTOSHOP", 60],
  ["MAQUETAS FÍSICAS", 70],
  ["TRABAJO EN EQUIPO", 85],
  ["RESOLUCIÓN DE PROBLEMAS", 80],
] as const;

const competencies = [
  "COMUNICACIÓN EFECTIVA",
  "TRABAJO EN EQUIPO",
  "COLABORACIÓN",
  "INICIATIVA",
  "PARTICIPACIÓN ACTIVA",
  "LIDERAZGO",
  "RESOLUCIÓN DE PROBLEMAS",
];

const architectStats = [
  ["PROYECTOS INDEXADOS", 12],
  ["MODELOS 3D", 47],
  ["RENDERS PRODUCIDOS", 186],
  ["PLANOS / DRAWINGS", 93],
] as const;

function createViewerState(): ProjectViewerState {
  return {
    section: null,
    renderIndex: 0,
    drawingIndex: 0,
    sectionIndex: 0,
    planIndex: 0,
    siteDataIndex: 0,
  };
}

export default function AppClient({
  projects,
  projectStats,
}: {
  projects: Project[];
  projectStats: ProjectStats;
}) {
  const [view, setView] = useState<View>("home");
  const [activeProject, setActiveProject] = useState<Project>(projects[0]);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [viewerStates, setViewerStates] = useState<Record<string, ProjectViewerState>>(() =>
    Object.fromEntries(projects.map((project) => [project.id, createViewerState()]))
  );

  const navigate = useCallback((nextView: Exclude<View, "project_view">) => {
    setView(nextView);
    // update URL query params to reflect navigation
    const params = new URLSearchParams(window.location.search);
    const viewParam = nextView === "studio" ? "profile" : nextView;
    params.set("view", viewParam);
    // clear project/section when leaving projects view
    if (viewParam !== "projects") {
      params.delete("project");
      params.delete("section");
    }
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, []);

  const isApplyingDeepLink = useRef(false);
  const initialParamsRef = useRef<{ view: string | null; project: string | null; section: string | null } | null>(null);
  const initialParamsApplied = useRef(false);

  // Read initial search params once on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    initialParamsRef.current = {
      view: params.get("view"),
      project: params.get("project"),
      section: params.get("section"),
    };
  }, []);

  function updateUrlForState(viewName: View, project?: Project, section?: ProjectSection | null) {
    const params = new URLSearchParams();
    const viewParam = viewName === "studio" ? "profile" : viewName;
    params.set("view", viewParam);

    // Only include project/section when view is projects
    if (viewParam === "projects") {
      if (project) {
        params.set("project", slugifyProjectName(project.name));
      }

      if (section) {
        params.set("section", idToSectionParam[section]);
      }
    }

    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }

  const accessProjectIndex = useCallback(() => {
    navigate("projects");
  }, [navigate]);

  const updateViewerState = useCallback((projectId: string, nextState: ProjectViewerState) => {
    setViewerStates((current) => ({
      ...current,
      [projectId]: nextState,
    }));
  }, []);

  const handleProjectClick = useCallback((project: Project) => {
    const currentState = viewerStates[project.id] ?? createViewerState();

    setActiveProject(project);

    if (expandedProjectId === project.id) {
      setExpandedProjectId(null);
      updateViewerState(project.id, { ...currentState, section: null });
      return;
    }

    setExpandedProjectId(project.id);
    updateViewerState(project.id, { ...currentState, section: null });
  }, [expandedProjectId, updateViewerState, viewerStates]);

  // After boot screen disappears, apply initial params captured at mount
  useEffect(() => {
    let cancelled = false;

    const applyInitialParams = () => {
      if (initialParamsApplied.current) return;
      initialParamsApplied.current = true;

      const initial = initialParamsRef.current;
      const viewParam = initial?.view ?? null;
      const projectParam = initial?.project ?? null;
      const sectionParam = initial?.section ?? null;

      const hasSections = (p: Project) => getProjectSectionOptions(p).length > 0;

      if (viewParam === "projects") {
        // find project by slug
        const projectBySlug = projectParam
          ? projects.find((p) => slugifyProjectName(p.name) === projectParam)
          : null;

        let targetProject = projectBySlug ?? projects[0];

        // If requested project exists but has no available sections, fallback to first project that has sections
        if (projectBySlug && !hasSections(projectBySlug)) {
          const alt = projects.find((p) => hasSections(p));
          if (alt) targetProject = alt;
        }

        // determine section id per rules: prefer requested, else concept, else first available
        let targetSection: ProjectSection | null = null;
        if (sectionParam) {
          const mapped = sectionParam in sectionParamToId ? sectionParamToId[sectionParam as string] : undefined;
          if (mapped && getProjectSectionOptions(targetProject).map((s) => s.id).includes(mapped)) {
            targetSection = mapped;
          }
        }

        if (!targetSection) {
          const options = getProjectSectionOptions(targetProject).map((s) => s.id);
          if (options.includes("concept")) targetSection = "concept" as ProjectSection;
          else targetSection = options[0] ?? null;
        }

        // apply
        isApplyingDeepLink.current = true;
        setView("projects");
        setActiveProject(targetProject);
        setExpandedProjectId(targetProject.id);

        setViewerStates((current) => ({
          ...current,
          [targetProject.id]: normalizeViewerState({ ...current[targetProject.id], section: targetSection }, targetProject),
        }));

        updateUrlForState("projects", targetProject, targetSection);
        isApplyingDeepLink.current = false;
        return;
      }

      // map studio/profile
      if (viewParam === "studio" || viewParam === "profile") {
        setView("studio");
        updateUrlForState("studio");
        return;
      }

      if (viewParam === "cv") {
        setView("cv");
        updateUrlForState("cv");
        return;
      }

      if (viewParam === "contact") {
        setView("contact");
        updateUrlForState("contact");
        return;
      }

      // default to home and clear project/section
      setView("home");
      updateUrlForState("home");
    };

    // wait for boot-screen removal by polling DOM (BootScreen removes itself after ~7s)
    const interval = window.setInterval(() => {
      const bootEl = document.querySelector(".boot-screen");
      if (!bootEl) {
        window.clearInterval(interval);
        if (!cancelled) applyInitialParams();
      }
    }, 200);

    const timeout = window.setTimeout(() => {
      // timeout fallback after 8s
      window.clearInterval(interval);
      if (!cancelled) applyInitialParams();
    }, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [projects, setViewerStates]);

  useEffect(() => {
    const currentState = viewerStates[activeProject.id] ?? createViewerState();
    const availableSections = getProjectSectionOptions(activeProject).map((section) => section.id);

    if (currentState.section && !availableSections.includes(currentState.section)) {
      updateViewerState(activeProject.id, {
        ...normalizeViewerState(currentState, activeProject),
        section: availableSections[0] ?? null,
      });
    } else {
      const normalizedState = normalizeViewerState(currentState, activeProject);
      if (JSON.stringify(normalizedState) !== JSON.stringify(currentState)) {
        updateViewerState(activeProject.id, normalizedState);
      }
    }
  }, [activeProject, viewerStates, updateViewerState]);

  // Keep URL in sync when user navigates manually (ignore while applying deep link)
  useEffect(() => {
    if (!initialParamsApplied.current) {
      return;
    }

    if (isApplyingDeepLink.current) {
      // allow one render to settle then stop ignoring
      const t = window.setTimeout(() => {
        isApplyingDeepLink.current = false;
      }, 250);

      return () => window.clearTimeout(t);
    }

    const currentViewer = viewerStates[activeProject.id] ?? createViewerState();
    updateUrlForState(view, activeProject, currentViewer.section);
  }, [view, activeProject, viewerStates]);

  return (
    <>
      <TopBar view={view} projectStats={projectStats} />
      <Sidebar activeView={view} onNavigate={navigate} />

      <AnimatePresence mode="wait" initial={false}>
        {view === "projects" && (
          <ProjectsView
            key="projects"
            projects={projects}
            activeProject={activeProject}
            expandedProjectId={expandedProjectId}
            viewerState={viewerStates[activeProject.id] ?? createViewerState()}
            onProjectClick={handleProjectClick}
            onViewerStateChange={(nextState) => updateViewerState(activeProject.id, nextState)}
          />
        )}

        {view === "project_view" && <ProjectViewPlaceholder key="project_view" />}

        {view === "home" && (
          <HomeView
            key="home"
            projects={projects}
            onEnterDatabase={accessProjectIndex}
          />
        )}

        {view === "studio" && <ProfileView key="profile" />}

        {view === "cv" && <CvView key="cv" />}

        {view === "contact" && (
          <ContactView key={view} />
        )}
      </AnimatePresence>
    </>
  );
}

function HomeView({
  projects,
  onEnterDatabase,
}: {
  projects: Project[];
  onEnterDatabase: () => void;
}) {
  const heroProjects = useMemo(() => projects.filter((project) => project.image), [projects]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  useEffect(() => {
    if (heroProjects.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % heroProjects.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [activeHeroIndex, heroProjects.length]);

  const activeHeroProject = heroProjects[activeHeroIndex] ?? projects[0];

  return (
    <MotionMain {...viewMotion} className="home-shell" id="home">
      <section className="home-hero" aria-label="EKYBO_OS home">
        <AnimatePresence initial={false}>
          <MotionDiv
            key={activeHeroProject?.id ?? "home-fallback"}
            className="home-render"
            style={{ backgroundImage: `url(${activeHeroProject?.image ?? "/ekybo-home-hero.png"})` }}
            initial={{ opacity: 0, scale: 1.015, filter: "blur(3px) saturate(0.82) contrast(0.96) brightness(0.78)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px) saturate(0.82) contrast(0.96) brightness(0.78)" }}
            exit={{ opacity: 0, scale: 1, filter: "blur(3px) saturate(0.82) contrast(0.96) brightness(0.78)" }}
            transition={{
              duration: 2.2,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </AnimatePresence>
        <div className="home-render-shade" />

        <aside className="home-panel home-panel-studio" aria-label="Studio identity">
          <div className="home-panel-kicker">[ EKYBO_ARCHITECTS ]</div>
          <div className="home-panel-title">ERIC_GONZALEZ</div>
          <div className="home-panel-meta">ARQUITECTURA / DISEÑO_URBANO</div>
        </aside>

        <aside className="home-panel home-panel-project" aria-label="Active project">
          <div className="home-panel-kicker">[ ACTIVE_PROJECT ]</div>
          <AnimatePresence mode="wait" initial={false}>
            <MotionDiv
              key={activeHeroProject?.id ?? "home-project-fallback"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 1.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="home-panel-title">{activeHeroProject?.name ?? "EKYBO_OS"}</div>
              <div className="home-panel-meta">TIPO: {activeHeroProject?.type ?? "UNCLASSIFIED"}</div>
              <div className="home-panel-meta">AÑO: {activeHeroProject?.year ?? "TBD"}</div>
              <div className="home-panel-meta">ESTADO: {activeHeroProject?.status ?? "INDEXED"}</div>
            </MotionDiv>
          </AnimatePresence>
        </aside>

        <button
          type="button"
          className="home-command"
          onClick={onEnterDatabase}
          aria-label="Access project index"
        >
          &gt; ENTER_DATABASE
        </button>
      </section>
    </MotionMain>
  );
}

function ProfileView() {
  const [typedLength, setTypedLength] = useState(0);
  const [missingMedia, setMissingMedia] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTypedLength((current) => {
        if (current >= profileTerminalText.length) {
          window.clearInterval(timer);
          return current;
        }

        return current + 1;
      });
    }, 28);

    return () => window.clearInterval(timer);
  }, []);

  const typedText = profileTerminalText.slice(0, typedLength);
  const visibleMediaCount = profileMedia.filter((item, index) => {
    const cueIndex = profileTerminalText.indexOf(item.cue);
    const fallbackThreshold = Math.floor((profileTerminalText.length / profileMedia.length) * (index + 1));

    return typedLength >= (cueIndex > -1 ? cueIndex : fallbackThreshold);
  }).length;

  return (
    <MotionMain {...viewMotion} className="profile-shell" id="profile">
      <section className="profile-frame" aria-label="EKYBO_OS profile">
        <div className="profile-terminal-panel" aria-label="Profile terminal">
          <div className="profile-panel-heading">[ PROFILE ]</div>
          <pre className="profile-terminal-text">
            {typedText}
            <span className="profile-cursor">_</span>
          </pre>
        </div>

        <aside className="profile-media-panel" aria-label="Activity media">
          <div className="profile-panel-heading">[ ACTIVITY_MEDIA ]</div>
          <div className="profile-media-stack">
            <AnimatePresence initial={false}>
              {profileMedia.slice(0, visibleMediaCount).map((item, index) => {
                const isMissing = missingMedia[item.src];

                return (
                  <MotionDiv
                    key={item.src}
                    className="profile-media-attachment"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="profile-media-viewport">
                      {isMissing ? (
                        <div className="profile-media-placeholder">NO_MEDIA_FOUND</div>
                      ) : (
                        <video
                          src={item.src}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="auto"
                          onError={() => {
                            setMissingMedia((current) => ({
                              ...current,
                              [item.src]: true,
                            }));
                          }}
                        />
                      )}
                    </div>
                    <div className="profile-media-caption">{getFileName(item.src)}</div>
                  </MotionDiv>
                );
              })}
            </AnimatePresence>
          </div>
        </aside>

        <aside className="profile-metadata-panel" aria-label="User metadata">
          <div className="profile-panel-heading">[ USER_METADATA ]</div>
          <div className="profile-metadata-stack">
            {profileMetadata.map(([label, values]) => (
              <div key={label} className="profile-metadata-group">
                <div className="profile-metadata-label">{label}:</div>
                {values.map((value) => (
                  <div key={value} className="profile-metadata-value">{value}</div>
                ))}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </MotionMain>
  );
}

function CvView() {
  const [bootStep, setBootStep] = useState(0);
  const [profileImageStatus, setProfileImageStatus] = useState<"scanning" | "verified" | "missing">("scanning");

  useEffect(() => {
    if (bootStep >= cvBootLines.length) {
      return;
    }

    const timer = window.setTimeout(() => {
      setBootStep((current) => current + 1);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [bootStep]);

  const identityPanelReady = bootStep >= 1;
  const experiencePanelReady = bootStep >= 2;
  const skillsPanelsReady = bootStep >= 3;

  return (
    <MotionMain {...viewMotion} className="cv-shell" id="cv">
      <section className="cv-frame" aria-label="EKYBO_OS CV">
        <div className="cv-boot-strip" aria-label="Curriculum access status">
          {cvBootLines.map((line, index) => (
            <span
              key={line[0]}
              className={index < bootStep ? "cv-boot-line cv-boot-line-complete" : "cv-boot-line"}
            >
              {index < bootStep ? line[1] : line[0]}
            </span>
          ))}
        </div>

        <AnimatePresence>
          {identityPanelReady && (
            <MotionDiv
              className="cv-grid"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              <AnimatePresence mode="popLayout">
                {identityPanelReady && (
                  <MotionDiv
                    key="identity"
                    className="cv-panel cv-identity-panel"
                    initial={{ opacity: 0, y: 16, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.985 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="cv-panel-heading">[ IDENTITY_PROFILE ]</div>
                    <div className="cv-profile-image-block" aria-label="Profile image">
                  <div className="cv-panel-heading">[ PROFILE_IMAGE ]</div>
                  <div className="cv-profile-image-frame">
                    {profileImageStatus !== "missing" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/profile/avatar/profile.jpg"
                        alt="ERIC ALEJANDRO GONZALEZ MEDINA"
                        onLoad={() => setProfileImageStatus("verified")}
                        onError={() => setProfileImageStatus("missing")}
                      />
                    )}
                    {profileImageStatus === "missing" && (
                      <div className="cv-profile-image-placeholder">
                        <div>[ NO_PROFILE_IMAGE ]</div>
                        <div>USER_IMAGE_NOT_FOUND</div>
                        <div>SILHOUETTE_PLACEHOLDER</div>
                      </div>
                    )}
                  </div>
                  <div className="cv-profile-image-scan">
                    <div>SCANNING PROFILE IMAGE...</div>
                    {profileImageStatus === "verified" && <div>IMAGE VERIFIED</div>}
                    {profileImageStatus === "missing" && (
                      <>
                        <div>IMAGE NOT FOUND</div>
                        <div>LOAD PLACEHOLDER</div>
                      </>
                    )}
                  </div>
                </div>
                <div className="cv-identity-name">ERIC ALEJANDRO GONZALEZ MEDINA</div>
                <div className="cv-identity-role">ESTUDIANTE DE ARQUITECTURA</div>
                <div className="cv-identity-role">PASANTE</div>

                <CvField label="EDAD" values={["20"]} />
                <CvField label="UBICACIÓN" values={["MÉRIDA, YUCATÁN"]} />
                <CvField label="UNIVERSIDAD" values={["UNIVERSIDAD MARISTA DE MÉRIDA"]} />
                <CvField label="SEMESTRE" values={["6TO SEMESTRE"]} />
                    <CvField label="PERIODO" values={["2023 - ACTUAL"]} />
                  </MotionDiv>
                )}
              </AnimatePresence>

              <AnimatePresence mode="popLayout">
                {experiencePanelReady && (
                  <MotionDiv
                    key="experience"
                    className="cv-panel cv-experience-panel"
                    initial={{ opacity: 0, y: 16, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.985 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                <div className="cv-terminal-sequence">
                  {cvBootLines.map((line) => (
                    <div key={line[1]}>{line[1]}</div>
                  ))}
                </div>
                <div className="cv-terminal-command">Experiencia:</div>

                <CvExperience
                  title="COLABORADOR OPERATIVO"
                  subtitle="CADENA DE ALIMENTOS"
                  items={[
                    "Atención directa al cliente",
                    "Manejo de efectivo",
                    "Coordinación con equipo de trabajo",
                    "Cocina y servicio",
                    "Adaptación a entornos dinámicos",
                  ]}
                />

                <CvExperience
                  title="GRUPO LAPA / INMOBILIARIA"
                  subtitle=""
                  items={[
                    "Asistente de renderización arquitectónica",
                    "Cuantificación por Revit",
                    "Cuantificación por Excel",
                    "Postproducción en Photoshop",
                    "Modelado 3D en Revit",
                  ]}
                />
              </MotionDiv>
              )}
            </AnimatePresence>

              <aside className="cv-panel cv-skill-panel">
                <div className="cv-panel-heading">[ SKILL_MATRIX ]</div>
                {cvSkills.map(([label, value], index) => (
                  <CvSkillBar key={label} label={label} value={value} delay={index * 120} />
                ))}
              </aside>

              <section className="cv-panel cv-stats-panel">
                <div className="cv-panel-heading">[ ARCHITECT_STATS ]</div>
                <div className="cv-stat-stack">
                  {architectStats.map(([label, value], index) => (
                    <CvStatCounter key={label} label={label} value={value} delay={index * 140} />
                  ))}
                </div>
              </section>

              <section className="cv-panel cv-language-panel">
                <div className="cv-panel-heading">[ LANGUAGES ]</div>
                <div className="cv-record-line">INGLÉS</div>
                <div className="cv-record-line">CAMBRIDGE B2</div>
                <CvField label="STATUS" values={["CERTIFICADO"]} />
              </section>

              <section className="cv-panel cv-competencies-panel">
                <div className="cv-panel-heading">[ PERSONAL_COMPETENCIES ]</div>
                <div className="cv-competency-list">
                  {competencies.map((competency) => (
                    <div key={competency}>{competency}</div>
                  ))}
                </div>
              </section>

              <section className="cv-panel cv-education-panel">
                <div className="cv-panel-heading">[ EDUCATION_RECORD ]</div>
                <div className="cv-record-line">Universidad Marista de Mérida</div>
                <div className="cv-record-line">Licenciatura en Arquitectura</div>
                <div className="cv-record-line">6to semestre</div>
                <div className="cv-record-line">2023 - Actual</div>
              </section>
            </MotionDiv>
          )}
        </AnimatePresence>
      </section>
    </MotionMain>
  );
}

function ContactView() {
  const [bootStep, setBootStep] = useState(0);

  useEffect(() => {
    if (bootStep >= contactBootLines.length) {
      return;
    }

    const timer = window.setTimeout(() => {
      setBootStep((current) => current + 1);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [bootStep]);

  const contactPanelReady = bootStep >= 1;

  return (
    <MotionMain {...viewMotion} className="contact-shell" id="contact">
      <section className="contact-frame" aria-label="EKYBO_OS CONTACT">
        <div className="contact-boot-strip" aria-label="Contact module status">
          {contactBootLines.map((line, index) => (
            <span
              key={line[0]}
              className={index < bootStep ? "contact-boot-line contact-boot-line-complete" : "contact-boot-line"}
            >
              {index < bootStep ? line[1] : line[0]}
            </span>
          ))}
        </div>

        <AnimatePresence>
          {contactPanelReady && (
            <MotionDiv
              className="contact-grid"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              <section className="contact-panel contact-node-panel">
                <div className="contact-panel-heading">[ CONTACT_NODE ]</div>
                {contactNodeInfo.map(([label, value]) => (
                  <div key={label} className="contact-info-row">
                    <span className="contact-info-label">{label}:</span>
                    <span className="contact-info-value">{value}</span>
                  </div>
                ))}
              </section>

              <aside className="contact-panel contact-communication-panel">
                <div className="contact-panel-heading">[ COMMUNICATION_CHANNELS ]</div>
                <div className="contact-channels-list">
                  {communicationChannels.map(([label, value]) => (
                    <div key={label} className="contact-channel-item">
                      <div className="contact-channel-label">{label}</div>
                      <div className="contact-channel-value">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="contact-status-section">
                  <div className="contact-panel-heading">[ NETWORK_STATUS ]</div>
                  <div className="contact-status-list">
                    {networkStatus.map(([label, status]) => (
                      <div key={label} className="contact-status-item">
                        <span className="contact-status-label">{label}</span>
                        <span className="contact-status-dots">{'.'}</span>
                        <span className="contact-status-value">{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </MotionDiv>
          )}
        </AnimatePresence>
      </section>
    </MotionMain>
  );
}

function CvField({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="cv-field">
      <div className="cv-field-label">{label}:</div>
      {values.map((value) => (
        <div key={value} className="cv-field-value">{value}</div>
      ))}
    </div>
  );
}

function CvExperience({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: string[];
}) {
  return (
    <article className="cv-experience-entry">
      <div className="cv-experience-title">{title}</div>
      <div className="cv-experience-subtitle">{subtitle}</div>
      <ul className="cv-experience-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function useAnimatedNumber(target: number, duration: number, delay = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    let start = 0;
    let delayTimer = 0;

    const animate = (timestamp: number) => {
      if (!start) {
        start = timestamp;
      }

      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));

      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    delayTimer = window.setTimeout(() => {
      frame = window.requestAnimationFrame(animate);
    }, delay);

    return () => {
      window.clearTimeout(delayTimer);
      window.cancelAnimationFrame(frame);
    };
  }, [delay, duration, target]);

  return value;
}

function useRenderCounter(delay: number) {
  const [value, setValue] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    let frame = 0;
    let start = 0;
    const timers: number[] = [];

    const animate = (timestamp: number) => {
      if (!start) {
        start = timestamp;
      }

      const progress = Math.min((timestamp - start) / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(186 * eased));

      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
        return;
      }

      [187, 188, 189, 190].forEach((nextValue, index) => {
        timers.push(window.setTimeout(() => setValue(nextValue), 160 * (index + 1)));
      });
      timers.push(window.setTimeout(() => setError(true), 900));
      timers.push(window.setTimeout(() => {
        setError(false);
        setValue(186);
      }, 1900));
    };

    timers.push(window.setTimeout(() => {
      frame = window.requestAnimationFrame(animate);
    }, delay));

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.cancelAnimationFrame(frame);
    };
  }, [delay]);

  return { value, error };
}

function CvSkillBar({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: number;
}) {
  const animatedValue = useAnimatedNumber(value, 1400 + delay * 0.7, delay);

  return (
    <div className="cv-skill-row">
      <div className="cv-skill-row-header">
        <span>{label}</span>
        <span>{animatedValue}%</span>
      </div>
      <div className="cv-skill-track" aria-hidden="true">
        <div className="cv-skill-fill" style={{ width: `${animatedValue}%` }} />
      </div>
    </div>
  );
}

function CvStatCounter({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: number;
}) {
  const isRenderStat = label === "RENDERS PRODUCIDOS";
  const normalValue = useAnimatedNumber(value, 1200, delay);
  const renderCounter = useRenderCounter(delay);
  const currentValue = isRenderStat ? renderCounter.value : normalValue;

  return (
    <div className="cv-stat-row">
      <div className="cv-stat-label">{label}</div>
      <div className={renderCounter.error && isRenderStat ? "cv-stat-value cv-stat-value-error" : "cv-stat-value"}>
        {currentValue}
      </div>
      {renderCounter.error && isRenderStat && (
        <div className="cv-render-error">
          <div>RENDER_COUNT_OVERFLOW</div>
          <div>LIMIT EXCEEDED</div>
          <div>TOO_MANY_RENDERS_PRODUCED</div>
        </div>
      )}
    </div>
  );
}

function ProjectsView({
  projects,
  activeProject,
  expandedProjectId,
  viewerState,
  onProjectClick,
  onViewerStateChange,
}: {
  projects: Project[];
  activeProject: Project;
  expandedProjectId: string | null;
  viewerState: ProjectViewerState;
  onProjectClick: (project: Project) => void;
  onViewerStateChange: (state: ProjectViewerState) => void;
}) {
  return (
    <MotionMain {...viewMotion} className="project-shell" id="projects">
      <ProjectIndex
        projects={projects}
        activeProject={activeProject}
        expandedProjectId={expandedProjectId}
        viewerState={viewerState}
        onProjectClick={onProjectClick}
        onViewerStateChange={onViewerStateChange}
      />
    </MotionMain>
  );
}

function ProjectIndex({
  projects,
  activeProject,
  expandedProjectId,
  viewerState,
  onProjectClick,
  onViewerStateChange,
}: {
  projects: Project[];
  activeProject: Project;
  expandedProjectId: string | null;
  viewerState: ProjectViewerState;
  onProjectClick: (project: Project) => void;
  onViewerStateChange: (state: ProjectViewerState) => void;
}) {
  const setSection = (section: ProjectSection) => {
    onViewerStateChange(normalizeViewerState({ ...viewerState, section }, activeProject));
  };

  const cycleIndex = (key: "renderIndex" | "drawingIndex" | "sectionIndex" | "planIndex" | "siteDataIndex", length: number, direction: 1 | -1) => {
    if (length < 1) {
      return;
    }

    onViewerStateChange({
      ...viewerState,
      [key]: (viewerState[key] + direction + length) % length,
    });
  };

  return (
    <section className={viewerState.section ? "project-index project-index-section-active" : "project-index"} aria-label="Project database">
      <aside className="project-panel project-database" aria-label="Project database">
        <div className="project-panel-heading">[ PROJECT_DATABASE ]</div>
        <div className="project-records">
          {projects.map((project) => {
            const isActive = project.id === activeProject.id;
            const isExpanded = expandedProjectId === project.id;

            return (
              <div key={project.id} className="project-record-group">
                <button
                  type="button"
                  className={isActive ? "project-record project-record-active" : "project-record"}
                  onClick={() => onProjectClick(project)}
                >
                  <span>{project.code}</span>
                  <span>{project.name}</span>
                  <span>{project.type.replace(" / PUBLIC_SPACE", "")} / {project.year}</span>
                </button>

                {isExpanded && (
                  <div className="project-section-nav" aria-label={`${project.name} sections`}>
                    {getProjectSectionOptions(project).map((section) => {
                      const sectionActive = viewerState.section === section.id;

                      return (
                        <button
                          key={section.id}
                          type="button"
                          className={sectionActive ? "project-section-link project-section-link-active" : "project-section-link"}
                          onClick={() => setSection(section.id)}
                        >
                          [ {section.label} ]
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <ProjectViewer
        project={activeProject}
        viewerState={viewerState}
        onCycle={cycleIndex}
      />

      <aside className="project-panel project-metadata" aria-label="Project metadata">
        <ProjectMetadata project={activeProject} viewerState={viewerState} />
      </aside>
    </section>
  );
}

function ProjectViewer({
  project,
  viewerState,
  onCycle,
}: {
  project: Project;
  viewerState: ProjectViewerState;
  onCycle: (key: "renderIndex" | "drawingIndex" | "sectionIndex" | "planIndex" | "siteDataIndex", length: number, direction: 1 | -1) => void;
}) {
  if (!viewerState.section) {
    return (
      <div className="project-viewer">
        <div className="project-viewer-visual" style={{ backgroundImage: `url(${project.image})` }} />
      </div>
    );
  }

  if (viewerState.section === "concept") {
    return (
      <div className="project-viewer">
        <div className="project-viewer-visual" style={{ backgroundImage: `url(${project.concept.image})` }} />
        <div className="project-viewer-bubble project-concept-bubble">
          <div className="project-viewer-counter">[ CONCEPT ]</div>
          <h2>{project.concept.title}</h2>
          <p>{project.concept.text}</p>
        </div>
      </div>
    );
  }

  if (viewerState.section === "renders") {
    const item = project.renders[viewerState.renderIndex];
    if (!item) {
      return <EmptyViewer label="NO_RENDERS_FOUND" />;
    }

    return (
      <CarouselViewer
        item={item}
        variant="render"
        counter={`RENDER ${formatCount(viewerState.renderIndex + 1)} / ${formatCount(project.renders.length)}`}
        prevLabel="PREV_RENDER"
        nextLabel="NEXT_RENDER"
        onPrev={() => onCycle("renderIndex", project.renders.length, -1)}
        onNext={() => onCycle("renderIndex", project.renders.length, 1)}
      />
    );
  }

  if (viewerState.section === "drawings") {
    const item = project.drawings[viewerState.drawingIndex];
    if (!item) {
      return <EmptyViewer label="NO_DRAWINGS_FOUND" />;
    }

    return (
      <CarouselViewer
        item={item}
        variant="technical"
        counter={`DRAWING ${formatCount(viewerState.drawingIndex + 1)} / ${formatCount(project.drawings.length)}`}
        prevLabel="PREV_DRAWING"
        nextLabel="NEXT_DRAWING"
        onPrev={() => onCycle("drawingIndex", project.drawings.length, -1)}
        onNext={() => onCycle("drawingIndex", project.drawings.length, 1)}
      />
    );
  }

  if (viewerState.section === "sections") {
    const item = project.sections[viewerState.sectionIndex];
    if (!item) {
      return <EmptyViewer label="NO_SECTIONS_FOUND" />;
    }

    return (
      <CarouselViewer
        item={item}
        variant="technical"
        counter={`SECTION ${formatCount(viewerState.sectionIndex + 1)} / ${formatCount(project.sections.length)}`}
        prevLabel="PREV_SECTION"
        nextLabel="NEXT_SECTION"
        onPrev={() => onCycle("sectionIndex", project.sections.length, -1)}
        onNext={() => onCycle("sectionIndex", project.sections.length, 1)}
      />
    );
  }

  if (viewerState.section === "plans") {
    const item = project.plans[viewerState.planIndex];
    if (!item) {
      return <EmptyViewer label="NO_PLANS_FOUND" />;
    }

    return (
      <CarouselViewer
        item={item}
        variant="technical"
        counter={`PLAN ${formatCount(viewerState.planIndex + 1)} / ${formatCount(project.plans.length)}`}
        prevLabel="PREV_PLAN"
        nextLabel="NEXT_PLAN"
        onPrev={() => onCycle("planIndex", project.plans.length, -1)}
        onNext={() => onCycle("planIndex", project.plans.length, 1)}
      />
    );
  }

  if (viewerState.section === "model3d") {
    // Use the project's folder (exact name) inside public/PROJECTS to locate models
    const modelFile = (project.model3d.model?.trim() || `${project.id}.glb`).toLowerCase();
    const projectFolder = project.name; // original folder name stored as project.name
    const modelPath = `/PROJECTS/${encodeURIComponent(projectFolder)}/models/${encodeURIComponent(modelFile)}`;

    return (
      <div className="project-viewer">
        <div className="project-viewer-visual">
          <HologramModel modelPath={modelPath} modelLabel={project.name} />
        </div>
      </div>
    );
  }

  const item = project.siteData.images[viewerState.siteDataIndex];
  if (!item) {
    return <EmptyViewer label="NO_SITE_DATA_FOUND" />;
  }

  return (
    <CarouselViewer
      item={item}
      variant="siteData"
      counter={`SITE_DATA ${formatCount(viewerState.siteDataIndex + 1)} / ${formatCount(project.siteData.images.length)}`}
      prevLabel="PREV_SITE_DATA"
      nextLabel="NEXT_SITE_DATA"
      onPrev={() => onCycle("siteDataIndex", project.siteData.images.length, -1)}
      onNext={() => onCycle("siteDataIndex", project.siteData.images.length, 1)}
      showControls={project.siteData.images.length > 1}
    />
  );
}

function EmptyViewer({ label }: { label: string }) {
  return (
    <div className="project-viewer project-viewer-standby">
      <div className="viewer-standby-box">
        <div>[ {label} ]</div>
        <div>AGREGA ARCHIVOS A PUBLIC/PROJECTS</div>
      </div>
    </div>
  );
}

function CarouselViewer({
  item,
  variant,
  counter,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
  showControls = true,
}: {
  item: VisualItem;
  variant: "render" | "technical" | "siteData";
  counter: string;
  prevLabel: string;
  nextLabel: string;
  onPrev: () => void;
  onNext: () => void;
  showControls?: boolean;
}) {
  const viewerClassName = variant === "technical" ? "project-viewer project-viewer-technical" : "project-viewer";
  const isPdf = item.image.toLowerCase().endsWith(".pdf");

  return (
    <div className={viewerClassName}>
      {variant === "technical" ? (
        <div className="project-viewer-visual project-viewer-technical-visual">
          {isPdf ? (
            <object className="project-pdf-viewer" data={item.image} type="application/pdf" width="100%" height="100%">
              <div className="pdf-fallback">
                <p>PDF NO SOPORTADO</p>
                <a href={item.image} target="_blank" rel="noreferrer">ABRIR PDF</a>
              </div>
            </object>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="project-technical-image" src={item.image} alt={item.title} />
          )}
        </div>
      ) : variant === "siteData" ? (
        <div className="project-viewer-visual project-viewer-site-data-visual">
          {isPdf ? (
            <object className="project-pdf-viewer" data={item.image} type="application/pdf" width="100%" height="100%">
              <div className="pdf-fallback">
                <p>PDF NO SOPORTADO</p>
                <a href={item.image} target="_blank" rel="noreferrer">ABRIR PDF</a>
              </div>
            </object>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="project-site-data-image" src={item.image} alt={item.title} />
          )}
        </div>
      ) : (
        <div className="project-viewer-visual" style={{ backgroundImage: `url(${item.image})` }} />
      )}
      <div className="project-viewer-footer">
        <div>
          <div className="project-viewer-counter">{counter}</div>
          <div className="project-viewer-title">{item.title}</div>
        </div>
        {showControls && (
          <div className="viewer-controls">
            <button type="button" onClick={onPrev}>[ {prevLabel} ]</button>
            <button type="button" onClick={onNext}>[ {nextLabel} ]</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectMetadata({
  project,
  viewerState,
}: {
  project: Project;
  viewerState: ProjectViewerState;
}) {
  if (!viewerState.section) {
    return (
      <>
        <div className="project-panel-heading">[ PROJECT_METADATA ]</div>
        <div className="project-meta-stack">
          <div>TIPO: {project.type}</div>
          <div>AÑO: {project.year}</div>
          <div>ESTADO: {project.status}</div>
          <div>UBICACIÓN: {project.location}</div>
        </div>

        <div className="project-assets">
          <div>ARCHIVOS:</div>
          {project.assets.map((asset) => (
            <div key={asset}>{asset}</div>
          ))}
        </div>
      </>
    );
  }

  if (viewerState.section === "concept") {
    return (
      <>
        <div className="project-panel-heading">[ CONCEPT_METADATA ]</div>
        <div className="project-meta-stack">
          <div>PALABRAS CLAVE:</div>
          {project.concept.keywords.map((keyword) => (
            <div key={keyword}>{keyword}</div>
          ))}
        </div>
      </>
    );
  }

  if (viewerState.section === "renders") {
    const item = project.renders[viewerState.renderIndex];
    if (!item) {
      return <VisualMetadata heading="RENDER_METADATA" rows={[["ESTADO", "SIN_ARCHIVOS"]]} />;
    }

    return (
      <VisualMetadata heading="RENDER_METADATA" rows={[
        ["ARCHIVO", item.file],
        ["TIPO", item.type],
        ["ESTADO", item.status || "FINAL"],
        ["RESOLUCIÓN", item.resolution || "4K"],
      ]} />
    );
  }

  if (viewerState.section === "drawings") {
    const item = project.drawings[viewerState.drawingIndex];
    if (!item) {
      return <VisualMetadata heading="DRAWING_METADATA" rows={[["ESTADO", "SIN_ARCHIVOS"]]} />;
    }

    return (
      <VisualMetadata heading="DRAWING_METADATA" rows={[
        ["ARCHIVO", item.file],
        ["TIPO", item.type],
        ["ESCALA", item.scale || "1:500"],
        ["FORMATO", item.format || "PDF"],
      ]} />
    );
  }

  if (viewerState.section === "sections") {
    const item = project.sections[viewerState.sectionIndex];
    if (!item) {
      return <VisualMetadata heading="SECTION_METADATA" rows={[["ESTADO", "SIN_ARCHIVOS"]]} />;
    }

    return (
      <VisualMetadata heading="SECTION_METADATA" rows={[
        ["ARCHIVO", item.file],
        ["TIPO", item.type],
        ["ESCALA", item.scale || "1:200"],
      ]} />
    );
  }

  if (viewerState.section === "plans") {
    const item = project.plans[viewerState.planIndex];
    if (!item) {
      return <VisualMetadata heading="PLAN_METADATA" rows={[["ESTADO", "SIN_ARCHIVOS"]]} />;
    }

    return (
      <VisualMetadata heading="PLAN_METADATA" rows={[
        ["ARCHIVO", item.file],
        ["TIPO", item.type],
        ["ESCALA", item.scale || "1:200"],
      ]} />
    );
  }

  if (viewerState.section === "model3d") {
    return (
      <VisualMetadata heading="MODEL_3D_METADATA" rows={[
        ["MODELO", project.model3d.model],
        ["ESTADO", project.model3d.status],
      ]} />
    );
  }

  return (
    <VisualMetadata heading="SITE_DATA" rows={[
      ["UBICACIÓN", project.siteData.location],
      ["COORDENADAS", project.siteData.coordinates],
      ["ÁREA DEL PREDIO", project.siteData.siteArea],
      ["CONTEXTO URBANO", project.siteData.urbanContext],
      ["ACCESIBILIDAD", project.siteData.accessibility],
      ["USO DE SUELO", project.siteData.landUse],
    ]} />
  );
}

function VisualMetadata({ heading, rows }: { heading: string; rows: Array<[string, string]> }) {
  return (
    <>
      <div className="project-panel-heading">[ {heading} ]</div>
      <div className="project-meta-stack">
        {rows.map(([label, value]) => (
          <div key={label} className="metadata-row">
            <span>{label}:</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function formatCount(value: number) {
  return value.toString().padStart(2, "0");
}

function getFileName(src: string) {
  return src.split("/").pop() ?? src;
}

function ProjectViewPlaceholder() {
  return (
    <MotionMain {...viewMotion} className="project-shell">
      <section className="project-view-placeholder" aria-label="Project view placeholder">
        <div className="project-view-panel">
          <div className="project-panel-heading">[ PROJECT_VIEW ]</div>
          <div className="project-view-tabs">
            OVERVIEW / RENDERS / DRAWINGS / MODEL_3D / SITE_DATA / PROJECT_INFO
          </div>
        </div>
      </section>
    </MotionMain>
  );
}

function SectionPlaceholder({ view }: { view: "contact" }) {
  return (
    <MotionMain {...viewMotion} className="project-shell">
      <section className="project-view-placeholder" aria-label={`${view} placeholder`}>
        <div className="project-view-panel">
          <div className="project-panel-heading">[ {view.toUpperCase()} ]</div>
          <div className="project-view-tabs">MODULE_PENDING</div>
        </div>
      </section>
    </MotionMain>
  );
}

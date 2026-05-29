import fs from "node:fs";
import path from "node:path";

export type VisualItem = {
  title: string;
  file: string;
  type: string;
  scale?: string;
  resolution?: string;
  format?: string;
  status?: string;
  image: string;
};

export type Project = {
  id: string;
  code: string;
  name: string;
  type: string;
  year: number | string;
  status: string;
  location: string;
  assets: string[];
  files: string;
  image: string;
  renders: VisualItem[];
  drawings: VisualItem[];
  sections: VisualItem[];
  plans: VisualItem[];
  hasConcept: boolean;
  hasModel3d: boolean;
  concept: {
    title: string;
    text: string;
    keywords: string[];
    image: string;
  };
  model3d: {
    model: string;
    status: string;
  };
  siteData: {
    location: string;
    coordinates: string;
    siteArea: string;
    urbanContext: string;
    accessibility: string;
    landUse: string;
    images: VisualItem[];
  };
};

export type ProjectStats = {
  totalProjects: number;
  totalRenders: number;
  totalDrawings: number;
  totalSections: number;
  totalPlans: number;
  totalSiteData: number;
  totalModels: number;
};

type VisualCategory = "renders" | "drawings" | "sections" | "plans" | "site-data";
type CountCategory = VisualCategory | "model" | "models" | "model_3d";

type ProjectMetadata = Omit<Project, "assets" | "files" | "image" | "renders" | "drawings" | "sections" | "plans" | "concept" | "model3d" | "siteData"> & {
  hasConcept: boolean;
  hasModel3d: boolean;
  conceptTitle: string;
  conceptText: string;
  keywords: string[];
  locationDetail: string;
  coordinates: string;
  siteArea: string;
  urbanContext: string;
  accessibility: string;
  landUse: string;
};

type ProjectJson = Partial<ProjectMetadata> & {
  concept?: Partial<Project["concept"]>;
  model3d?: Partial<Project["model3d"]>;
  siteData?: Partial<Project["siteData"]>;
};

const publicRoot = path.join(process.cwd(), "public");
const projectsRootName = "PROJECTS";
const projectsRoot = path.join(publicRoot, projectsRootName);
const fallbackImage = "/ekybo-home-hero.png";

const categoryLabels: Record<VisualCategory, string> = {
  renders: "RENDER",
  drawings: "DRAWING",
  sections: "SECTION",
  plans: "PLAN",
  "site-data": "SITE_DATA",
};

const imageExtensions = new Set([".jpeg", ".jpg", ".png", ".webp"]);
const pdfExtensions = new Set([".pdf"]);
const modelExtensions = new Set([".glb", ".gltf"]);

const validExtensionsByCategory: Record<VisualCategory, Set<string>> = {
  renders: imageExtensions,
  drawings: new Set([...imageExtensions, ...pdfExtensions]),
  sections: new Set([...imageExtensions, ...pdfExtensions]),
  plans: new Set([...imageExtensions, ...pdfExtensions]),
  "site-data": new Set([...imageExtensions, ...pdfExtensions]),
};

export function getProjects(): Project[] {
  const folders = readDirectories(projectsRoot);

  return folders.map((folder, index) => {
    const projectJson = readProjectJson(folder);
    const metadata = createProjectMetadata(folder, index, projectJson);
    const baseUrl = `/${projectsRootName}/${encodeURIComponent(folder)}`;
    const hero = findHero(folder, baseUrl);
    const renders = readVisualItems(folder, "renders", baseUrl);
    const drawings = readVisualItems(folder, "drawings", baseUrl);
    const sections = readVisualItems(folder, "sections", baseUrl);
    const plans = readVisualItems(folder, "plans", baseUrl);
    const siteDataImages = readVisualItems(folder, "site-data", baseUrl);
    const modelFiles = readModelFiles(folder);
    const hasModel3d = modelFiles.length > 0;
    const modelFile = hasModel3d
      ? projectJson.model3d?.model && modelFiles.includes(projectJson.model3d.model)
        ? projectJson.model3d.model
        : modelFiles[0]
      : "";
    const hasConcept = hasProjectConcept(projectJson);
    const image = hero ?? renders[0]?.image ?? drawings[0]?.image ?? sections[0]?.image ?? plans[0]?.image ?? fallbackImage;
    const indexedFiles = renders.length + drawings.length + sections.length + plans.length + siteDataImages.length;

    return {
      id: metadata.id,
      code: metadata.code,
      name: metadata.name,
      type: metadata.type,
      year: metadata.year,
      status: metadata.status,
      location: metadata.location,
      assets: [
        formatAssetCount(renders.length, "RENDERS"),
        formatAssetCount(drawings.length, "DRAWINGS"),
        formatAssetCount(sections.length, "SECTIONS"),
        formatAssetCount(plans.length, "PLANS"),
      ],
      files: `${formatCount(indexedFiles)} INDEXED FILES`,
      image,
      renders,
      drawings,
      sections,
      plans,
      hasConcept,
      hasModel3d,
      concept: {
        title: projectJson.concept?.title ?? metadata.conceptTitle,
        text: projectJson.concept?.text ?? metadata.conceptText,
        keywords: projectJson.concept?.keywords ?? metadata.keywords,
        image: projectJson.concept?.image ?? image,
      },
      model3d: {
        model: modelFile,
        status: projectJson.model3d?.status ?? "PENDIENTE",
      },
      siteData: {
        location: projectJson.siteData?.location ?? metadata.locationDetail,
        coordinates: projectJson.siteData?.coordinates ?? metadata.coordinates,
        siteArea: projectJson.siteData?.siteArea ?? metadata.siteArea,
        urbanContext: projectJson.siteData?.urbanContext ?? metadata.urbanContext,
        accessibility: projectJson.siteData?.accessibility ?? metadata.accessibility,
        landUse: projectJson.siteData?.landUse ?? metadata.landUse,
        images: siteDataImages,
      },
    };
  });
}

export const projects = getProjects();

export function getProjectStats(): ProjectStats {
  const folders = readDirectories(projectsRoot);

  return folders.reduce<ProjectStats>((stats, folder) => ({
    totalProjects: stats.totalProjects + 1,
    totalRenders: stats.totalRenders + countFiles(folder, "renders"),
    totalDrawings: stats.totalDrawings + countFiles(folder, "drawings"),
    totalSections: stats.totalSections + countFiles(folder, "sections"),
    totalPlans: stats.totalPlans + countFiles(folder, "plans"),
    totalSiteData: stats.totalSiteData + countFiles(folder, "site-data"),
    totalModels:
      stats.totalModels +
      countFiles(folder, "model") +
      countFiles(folder, "models") +
      countFiles(folder, "model_3d"),
  }), {
    totalProjects: 0,
    totalRenders: 0,
    totalDrawings: 0,
    totalSections: 0,
    totalPlans: 0,
    totalSiteData: 0,
    totalModels: 0,
  });
}

function readVisualItems(folder: string, category: VisualCategory, baseUrl: string): VisualItem[] {
  const directory = path.join(projectsRoot, folder, category);
  const files = readFiles(directory).filter((file) => isValidVisualAsset(file, category));

  return files.map((file, index) => {
    const extension = path.extname(file).slice(1).toUpperCase();
    const label = categoryLabels[category];

    return {
      title: createTitle(file, label, index),
      file,
      type: `${label}_ASSET`,
      scale: category === "drawings" || category === "sections" || category === "plans" ? "TBD" : undefined,
      resolution: category === "renders" || category === "site-data" ? "SOURCE" : undefined,
      format: extension || "IMAGE",
      status: "INDEXED",
      image: `${baseUrl}/${category}/${encodeURIComponent(file)}`,
    };
  });
}

function countFiles(folder: string, category: CountCategory) {
  if (category === "models") {
    return readFiles(path.join(projectsRoot, folder, "models")).filter((file) => modelExtensions.has(path.extname(file).toLowerCase())).length;
  }

  if (category === "model" || category === "model_3d") {
    return readFiles(path.join(projectsRoot, folder, "models")).filter((file) => modelExtensions.has(path.extname(file).toLowerCase())).length;
  }

  if (category === "site-data") {
    return readFiles(path.join(projectsRoot, folder, "site-data")).filter((file) => isValidVisualAsset(file, "site-data")).length;
  }

  return readFiles(path.join(projectsRoot, folder, category)).filter((file) => {
    if (category === "renders" || category === "drawings" || category === "sections" || category === "plans") {
      return isValidVisualAsset(file, category);
    }

    return true;
  }).length;
}

function readModelFiles(folder: string) {
  return readFiles(path.join(projectsRoot, folder, "models")).filter((file) => modelExtensions.has(path.extname(file).toLowerCase()));
}

function isValidVisualAsset(file: string, category: VisualCategory) {
  return validExtensionsByCategory[category].has(path.extname(file).toLowerCase());
}

function findHero(folder: string, baseUrl: string): string | null {
  const files = readFiles(path.join(projectsRoot, folder));
  const hero = files.find((file) => path.basename(file, path.extname(file)).toLowerCase() === "hero");

  return hero ? `${baseUrl}/${encodeURIComponent(hero)}` : null;
}

function hasProjectConcept(projectJson: ProjectJson) {
  if (projectJson.concept) {
    const title = projectJson.concept.title?.trim();
    const text = projectJson.concept.text?.trim();
    const keywordCount = projectJson.concept.keywords?.length ?? 0;

    if (title || text || keywordCount > 0) {
      return true;
    }
  }

  return Boolean(
    projectJson.conceptTitle?.trim() ||
    projectJson.conceptText?.trim() ||
    (projectJson.keywords && projectJson.keywords.length > 0)
  );
}

function readProjectJson(folder: string): ProjectJson {
  const filePath = path.join(projectsRoot, folder, "project.json");

  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));

    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function readDirectories(directory: string) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(compareNatural);
}

function readFiles(directory: string) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort(compareNatural);
}

function createProjectMetadata(folder: string, index: number, projectJson: ProjectJson): ProjectMetadata {
  const fallback = createFallbackMetadata(folder, index);

  return {
    id: projectJson.id ?? fallback.id,
    code: projectJson.code ?? fallback.code,
    name: folder,
    type: projectJson.type ?? fallback.type,
    year: projectJson.year ?? fallback.year,
    status: projectJson.status ?? fallback.status,
    location: projectJson.location ?? fallback.location,
    hasConcept: false,
    hasModel3d: false,
    conceptTitle: projectJson.conceptTitle ?? projectJson.concept?.title ?? fallback.conceptTitle,
    conceptText: projectJson.conceptText ?? projectJson.concept?.text ?? fallback.conceptText,
    keywords: projectJson.keywords ?? projectJson.concept?.keywords ?? fallback.keywords,
    locationDetail: projectJson.locationDetail ?? projectJson.siteData?.location ?? fallback.locationDetail,
    coordinates: projectJson.coordinates ?? projectJson.siteData?.coordinates ?? fallback.coordinates,
    siteArea: projectJson.siteArea ?? projectJson.siteData?.siteArea ?? fallback.siteArea,
    urbanContext: projectJson.urbanContext ?? projectJson.siteData?.urbanContext ?? fallback.urbanContext,
    accessibility: projectJson.accessibility ?? projectJson.siteData?.accessibility ?? fallback.accessibility,
    landUse: projectJson.landUse ?? projectJson.siteData?.landUse ?? fallback.landUse,
  };
}

function createFallbackMetadata(folder: string, index: number): ProjectMetadata {
  return {
    id: folder.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    code: `PRJ_${formatCount(index + 1)}`,
    name: folder,
    type: "UNCLASSIFIED",
    year: "TBD",
    status: "INDEXED",
    location: "TBD",
    hasConcept: false,
    hasModel3d: false,
    conceptTitle: "Índice de Archivos del Proyecto",
    conceptText: "Este proyecto utiliza todos los archivos disponibles encontrados en sus carpetas de recursos.",
    keywords: ["Arquitectura", "Archivos", "Índice"],
    locationDetail: "TBD",
    coordinates: "TBD",
    siteArea: "TBD",
    urbanContext: "TBD",
    accessibility: "TBD",
    landUse: "TBD",
  };
}

function createTitle(file: string, label: string, index: number) {
  const cleanName = path
    .basename(file, path.extname(file))
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleanName ? cleanName.toUpperCase() : `${label} ${formatCount(index + 1)}`;
}

function isRecord(value: unknown): value is ProjectJson {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatAssetCount(count: number, label: string) {
  return `${formatCount(count)} ${label}`;
}

function formatCount(value: number) {
  return value.toString().padStart(2, "0");
}

function compareNatural(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

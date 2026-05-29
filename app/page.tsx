import AppClient from "./AppClient";
import { getProjects, getProjectStats } from "./projects/data";

export default function Page() {
  const projects = getProjects();
  const projectStats = getProjectStats();

  return <AppClient projects={projects} projectStats={projectStats} />;
}

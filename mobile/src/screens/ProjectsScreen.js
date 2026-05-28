import React from "react";
import { LoadingState } from "../components/LoadingState";
import { Notice, Screen } from "../components/Layout";
import { ProjectCard } from "../components/ProjectCard";
import { useResource } from "../hooks/useResource";

export default function ProjectsScreen() {
  const { data: projects, loading, error, fromFallback, reload } = useResource("/projects");

  if (loading && !projects) return <LoadingState label="Loading projects..." />;

  return (
    <Screen
      eyebrow="Projects"
      title="Native BudgetMate modules"
      subtitle="Visible project links are tappable and open the original inspected website pages."
      refreshing={loading}
      onRefresh={reload}
    >
      <Notice text={fromFallback ? `Offline demo mode: ${error}` : null} />
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </Screen>
  );
}

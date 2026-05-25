import { useState } from "react";
import { Link } from "wouter";
import { Wand2, Download, Trash2, Clock, CheckCircle2, AlertCircle, Loader2, BarChart3 } from "lucide-react";
import {
  useListProjects,
  useDeleteProject,
  useGetProjectStats,
  getListProjectsQueryKey,
  getGetProjectStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, color: "text-muted-foreground", bg: "bg-muted" },
  processing: { label: "Processing", icon: Loader2, color: "text-chart-3", bg: "bg-chart-3/10" },
  ready: { label: "Ready", icon: CheckCircle2, color: "text-chart-4", bg: "bg-chart-4/10" },
  failed: { label: "Failed", icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
} as const;

const FORMAT_LABELS = {
  square: "1:1 Square",
  vertical: "9:16 Vertical",
  horizontal: "16:9 Horizontal",
};

export default function Projects() {
  const queryClient = useQueryClient();
  const { data: projects, isLoading } = useListProjects();
  const { data: stats } = useGetProjectStats();
  const deleteProject = useDeleteProject();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    setDeletingId(id);
    deleteProject.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProjectStatsQueryKey() });
          setDeletingId(null);
        },
        onError: () => setDeletingId(null),
      }
    );
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black mb-2">Your Projects</h1>
            <p className="text-muted-foreground">All your video projects, ready to download</p>
          </div>
          <Link
            href="/create"
            data-testid="button-new-project"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
          >
            <Wand2 className="w-4 h-4" />
            New video
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total", value: stats.total, icon: BarChart3, color: "text-primary" },
              { label: "Ready", value: stats.ready, icon: CheckCircle2, color: "text-chart-4" },
              { label: "Processing", value: stats.processing, icon: Loader2, color: "text-chart-3" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Projects list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse h-20" />
            ))}
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="text-center py-24 bg-card border border-dashed border-border rounded-2xl">
            <Wand2 className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6 text-sm">Create your first music video</p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
            >
              Create a video
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const status = project.status as keyof typeof STATUS_CONFIG;
              const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const format = project.format as keyof typeof FORMAT_LABELS;

              return (
                <div
                  key={project.id}
                  data-testid={`card-project-${project.id}`}
                  className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon className={`w-4 h-4 ${cfg.color} ${status === "processing" ? "animate-spin" : ""}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{project.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        {project.artistName && <span>{project.artistName}</span>}
                        {project.artistName && <span>·</span>}
                        <span>{FORMAT_LABELS[format] ?? format}</span>
                        <span>·</span>
                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>

                    {status === "ready" && (
                      <a
                        href={project.downloadUrl ?? "#"}
                        download={`${project.title}.webm`}
                        data-testid={`button-download-${project.id}`}
                        className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </a>
                    )}

                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={deletingId === project.id}
                      data-testid={`button-delete-${project.id}`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

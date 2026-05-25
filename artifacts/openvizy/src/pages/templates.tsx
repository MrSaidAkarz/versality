import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useListTemplates } from "@workspace/api-client-react";
import { CanvasVisualizer, type TemplateStyle } from "@/components/canvas-visualizer";

export default function Templates() {
  const { data: templates, isLoading } = useListTemplates();

  const displayTemplates = templates ?? [];

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-3">Templates</h1>
          <p className="text-muted-foreground text-lg">
            {displayTemplates.length} audio-reactive templates — all yours
          </p>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border animate-pulse h-64" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTemplates.map((template) => (
              <div
                key={template.id}
                data-testid={`card-template-${template.id}`}
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="relative overflow-hidden">
                  <CanvasVisualizer
                    style={template.style as TemplateStyle}
                    color={template.previewColor}
                    width={600}
                    height={300}
                    className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg">{template.name}</h3>
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: template.previewColor, boxShadow: `0 0 8px ${template.previewColor}` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {template.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(template.tags ?? []).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {(template.supportedFormats ?? []).map((fmt) => (
                        <span
                          key={fmt}
                          className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-medium"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                    <Link
                      href="/create"
                      data-testid={`button-use-template-${template.id}`}
                      className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Use this
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import {
  Users,
  Target,
  Frown,
  Activity,
  Monitor,
  Quote,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { usePersonas } from "@/stores/artifact-store";

export function PersonaCardsView({ projectId }: { projectId: string }) {
  const personas = usePersonas();
  const setAiPanelOpen = useWorkspaceContext((s) => s.setAiPanelOpen);

  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("personas");
  }, []);

  if (personas.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 py-[16px]">
          <h2 className="text-sm font-semibold">User Personas</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-sm">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No personas yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ask Hannibal to generate user personas for your product.
            </p>
            <button
              onClick={() => setAiPanelOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Open AI Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-[16px] flex items-center justify-between">
        <h2 className="text-sm font-semibold">User Personas</h2>
        <Badge variant="secondary" className="text-xs">
          {personas.length} persona{personas.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {personas.map((persona) => (
            <Card key={persona.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{persona.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {persona.demographics}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    <Monitor className="h-3 w-3 mr-1" />
                    {persona.techProficiency}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex items-start gap-2">
                    <Quote className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm italic text-muted-foreground">
                      {persona.quote}
                    </p>
                  </div>
                </div>

                <PersonaList
                  icon={Target}
                  title="Goals"
                  items={persona.goals}
                  color="text-green-400"
                  dotColor="bg-green-400"
                />

                <PersonaList
                  icon={Frown}
                  title="Frustrations"
                  items={persona.frustrations}
                  color="text-red-400"
                  dotColor="bg-red-400"
                />

                <PersonaList
                  icon={Activity}
                  title="Behaviors"
                  items={persona.behaviors}
                  color="text-blue-400"
                  dotColor="bg-blue-400"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonaList({
  icon: Icon,
  title,
  items,
  color,
  dotColor,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  color: string;
  dotColor: string;
}) {
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-xs font-medium ${color} mb-1.5`}>
        <Icon className="h-3 w-3" />
        {title}
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm flex items-start gap-2">
            <span
              className={`mt-1.5 h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

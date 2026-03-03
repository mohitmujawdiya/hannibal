"use client";

import { motion } from "motion/react";
import { FileText, GitBranch, Map, Users, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: FileText,
    title: "AI Plans & PRDs",
    description:
      "Generate comprehensive product plans and specs from a single prompt.",
  },
  {
    icon: GitBranch,
    title: "Feature Trees",
    description:
      "Visualize your product as an interactive feature hierarchy with AI suggestions.",
  },
  {
    icon: Map,
    title: "Roadmaps",
    description:
      "Drag-and-drop timeline roadmaps that stay in sync with your feature tree.",
  },
  {
    icon: Users,
    title: "Personas",
    description:
      "AI-generated user personas grounded in your product context and market.",
  },
  {
    icon: Swords,
    title: "Competitor Analysis",
    description:
      "Research competitors with AI-powered web search and structured breakdowns.",
  },
] as const;

const ease = [0.25, 0.1, 0.25, 1] as const;

export function FeatureCards() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease }}
          className="mb-12 text-center text-2xl font-semibold sm:text-3xl"
        >
          Everything a PM needs.{" "}
          <span className="text-muted-foreground">AI does the rest.</span>
        </motion.h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease,
              }}
              whileHover={{ y: -2 }}
              className={cn(
                "group rounded-xl border border-border/50 bg-card/50 p-6 transition-colors hover:border-border",
                // Center the last 2 cards in a 3-col grid
                i === 3 && "lg:col-start-1 lg:col-end-2 lg:justify-self-end",
                i === 4 && "lg:col-start-2 lg:col-end-3"
              )}
            >
              <feature.icon className="mb-3 h-5 w-5 text-muted-foreground transition-colors group-hover:text-blue-400" />
              <h3 className="mb-1 text-sm font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

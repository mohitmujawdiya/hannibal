"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Play, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignupForm } from "./signup-form";

const ease = [0.25, 0.1, 0.25, 1] as const;

function WorkspaceMock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.6, ease }}
      className="mx-auto mt-16 w-full max-w-3xl"
    >
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/30 p-1.5 shadow-2xl shadow-black/20 ring-1 ring-blue-600/5">
        <div className="flex h-48 gap-1 rounded-lg sm:h-56 md:h-64">
          {/* Sidebar */}
          <div className="flex w-16 shrink-0 flex-col gap-2 rounded-l-md bg-sidebar/50 p-2.5 sm:w-20">
            <div className="h-2 w-8 rounded-full bg-muted-foreground/20" />
            <div className="h-2 w-10 rounded-full bg-muted-foreground/15" />
            <div className="h-2 w-6 rounded-full bg-muted-foreground/10" />
            <div className="mt-auto h-2 w-8 rounded-full bg-muted-foreground/10" />
          </div>
          {/* Main content */}
          <div className="flex flex-1 flex-col gap-2 bg-background/30 p-3">
            <div className="h-2.5 w-24 rounded-full bg-muted-foreground/25" />
            <div className="h-2 w-full rounded-full bg-muted-foreground/10" />
            <div className="h-2 w-4/5 rounded-full bg-muted-foreground/10" />
            <div className="h-2 w-3/5 rounded-full bg-muted-foreground/10" />
            <div className="mt-2 h-2 w-full rounded-full bg-muted-foreground/8" />
            <div className="h-2 w-5/6 rounded-full bg-muted-foreground/8" />
            <div className="h-2 w-2/3 rounded-full bg-muted-foreground/8" />
          </div>
          {/* AI Panel */}
          <div className="flex w-28 shrink-0 flex-col gap-2 rounded-r-md bg-muted/30 p-2.5 sm:w-36">
            <div className="h-2 w-8 rounded-full bg-blue-600/30" />
            <div className="mt-1 rounded-md bg-muted/50 p-2">
              <div className="h-1.5 w-full rounded-full bg-muted-foreground/15" />
              <div className="mt-1 h-1.5 w-4/5 rounded-full bg-muted-foreground/10" />
            </div>
            <div className="rounded-md bg-muted/50 p-2">
              <div className="h-1.5 w-full rounded-full bg-muted-foreground/15" />
              <div className="mt-1 h-1.5 w-3/5 rounded-full bg-muted-foreground/10" />
            </div>
            <div className="mt-auto h-2 w-full rounded-md bg-muted-foreground/10" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section className="pb-16 pt-24 sm:pt-32">
      <div className="mx-auto max-w-5xl px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease }}
        >
          <Badge
            variant="secondary"
            className="mb-6 gap-1.5 border-blue-600/20 bg-blue-600/10 px-3 py-1 text-xs text-blue-400"
          >
            <Sparkles className="h-3 w-3" />
            Founding Members
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease }}
          className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
        >
          Cursor for PMs.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease }}
          className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground sm:text-xl"
        >
          Go from rough idea to full product plan in minutes — whether you&apos;re a founder brainstorming or a PM shipping.
        </motion.p>

        {/* Signup form + Demo CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <SignupForm />
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" asChild>
            <Link href="/demo">
              <Play className="h-3.5 w-3.5" />
              Try the demo
            </Link>
          </Button>
        </motion.div>

        {/* Workspace mock */}
        <WorkspaceMock />
      </div>
    </section>
  );
}

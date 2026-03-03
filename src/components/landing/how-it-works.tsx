"use client";

import { motion } from "motion/react";

const steps = [
  {
    number: "01",
    title: "Describe your product",
    description:
      "Tell the AI about your product, market, and goals in natural language.",
  },
  {
    number: "02",
    title: "AI generates everything",
    description:
      "Plans, PRDs, feature trees, personas, and competitive analysis — all at once.",
  },
  {
    number: "03",
    title: "Refine & ship",
    description:
      "Edit, reorganize, and iterate in the workspace. Push to your roadmap when ready.",
  },
] as const;

const ease = [0.25, 0.1, 0.25, 1] as const;

export function HowItWorks() {
  return (
    <section className="border-t border-border/50 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease }}
          className="mb-12 text-center text-2xl font-semibold sm:text-3xl"
        >
          How it works
        </motion.h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.15,
                ease,
              }}
              className="text-center"
            >
              <div className="mb-3 text-3xl font-bold text-blue-600/40">
                {step.number}
              </div>
              <h3 className="mb-2 text-sm font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

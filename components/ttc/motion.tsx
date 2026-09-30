"use client";

import { type Variants } from "framer-motion";

// ─── Entrance Variants ───

/** Fade in and slide up from 20px below */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  },
};

/** Simple opacity fade */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

/** Scale up from 96% + fade */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  },
};

/** Slide in from the left */
export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

/** Slide in from the right */
export const slideRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// ─── Stagger Containers ───

/** Default stagger — 100ms between children */
export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/** Faster stagger — 60ms between children (good for grids) */
export const staggerFast: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/** Slower stagger — 150ms between children (good for hero text) */
export const staggerSlow: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

// ─── Viewport defaults ───

/** Standard viewport trigger config for scroll animations */
export const viewportOnce = { once: true, margin: "-80px" as const };

// ─── Re-exports ───

export { motion, AnimatePresence } from "framer-motion";

"use client";

/*
  SmoothScroll.jsx
  -----------------------------------------------------------
  Sets up Lenis (buttery smooth scrolling library) once for the
  whole site, and keeps GSAP's ScrollTrigger perfectly in sync
  with it. Without this sync step, ScrollTrigger would measure
  scroll position using the native (jumpy) scroll and get out
  of step with what Lenis is actually rendering on screen.

  It also exposes the Lenis instance via React Context (useLenis)
  so components like Navbar can call `lenis.scrollTo(...)` for
  smooth anchor-link jumps to a section.
*/

import { createContext, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register the ScrollTrigger plugin once, at module load time.
gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext(null);

// Any client component can call useLenis() to get the shared Lenis instance.
export function useLenis() {
  return useContext(LenisContext);
}

export default function SmoothScroll({ children }) {
  const [lenis, setLenis] = useState(null);

  useEffect(() => {
    const lenisInstance = new Lenis({
      duration: 1.2, // higher = softer/slower deceleration
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    setLenis(lenisInstance);

    // Tell ScrollTrigger to re-check positions on every Lenis scroll tick.
    lenisInstance.on("scroll", ScrollTrigger.update);

    // Drive Lenis's internal animation loop using GSAP's ticker instead of
    // requestAnimationFrame directly, so both libraries stay perfectly synced.
    function syncLenisWithGsapTicker(time) {
      lenisInstance.raf(time * 1000);
    }
    gsap.ticker.add(syncLenisWithGsapTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(syncLenisWithGsapTicker);
      lenisInstance.destroy();
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

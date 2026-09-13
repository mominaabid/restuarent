"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BURGER_LAYERS = [
  {
    id: "bun-top",
    alt: "Top burger bun",
    src: "/burger-layers/bun-up.png",
    width: 612,
    height: 408,
    final: { top: "8%", left: "0%", width: "100%", squash: 0.52 },
    scatter: { x: 60, y: -520, rotate: 16, rotateX: -34, rotateY: 24, scale: 0.72 },
  },
  {
    id: "onion",
    alt: "Onion rings",
    src: "/burger-layers/onion.png",
    width: 677,
    height: 369,
    final: { top: "31%", left: "8%", width: "84%", squash: 0.42 },
    scatter: { x: 460, y: -210, rotate: 28, rotateX: 24, rotateY: -32, scale: 0.66 },
  },
  {
    id: "tomato",
    alt: "Tomato slices",
    src: "/burger-layers/tomatoes.png",
    width: 500,
    height: 500,
    final: { top: "38%", left: "36%", width: "28%", squash: 0.42 },
    scatter: { x: -420, y: 160, rotate: -28, rotateX: 36, rotateY: 28, scale: 0.62 },
  },
  {
    id: "lettuce",
    alt: "Fresh lettuce",
    src: "/burger-layers/lettuce.png",
    width: 612,
    height: 408,
    final: { top: "36%", left: "1%", width: "98%", squash: 0.3 },
    scatter: { x: 430, y: 310, rotate: 24, rotateX: -26, rotateY: -24, scale: 0.7 },
  },
  {
    id: "cheese",
    alt: "Melted cheese slice",
    src: "/burger-layers/cheseslice.png",
    width: 500,
    height: 500,
    final: { top: "45%", left: "9%", width: "82%", squash: 0.3 },
    scatter: { x: -440, y: -280, rotate: -34, rotateX: 28, rotateY: 34, scale: 0.64 },
  },
  {
    id: "patty",
    alt: "Flame-grilled patty",
    src: "/burger-layers/pattie.png",
    width: 612,
    height: 408,
    final: { top: "57%", left: "6%", width: "88%", squash: 0.4 },
    scatter: { x: 430, y: -110, rotate: 20, rotateX: 38, rotateY: -30, scale: 0.74 },
  },
  {
    id: "bun-bottom",
    alt: "Bottom burger bun",
    src: "/burger-layers/bun-down.png",
    width: 612,
    height: 408,
    final: { top: "68%", left: "0%", width: "100%", squash: 0.5 },
    scatter: { x: -420, y: 330, rotate: -22, rotateX: -30, rotateY: 26, scale: 0.7 },
  },
];

const ASSEMBLY_ORDER = [...BURGER_LAYERS].reverse();

export default function Hero() {
  const sectionRef = useRef(null);
  const copyRef = useRef(null);
  const ctaRef = useRef(null);
  const layerRefs = useRef({});
  const progressRef = useRef(null);
  const stageRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [heroEntered, setHeroEntered] = useState(false);

  // This direct scroll measurement is the source of truth for the visual
  // assembly. It keeps the sequence reliable even when smooth-scroll wrappers
  // or browser scroll restoration are present.
  useEffect(() => {
    let frameId;
    const updateAssemblyProgress = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const section = sectionRef.current;
        if (!section) return;
        const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
        const nextProgress = Math.min(1, Math.max(0, (window.scrollY - section.offsetTop) / travel));
        setScrollProgress(nextProgress);
      });
    };

    updateAssemblyProgress();
    const entranceTimer = window.setTimeout(() => setHeroEntered(true), 80);
    window.addEventListener("scroll", updateAssemblyProgress, { passive: true });
    window.addEventListener("resize", updateAssemblyProgress);
    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(entranceTimer);
      window.removeEventListener("scroll", updateAssemblyProgress);
      window.removeEventListener("resize", updateAssemblyProgress);
    };
  }, []);

  useLayoutEffect(() => {
    // Browsers can restore the previous scroll position after a refresh. For
    // this scroll-story hero, always begin on frame one instead of frame 07/07.
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }

    // The component below uses direct scroll progress. Keep the older GSAP
    // implementation opt-in only, so it cannot overwrite the layer states.
    if (!window.location.search.includes("legacy-gsap")) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { isMobile: "(max-width: 767px)" },
        (context) => {
          const { isMobile } = context.conditions;

          // The first frame is deliberately quiet: only the bottom bun is on
          // screen. Every other ingredient stays fully hidden until its turn.
          const bottomBun = ASSEMBLY_ORDER[0];
          const bottomBunEl = layerRefs.current[bottomBun.id];
          gsap.set(bottomBunEl, {
            x: 0,
            y: -360,
            rotate: 0,
            rotateX: 0,
            rotateY: 0,
            scale: 0.84,
            opacity: 0,
          });
          gsap.to(bottomBunEl, { y: 0, scale: 1, opacity: 1, duration: 1.05, ease: "power3.out", delay: 0.15 });

          ASSEMBLY_ORDER.slice(1).forEach((layer) => {
            const el = layerRefs.current[layer.id];
            if (!el) return;
            gsap.set(el, {
              // Every ingredient falls in from above, matching the way a
              // burger is actually assembled rather than flying in sideways.
              x: 0,
              y: isMobile ? -340 : -560,
              rotate: layer.scatter.rotate * 0.25,
              rotateX: -18,
              rotateY: 0,
              scale: 0.82,
              transformPerspective: 1100,
              transformOrigin: "50% 50%",
              opacity: 0,
            });
          });
          gsap.set([copyRef.current, ctaRef.current], { autoAlpha: 0, y: 28 });
          gsap.set(progressRef.current, { scaleX: 0, transformOrigin: "left center" });

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.7,
              invalidateOnRefresh: true,
            },
          });

          // The final pause gives the visitor time to see the completed burger
          // before the next section enters the viewport.
          timeline.to(progressRef.current, { scaleX: 1, ease: "none", duration: 10.5 }, 0);
          timeline.to(stageRef.current, { rotateZ: -1.5, scale: isMobile ? 0.94 : 0.98, ease: "none", duration: 10.5 }, 0);

          // Start with the patty. The bottom bun is already waiting on screen.
          ASSEMBLY_ORDER.slice(1).forEach((layer, index) => {
            const el = layerRefs.current[layer.id];
            timeline.to(
              el,
              { x: 0, y: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, opacity: 1, duration: 0.95, ease: "power3.out" },
              0.75 + index * 1.15
            );
          });

          // Bottom bun → patty → cheese → lettuce → tomato → onion → top bun.
          // Each ingredient lands before the next one begins moving.
          const assemblyEnd = 0.75 + (ASSEMBLY_ORDER.length - 2) * 1.15 + 0.95;
          timeline.to(
            copyRef.current,
            { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" },
            assemblyEnd + 0.45
          );

          timeline.to(
            ctaRef.current,
            { autoAlpha: 1, y: 0, duration: 0.65, ease: "power3.out" },
            assemblyEnd + 1.1
          );
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="home" ref={sectionRef} className="relative h-[280vh] sm:h-[300vh]">
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden bg-brand-black">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="hero-orb hero-orb-one pointer-events-none absolute" />
        <div className="hero-orb hero-orb-two pointer-events-none absolute" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(7,7,7,0.2)_55%,#070707_100%)]" />
        <div ref={stageRef} className="burger-stage relative z-10 h-[430px] w-[82%] max-w-[330px] sm:h-[480px] sm:max-w-[380px] md:h-[530px] md:max-w-[430px]">
          {BURGER_LAYERS.map((layer, index) => {
            const assemblyIndex = ASSEMBLY_ORDER.findIndex((item) => item.id === layer.id);
            const startAt = assemblyIndex === 0 ? 0 : 0.1 + (assemblyIndex - 1) * 0.11;
            const layerProgress = assemblyIndex === 0
              ? (heroEntered ? 1 : 0)
              : Math.min(1, Math.max(0, (scrollProgress - startAt) / 0.08));

            return <div
              key={layer.id}
              ref={(el) => { layerRefs.current[layer.id] = el; }}
              style={{
                top: layer.final.top,
                left: layer.final.left,
                width: layer.final.width,
                zIndex: BURGER_LAYERS.length - index,
                opacity: layerProgress,
                transform: `translate3d(0, ${-560 * (1 - layerProgress)}px, 0) rotate(${layer.scatter.rotate * (1 - layerProgress) * 0.18}deg) scale(${0.82 + layerProgress * 0.18})`,
                transition: assemblyIndex === 0 ? "transform 1.05s cubic-bezier(.22,1,.36,1), opacity .5s ease" : "none",
              }}
              className="burger-layer absolute will-change-transform"
            >
              <Image
                src={layer.src}
                alt={layer.alt}
                width={layer.width}
                height={layer.height}
                priority={layer.id === "bun-bottom" || layer.id === "bun-top"}
                style={{ transform: `scaleY(${layer.final.squash})`, transformOrigin: "top center" }}
                className="h-auto w-full object-contain"
              />
            </div>;
          })}
        </div>

        <div ref={copyRef} style={{ opacity: Math.min(1, Math.max(0, (scrollProgress - 0.84) / 0.08)) }} className="absolute left-5 top-[43%] z-20 -translate-y-1/2 text-left sm:left-8 md:left-14">
          <div className="mb-6 font-body uppercase leading-relaxed">
            <p className="mb-3 whitespace-nowrap text-[10px] font-medium tracking-[0.3em] text-brand-red">01 — FIRE ASSEMBLED</p>
            <p className="mb-3 whitespace-nowrap text-[11px] font-normal tracking-[0.1em] text-white/70 sm:text-xs">SCROLL TO STACK THE FLAVOUR</p>
            <p className="whitespace-nowrap text-[11px] font-normal tracking-[0.1em] text-white/50 sm:text-xs">BUILT ONE LAYER AT A TIME</p>
          </div>
          <h1 className="font-display text-4xl leading-[0.82] tracking-wide text-white sm:text-6xl md:text-7xl lg:text-8xl">BITE INTO<br /><span className="text-brand-red">BOLD.</span></h1>
        </div>
        <a href="#menu" ref={ctaRef} style={{ opacity: Math.min(1, Math.max(0, (scrollProgress - 0.91) / 0.06)) }} className="btn-primary absolute bottom-5 z-20 sm:bottom-6 md:bottom-3">ORDER YOURS</a>
        <div className="absolute bottom-7 left-5 z-20 hidden w-28 md:block"><div className="mb-2 flex justify-between font-body text-[9px] uppercase tracking-[0.2em] text-white/45"><span>Build</span><span>{Math.min(7, Math.floor(scrollProgress * 8) + 1).toString().padStart(2, "0")}/07</span></div><div className="h-px w-full bg-white/20"><div ref={progressRef} style={{ transform: `scaleX(${scrollProgress})`, transformOrigin: "left center" }} className="h-full w-full bg-brand-gold" /></div></div>
        <div className="build-arrow pointer-events-none absolute right-4 top-1/2 z-20 -translate-y-1/2 text-center sm:right-8 md:right-10" aria-hidden="true">
          <span className="mb-3 block font-body text-[9px] uppercase tracking-[0.26em] text-brand-gold">stack it</span>
          <span>⌄</span><span>⌄</span><span>⌄</span>
        </div>
        <div className="pointer-events-none absolute bottom-8 right-5 z-20 font-body text-[9px] uppercase tracking-[0.3em] text-white/35 md:right-10">keep scrolling ↓</div>
      </div>
    </section>
  );
}

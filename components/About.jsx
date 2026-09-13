"use client";

/*
  About.jsx
  -----------------------------------------------------------
  Short brand-story section: text on the left, photo on the
  right (stacked on mobile). Both sides fade/slide in from
  opposite directions as the section scrolls into view.
*/

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  const imageRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Text slides in from the left, image from the right —
      // both triggered by the same scroll position.
      gsap.fromTo(
        textRef.current,
        { opacity: 0, x: -60 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        }
      );

      gsap.fromTo(
        imageRef.current,
        { opacity: 0, x: 60 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="relative overflow-hidden bg-brand-black py-14 md:py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2 md:px-10">
        {/* Left: brand story text */}
        <div ref={textRef}>
          <h2 className="font-display text-4xl leading-tight tracking-wide text-white md:text-5xl">
            BUILT ON FIRE, <span className="text-brand-red">FLAVOR &amp; PRIDE</span>
          </h2>
          <span className="heading-underline !mx-0" />
          <p className="mt-6 font-body text-base leading-relaxed text-white/65 md:text-lg">
            Every burger we serve starts with premium beef, hand-pressed and flame-grilled
            to order — never frozen, never rushed. We source our produce daily and bake our
            buns fresh each morning because shortcuts have no place in real flavor.
          </p>
          <p className="mt-4 font-body text-base leading-relaxed text-white/65 md:text-lg">
            What began as a single grill has grown into a name people trust for one thing:
            an honest, unforgettable burger, made with obsessive care every single time.
          </p>
          <p className="mt-4 font-body text-base leading-relaxed text-white/65 md:text-lg">
            From the first crackle on the grill to the last melt of cheese, our kitchen moves
            with one standard: serve it hot, make it memorable, and never compromise on taste.
          </p>
          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 font-body text-xs uppercase tracking-wide text-white/45"><span><b className="block font-display text-2xl text-brand-gold">100%</b>Fresh beef</span><span><b className="block font-display text-2xl text-brand-gold">Daily</b>Prep</span><span><b className="block font-display text-2xl text-brand-gold">Zero</b>Shortcuts</span></div>
        </div>

        {/* Right: brand photo */}
        <div ref={imageRef} className="relative">
          <div className="pointer-events-none absolute -inset-8 -z-10 red-glow" />
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/10">
            <Image
              src="/inside kitchen.png"
              alt="Inside our kitchen"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

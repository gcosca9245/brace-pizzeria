"use client";

import { useEffect, useRef } from "react";
import { Picture } from "@/components/Picture";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { getGsap } from "@/lib/gsap";

const STEPS = [
  {
    when: "Tag 1, morgens",
    title: "Der Teig ruht.",
    text: "Tipo-1-Mehl aus einer kleinen Mühle bei Neapel, 68 Prozent Wasser, Meersalz und eine Prise Hefe. Dann 48 Stunden bei vier Grad. Mehr passiert nicht, und genau das macht ihn leicht.",
  },
  {
    when: "Tag 3, 16 Uhr",
    title: "Kugeln aus der Hand.",
    text: "Jede Kugel wiegt 260 Gramm und wird von Hand geformt. Zwei Stunden bei Raumtemperatur, bis sie sich unter dem Finger weich anfühlt.",
  },
  {
    when: "Wenn du bestellst",
    title: "Neunzig Sekunden Feuer.",
    text: "Der Ofen brennt mit Buchenholz, am Boden 485 Grad. Der Rand bläht sich auf, bekommt dunkle Flecken und bleibt innen weich.",
  },
  {
    when: "Danach",
    title: "Mit dem Lastenrad zu dir.",
    text: "Unsere Fahrer fahren Lastenrad, die Box hat Luftschlitze, damit nichts weich wird. Ehrenfeld erreichen wir in unter 30 Minuten.",
  },
];

/** Prozess als echte Abfolge: Aceternity Tracing Beam als Leseführung, Foto mit leichter Parallaxe. */
export function DoughStory() {
  const photo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = photo.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const { gsap } = getGsap();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelector("img"),
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="teig"
      aria-labelledby="teig-h"
      className="dark bg-ofen text-mehl"
    >
      <div
        ref={photo}
        className="relative h-[70svh] overflow-hidden md:h-[88svh]"
      >
        <Picture
          name="room"
          alt="Der Holzofen von Brace in einer alten Backsteinhalle in Ehrenfeld, abends"
          widths={[960, 1280]}
          sizes="100vw"
          width={1280}
          height={720}
          className="absolute inset-0 h-[112%] w-full -translate-y-[6%] object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-10 md:px-10 md:pb-16">
          <h2
            id="teig-h"
            className="display mx-auto max-w-[1600px] text-[clamp(3rem,8vw,8rem)] leading-[0.9] font-[560] [text-shadow:0_2px_30px_rgb(15_12_10/0.6)]"
          >
            48 Stunden für
            <br />
            neunzig Sekunden.
          </h2>
        </div>
      </div>
      <div className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-36">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="md:sticky md:top-32">
              <p className="text-[13px] text-glut">Vom Mehl bis zur Box</p>
              <p className="display mt-3 max-w-[14ch] text-[clamp(2rem,3vw,2.8rem)] leading-[1.05] font-[560]">
                Vier Schritte, zwei Tage.
              </p>
              <p className="mt-5 max-w-[34ch] text-[16px] leading-relaxed text-mehl/70">
                Wir backen nur, was der Teig hergibt. Sind die Kugeln eines
                Abends weg, ist Schluss. Das steht dann oben im Bestellfeld.
              </p>
            </div>
          </div>
          <div className="md:col-span-8 md:pl-12">
            <TracingBeam className="max-w-2xl pl-8 md:pl-0">
              <ol className="flex flex-col gap-20">
                {STEPS.map((s) => (
                  <li key={s.title}>
                    <p className="text-[13px] text-glut">{s.when}</p>
                    <h3 className="display mt-3 text-[2.4rem] leading-tight font-[560]">
                      {s.title}
                    </h3>
                    <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-mehl/80">
                      {s.text}
                    </p>
                  </li>
                ))}
              </ol>
            </TracingBeam>
          </div>
        </div>
      </div>
    </section>
  );
}

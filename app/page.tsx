import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CoverageChecker } from "@/components/CoverageChecker";
import { business } from "@/config/business";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-zinc-950">
          <Image
            src="/images/hero-driving.jpg"
            alt=""
            fill
            // This is the largest thing above the fold, so it is the metric
            // Google measures the page on. Loading it eagerly at the right
            // size is the difference between a fast page and a slow one.
            priority
            sizes="100vw"
            // Biased upward: a centred crop of this photo keeps the dashboard
            // and loses the road through the windscreen, which is the part
            // that says anything about learning to drive.
            className="object-cover object-[center_28%]"
          />
          {/* The photo runs from bright sky to near black, so white text over
              it is unreadable in places without this. Heaviest on the left
              where the words sit, lightest on the right so the road stays
              visible. On narrow screens the text covers more of the picture,
              so it darkens from the bottom instead. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/70 to-zinc-950/30 sm:bg-gradient-to-r sm:from-zinc-950/90 sm:via-zinc-950/65 sm:to-transparent"
          />

          <div className="relative mx-auto flex min-h-[26rem] max-w-5xl flex-col justify-end px-6 py-14 sm:min-h-[30rem] sm:justify-center sm:py-20">
            <h1 className="max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {business.tagline}
            </h1>
            <p className="mt-4 max-w-lg text-lg text-zinc-200">
              {business.schoolName} runs lessons across the local area, with
              flexible booking and instructors who fit around your schedule.
            </p>
            <div className="mt-8">
              <Link
                href="/book"
                className="inline-block rounded-md bg-white px-6 py-3 font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
              >
                Book or enquire
              </Link>
            </div>
          </div>
        </section>

        <section id="prices" className="border-t border-zinc-200 bg-zinc-50 py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-2xl font-semibold">Services and prices</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {business.lessonTypes.map((lesson) => (
                <div
                  key={lesson.id}
                  className="rounded-lg border border-zinc-200 bg-white p-6"
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-semibold">{lesson.name}</h3>
                    <span className="text-lg font-semibold">
                      £{lesson.price}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">
                    {lesson.description}
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">
                    {lesson.durationMinutes} minutes
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-semibold">Coverage</h2>
          <p className="mt-2 max-w-2xl text-zinc-600">
            We pick up learners within about {business.coverageRadiusMiles} miles
            of our base. Not sure if that includes you? Check below.
          </p>
          <div className="mt-6 max-w-md">
            <CoverageChecker />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

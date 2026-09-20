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
        <section className="mx-auto max-w-5xl px-6 py-16 text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {business.tagline}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-600">
            {business.schoolName} runs lessons across the local area, with
            flexible booking and instructors who fit around your schedule.
          </p>
          <Link
            href="/book"
            className="mt-8 inline-block rounded-md bg-zinc-900 px-6 py-3 font-medium text-white hover:bg-zinc-700"
          >
            Book or enquire
          </Link>
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

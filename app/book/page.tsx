import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BookingForm } from "@/components/BookingForm";
import type { Metadata } from "next";
import { business } from "@/config/business";

export const metadata: Metadata = {
  title: "Book a lesson",
  description: `Request a driving lesson with ${business.schoolName}. Tell us the lesson type, your postcode and when suits, and we will confirm a time.`,
};

export default function BookPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-2xl font-semibold">Book or enquire</h1>
          <p className="mt-2 text-zinc-600">
            Tell us what you need and we will get back to you to confirm a
            time. This is a request, not an instant booking, so nothing is
            charged until {business.schoolName} confirms your lesson.
          </p>
          <div className="mt-8">
            <BookingForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

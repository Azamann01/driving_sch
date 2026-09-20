import { business } from "@/config/business";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 py-8 text-sm text-zinc-500">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {business.schoolName}. {business.contactEmail}, {business.contactPhone}.
        </p>
        <p>
          We do not book DVSA practical tests on your behalf. You book and
          manage your own test directly at gov.uk.
        </p>
      </div>
    </footer>
  );
}

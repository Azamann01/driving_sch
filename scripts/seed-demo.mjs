// Wipes the database and reseeds it with fictional data for the demo site.
//
//   node scripts/seed-demo.mjs
//
// Safe to re-run: it clears everything first, so a prospect who cancels a
// lesson or marks something paid cannot leave the demo looking broken.
//
// Every phone number is in Ofcom's 07700 900xxx range, which is reserved for
// fiction and can never reach a real person. Emails are all @example.com,
// reserved by the IETF for the same reason.
//
// Lesson times are relative to when this runs, so the dashboard always looks
// current rather than drifting into the past.

import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function wipe(table) {
  // PostgREST refuses an unfiltered delete, so match every row on a column
  // that is always present.
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?id=not.is.null`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(`wipe ${table}: ${res.status} ${await res.text()}`);
  console.log(`  cleared ${table}`);
}

async function insert(table, rows) {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`insert ${table}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  console.log(`  inserted ${data.length} into ${table}`);
  return data;
}

const hoursFromNow = (h) => new Date(Date.now() + h * 3_600_000).toISOString();

console.log("Clearing existing data...");
// Order matters: children before parents, or the foreign keys complain.
for (const table of ["payments", "bookings", "waiting_list", "students", "enquiries", "instructors"]) {
  await wipe(table);
}

console.log("Seeding...");

const instructors = await insert("instructors", [
  { name: "Marcus Bell", email: "marcus@example.com", phone: "07700 900101", vehicle: "Vauxhall Corsa, dual control", active: true },
  { name: "Aisha Rahman", email: "aisha@example.com", phone: "07700 900102", vehicle: "Ford Fiesta, dual control", active: true },
]);

// Open enquiries, so the first screen has something to act on.
await insert("enquiries", [
  {
    name: "Chloe Bennett", email: "chloe.bennett@example.com", phone: "07700 900201",
    postcode: "N15 4AB", lesson_type_id: "standard-1hr",
    lesson_type_name: "Standard lesson (1 hour)", price_gbp: 35, duration_minutes: 60,
    preferred_time_notes: "weekday evenings after 6",
    message: "Complete beginner, never driven before.", status: "new",
  },
  {
    name: "Daniel Osei", email: "daniel.osei@example.com", phone: "07700 900202",
    postcode: "N22 7RT", lesson_type_id: "mock-test",
    lesson_type_name: "Mock test", price_gbp: 45, duration_minutes: 60,
    preferred_time_notes: "any weekday morning",
    message: "Test booked for next month, want to check I am ready.", status: "new",
  },
  {
    name: "Priya Shah", email: "priya.shah@example.com", phone: "07700 900203",
    postcode: "N17 9BQ", lesson_type_id: "motorway",
    lesson_type_name: "Motorway lesson", price_gbp: 55, duration_minutes: 90,
    preferred_time_notes: "Saturday mornings",
    // PostgREST rejects a bulk insert where the objects have different keys,
    // so this stays explicit rather than being left out.
    message: null,
    status: "contacted",
  },
]);

const students = await insert("students", [
  { name: "Jordan Clarke", email: "jordan.clarke@example.com", phone: "07700 900301", postcode: "N17 8LP", progress_notes: "Confident on roundabouts. Needs work on parallel parking." },
  { name: "Amelia Ward", email: "amelia.ward@example.com", phone: "07700 900302", postcode: "N15 3DD", progress_notes: "Test ready, booking own DVSA slot." },
  { name: "Samuel Adeyemi", email: "samuel.adeyemi@example.com", phone: "07700 900303", postcode: "N22 5QN", progress_notes: "Six lessons in, improving steadily." },
]);

const [jordan, amelia, samuel] = students;
const [marcus, aisha] = instructors;

const bookings = await insert("bookings", [
  // Soon, so the lessons page shows its "within 2h" and "within 24h" flags.
  {
    student_id: jordan.id, instructor_id: marcus.id, lesson_type_id: "standard-2hr",
    lesson_type_name: "Standard lesson (2 hours)", price_gbp: 66, duration_minutes: 120,
    start_time: hoursFromNow(1.5), end_time: hoursFromNow(3.5),
    status: "confirmed", payment_status: "unpaid",
  },
  {
    student_id: amelia.id, instructor_id: aisha.id, lesson_type_id: "mock-test",
    lesson_type_name: "Mock test", price_gbp: 45, duration_minutes: 60,
    start_time: hoursFromNow(20), end_time: hoursFromNow(21),
    status: "confirmed", payment_status: "unpaid",
  },
  {
    student_id: samuel.id, instructor_id: marcus.id, lesson_type_id: "standard-1hr",
    lesson_type_name: "Standard lesson (1 hour)", price_gbp: 35, duration_minutes: 60,
    start_time: hoursFromNow(72), end_time: hoursFromNow(73),
    status: "confirmed", payment_status: "paid",
  },
  // A completed one, so the history is not empty either.
  {
    student_id: jordan.id, instructor_id: aisha.id, lesson_type_id: "standard-1hr",
    lesson_type_name: "Standard lesson (1 hour)", price_gbp: 35, duration_minutes: 60,
    start_time: hoursFromNow(-48), end_time: hoursFromNow(-47),
    status: "completed", payment_status: "paid",
  },
]);

await insert("payments", [
  { booking_id: bookings[3].id, amount_gbp: 35, method: "card", status: "paid", provider: "stripe", provider_reference: "cs_test_demo_reference" },
]);

await insert("waiting_list", [
  { name: "Ruth Nakamura", email: "ruth.nakamura@example.com", phone: "07700 900401", postcode: "N17 6EE", lesson_type_id: "standard-1hr", lesson_type_name: "Standard lesson (1 hour)", preferred_area: "N17", preferred_times: "weekday mornings" },
  { name: "Liam Doherty", email: "liam.doherty@example.com", phone: "07700 900402", postcode: "N22 8AG", lesson_type_id: "standard-2hr", lesson_type_name: "Standard lesson (2 hours)", preferred_area: "N22", preferred_times: "weekends only" },
]);

console.log("\nDone. Every screen now has something on it.");

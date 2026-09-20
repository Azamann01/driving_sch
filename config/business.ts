// EDIT ME: every value in this file is placeholder content.
// This is the only file you should need to touch to make the public
// site and booking form reflect your real school. Nothing here is
// read from the database, it is safe to change and redeploy any time.

export type LessonType = {
  id: string; // must match the `code` column in the lesson_types table
  name: string;
  durationMinutes: number;
  price: number; // in GBP
  description: string;
};

export const business = {
  schoolName: "TWT Driving School",
  tagline: "Learn to drive with confidence, on your terms.",
  contactEmail: "topewilson.dev@gmail.com",
  contactPhone: "07887 725353",

  // Base postcode used as the centre point for the coverage check on the
  // public page. Use the postcode of your usual start point (home, office,
  // or main pickup hub).
  basePostcode: "N17 6LD",

  // Coverage radius in miles from basePostcode. A postcode entered on the
  // public page further than this is told the school does not cover them.
  coverageRadiusMiles: 8,

  lessonTypes: [
    {
      id: "standard-1hr",
      name: "Standard lesson (1 hour)",
      durationMinutes: 60,
      price: 35,
      description: "A standard one to one lesson for learners at any stage.",
    },
    {
      id: "standard-2hr",
      name: "Standard lesson (2 hours)",
      durationMinutes: 120,
      price: 66,
      description: "A longer block, popular for covering more ground in one session.",
    },
    {
      id: "motorway",
      name: "Motorway lesson",
      durationMinutes: 90,
      price: 55,
      description: "Motorway driving practice, usually taken later in a learner's progress.",
    },
    {
      id: "mock-test",
      name: "Mock test",
      durationMinutes: 60,
      price: 45,
      description: "A full mock of the practical test to check readiness before booking.",
    },
  ] satisfies LessonType[],
} as const;

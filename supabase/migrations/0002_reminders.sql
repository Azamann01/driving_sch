-- Adds reminder tracking to bookings.
-- Run this in the Supabase SQL editor, same as 0001_init.sql.
--
-- Records when a reminder text was last sent for a lesson, so the dashboard
-- can show what has already gone out rather than the owner guessing and
-- texting a learner twice.

alter table bookings
  add column if not exists reminder_sent_at timestamptz;

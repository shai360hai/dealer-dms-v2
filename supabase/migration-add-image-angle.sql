-- Adds a viewpoint label to vehicle photos (front / rear / right / left
-- / interior) so the gallery can show them in a predictable order with
-- captions, instead of relying on upload order alone.
--
-- Run this once in Supabase → SQL Editor. Safe to re-run.
-- Existing images keep angle = null and continue to work; they simply
-- sort after the labelled ones.

alter table public.vehicle_images
  add column if not exists angle text;

comment on column public.vehicle_images.angle is
  'Viewpoint: front | rear | right | left | interior. Null for ad-hoc uploads.';

-- Ordering is driven by order_index (0 = front … 4 = interior), which
-- already exists; this index just keeps the per-vehicle sort cheap.
create index if not exists vehicle_images_vehicle_order_idx
  on public.vehicle_images (vehicle_id, order_index);

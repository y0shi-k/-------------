-- TKT-0117: Unit conversion metadata for inventory consumption.
-- Stores Canvas-compatible conversion data such as:
-- {"fromQty":1,"fromUnit":"パック","toQty":150,"toUnit":"g"}

alter table public.inventory_items
  add column if not exists unit_conversion jsonb;

alter table public.staging_items
  add column if not exists unit_conversion jsonb;

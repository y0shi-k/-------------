# Manual Smokes: TKT-0103

Status: done

## Supabase CLI

- [x] `supabase db push --dry-run` showed `20260523094705_schema_v1.sql`.
- [x] `supabase db push` applied `20260523094705_schema_v1.sql`.
- [x] `supabase db push --dry-run` showed `20260523095800_fix_composite_fk_delete_actions.sql`.
- [x] `supabase db push` applied `20260523095800_fix_composite_fk_delete_actions.sql`.
- [x] `supabase migration list` shows Local and Remote both contain `20260523094705` and `20260523095800`.

## Static Security Checks

- [x] Eight required tables are defined: `inventory_items`, `staging_items`, `shopping_items`, `recipes`, `recipe_ingredients`, `meal_schedules`, `cooking_history`, `photos`.
- [x] User-owned tables include `user_id`.
- [x] RLS is enabled for each user-owned table.
- [x] Policies use `auth.uid() = user_id`.
- [x] `photos` Storage bucket is configured as private.
- [x] Storage object policies require the first path folder to match `auth.uid()`.
- [x] No API keys, database passwords, access tokens, or real photo URLs were written to migration or artifact files.

## Dashboard Follow-up

- [ ] Optional visual check in Supabase Dashboard: tables are visible in Table Editor.
- [ ] Optional visual check in Supabase Dashboard: Authentication/RLS policy list shows owner-only policies.
- [ ] Optional visual check in Supabase Dashboard: Storage bucket `photos` is private.

## Notes

The CLI migration list is the source of truth for completion. Dashboard checks are useful for confidence, but the required remote migration application is complete.

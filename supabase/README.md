# Supabase schema

This directory is the source of truth for the Stock Master Web database.

## TKT-0103 schema v1

Migration:

- `migrations/20260523094705_schema_v1.sql`
- `migrations/20260523095800_fix_composite_fk_delete_actions.sql`

Main tables:

- `inventory_items`: user-owned ingredient and seasoning inventory.
- `staging_items`: user-owned registration candidates before inventory confirmation.
- `shopping_items`: user-owned shopping list rows.
- `recipes`: user-owned recipe headers, steps, genres, and cooking history summary.
- `recipe_ingredients`: searchable recipe ingredients and seasonings.
- `meal_schedules`: user-owned meal schedule slots.
- `cooking_history`: user-owned cooking records.
- `photos`: private Storage object metadata.

Security rules:

- All user data tables have `user_id`.
- All user data tables enable RLS.
- RLS policies use `auth.uid() = user_id`.
- The `photos` Storage bucket is private.
- Storage objects must be saved under `photos/{user_id}/...`.

## Apply

Use Supabase CLI from the repository root.

```bash
supabase db push --dry-run
supabase db push
supabase migration list
```

Do not write API keys, database passwords, access tokens, or real photo URLs in this directory.

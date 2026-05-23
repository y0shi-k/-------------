-- TKT-0103 follow-up: keep user_id stable when optional parent rows are deleted.

alter table public.meal_schedules
  drop constraint if exists meal_schedules_recipe_id_user_id_fkey,
  add constraint meal_schedules_recipe_id_user_id_fkey
  foreign key (recipe_id, user_id)
  references public.recipes(id, user_id)
  on delete set null (recipe_id);

alter table public.cooking_history
  drop constraint if exists cooking_history_recipe_id_user_id_fkey,
  add constraint cooking_history_recipe_id_user_id_fkey
  foreign key (recipe_id, user_id)
  references public.recipes(id, user_id)
  on delete set null (recipe_id);

alter table public.cooking_history
  drop constraint if exists cooking_history_meal_schedule_id_user_id_fkey,
  add constraint cooking_history_meal_schedule_id_user_id_fkey
  foreign key (meal_schedule_id, user_id)
  references public.meal_schedules(id, user_id)
  on delete set null (meal_schedule_id);

alter table public.photos
  drop constraint if exists photos_cooking_history_id_user_id_fkey,
  add constraint photos_cooking_history_id_user_id_fkey
  foreign key (cooking_history_id, user_id)
  references public.cooking_history(id, user_id)
  on delete set null (cooking_history_id);

-- TKT-0194: Keep zero-quantity inventory as restorable archive rows.
-- `inventory_items` keeps the original row so photos and cooking event links
-- remain intact. Normal lists filter `archived_at is null`.

alter table public.inventory_items
  add column if not exists archived_at timestamptz,
  add column if not exists archived_reason text;

create index if not exists inventory_items_user_archived_idx
  on public.inventory_items (user_id, archived_at desc)
  where archived_at is not null;

update public.inventory_items
set archived_at = coalesce(archived_at, updated_at, now()),
    archived_reason = coalesce(archived_reason, 'zero_quantity_existing')
where quantity = 0
  and archived_at is null;

create or replace function public.prune_inventory_item_archives()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.archived_at is null then
    return new;
  end if;

  delete from public.inventory_items old_archive
  where old_archive.user_id = new.user_id
    and old_archive.archived_at is not null
    and old_archive.id in (
      select id
      from public.inventory_items
      where user_id = new.user_id
        and archived_at is not null
      order by archived_at desc, updated_at desc
      offset 50
    );

  return new;
end;
$$;

drop trigger if exists prune_inventory_item_archives on public.inventory_items;
create trigger prune_inventory_item_archives
after insert or update of archived_at on public.inventory_items
for each row execute function public.prune_inventory_item_archives();

comment on column public.inventory_items.archived_at is
  'When set, the item is hidden from normal inventory and shown in the latest restorable zero-stock history.';
comment on column public.inventory_items.archived_reason is
  'Reason for archive, for example manual_zero or cooking_zero.';

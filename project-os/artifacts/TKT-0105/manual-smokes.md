# TKT-0105 Manual Smokes

Status: passed with limited live-login coverage

## Browser Checks

- Started the Next.js dev server at `http://localhost:3000`.
- Opened `/` while signed out in the in-app browser and confirmed it redirected to `/login`.
- Confirmed the protected app does not render inventory data before login.

## Automated UI Coverage

- Rendering test confirms the `在庫と登録待ち` section shows staging and inventory items.
- Form test confirms manual staging insert sends `user_id`, name, quantity, and unit to `staging_items`.
- Confirmation test verifies a staging item is inserted into `inventory_items` and then deleted from `staging_items`.

## Not Covered Live

- Real authenticated add/edit/delete was not executed against the connected Supabase project to avoid touching live personal data.
- Smartphone physical-device testing remains a user-side check before production use.

## Manual User Checklist

- [ ] Login with the existing Supabase user.
- [ ] Add one safe test staging item.
- [ ] Edit that staging item.
- [ ] Confirm it into inventory.
- [ ] Edit the inventory item.
- [ ] Delete the test inventory item.
- [ ] Confirm mobile width has no horizontal overflow and buttons are easy to tap.

## Security Notes

- All app writes set `user_id` from the authenticated `user.id`; the form never accepts `user_id`.
- Writes still go through existing Supabase RLS policies from TKT-0103.
- No Storage upload, AI call, GAS call, Spreadsheet call, or Drive call was added.

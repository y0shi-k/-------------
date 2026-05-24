# TKT-0106 Review

Status: review_ready

## Findings

- No blocking findings.

## Security Review

- Storage uploads use the existing private `photos` bucket.
- Storage paths are generated from the authenticated `userId` prop and start with `{userId}/ingredient-scan/`.
- The UI does not accept or expose a user-editable Storage owner ID.
- No `getPublicUrl` call or public URL creation was added.
- `photos` table inserts include `user_id`, `bucket_id`, `storage_path`, `usage_type`, `content_type`, `byte_size`, `width`, and `height`.
- If the metadata insert fails after upload, the uploaded object is removed to avoid leaving an orphan photo.
- No Gemini API call, API key literal, Supabase service-role literal, GAS, Spreadsheet, or Drive dependency was added.

## Residual Risk

- Physical iPhone Safari and Android Chrome camera behavior must be checked by the user because the local automated test environment cannot open device cameras.
- Browser image compression relies on Canvas. Very unusual image formats may fail and will show the compression error message.
- EXIF orientation normalization is not explicitly handled in this ticket.

## Checked Diff Paths

- `web/src/components/inventory-board.tsx`
- `web/src/lib/photos/compress.ts`
- `web/src/app/globals.css`
- `web/src/__tests__/inventory-board.test.tsx`
- `project-os/artifacts/TKT-0106/`

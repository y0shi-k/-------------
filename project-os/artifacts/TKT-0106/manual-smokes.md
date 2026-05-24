# TKT-0106 Manual Smokes

Status: passed with simulated browser coverage; physical-device checks remain for the user

## Browser Checks

- Confirmed the app still builds as a protected Next.js app.
- Confirmed the photo area replaces the TKT-0105 placeholder with a camera/file input.
- Confirmed selected images show an in-page preview before upload in automated UI coverage.
- Confirmed the retake action clears the preview and returns to the empty photo state in automated UI coverage.

## Automated UI Coverage

- Rendering test confirms the `写真を撮る` input is present.
- File selection test confirms preview rendering and the `別の写真にする` reset path.
- Upload test confirms the image is compressed, uploaded to the private `photos` bucket path, and recorded in the `photos` table with `usage_type: ingredient_scan`.
- Error test confirms Storage upload failure shows an in-page message with cause, impact, and fix guidance.

## Manual User Checklist

- [ ] iPhone Safari: login, tap `写真を撮る`, take a photo, confirm preview appears.
- [ ] iPhone Safari: tap `別の写真にする`, confirm the preview clears.
- [ ] iPhone Safari: save a safe test photo and confirm success message.
- [ ] Android Chrome: repeat capture, preview, retake, and save.
- [ ] Mobile width: confirm no horizontal overflow and buttons are easy to tap.
- [ ] Supabase: confirm the uploaded object path starts with the logged-in user ID and the `photos` bucket is not public.

## Security Notes

- Photos may contain personal information, so no public URL is generated.
- The browser stores only the compressed upload result in Supabase Storage.
- AI analysis is not called in this ticket.
- No API key, Supabase secret, GAS, Spreadsheet, or Drive dependency was added.

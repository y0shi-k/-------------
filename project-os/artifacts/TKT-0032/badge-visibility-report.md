# Badge Visibility Follow-up

## Summary

- `+` button staging badge now uses a rose notification color with a white ring.
- Storage location count badges now use the same rose notification treatment with a white ring.
- Location tab padding was adjusted so the absolute-positioned badge does not overlap tab text.
- The storage location tab row now has top padding so notification badges are not clipped by the horizontal scroll container.
- The top shopping-list tab now shows an unread-style badge for unpurchased shopping items.

## Verification

- `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
- `rg -n "alert\\(|confirm\\(|prompt\\(" app.html`
- `rg -n "executeGAS\\(payload" app.html`

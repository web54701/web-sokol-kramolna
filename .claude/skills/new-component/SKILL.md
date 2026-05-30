---
name: new-component
description: Scaffold a new React component with a paired CSS file following project conventions
---

Create a new React functional component at `src/components/<ComponentName>/<ComponentName>.tsx`
with a paired `<ComponentName>.css`. Follow these conventions:
- Use CSS custom properties from index.css for all colors/spacing (--accent, --bg, --border, etc.)
- Dark mode is handled automatically via the existing @media block — don't add separate dark styles
- Export the component as default
- No prop types needed unless the caller's usage makes them obvious

Component name: $ARGUMENTS

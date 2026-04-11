Create privacy policy and terms of service pages for CortexMD.

Files to create:
1. src/app/privacy/page.tsx — renders Privacy Policy markdown
2. src/app/terms/page.tsx — renders Terms of Service markdown
3. src/content/privacy-policy.md — source content (English)
4. src/content/terms-of-service.md — source content (English)

Both pages should:
- Use the same dark glassmorphism style as the rest of CortexMD
- Be readable (max-width 720px, comfortable line-height, proper spacing)
- Be linked from the auth page footer
- Be linked from the main app footer (when one exists)
- Use react-markdown to render the .md files

The content of both .md files will be provided by Yura — for now use 
placeholders and confirm the structure is ready.

Also update:
- src/app/auth/page.tsx — add a required checkbox before the Sign up 
  button: "I've read and agree to the Privacy Policy and Terms of 
  Service" with both terms linked. Sign up button disabled until checked.
- Translation files en.json, ru.json, uk.json — add the consent 
  checkbox text in 3 languages.

For now, only English version of the legal docs. Russian and Ukrainian 
translations will be added later (legal translation requires care).

Build + typecheck + STOP.
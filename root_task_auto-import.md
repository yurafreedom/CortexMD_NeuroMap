Add to CLAUDE.md in the project root a new section about task auto-import:

## Task tracking auto-import

After completing each task and before saying "STOP", run this curl 
command to push the completion report into the admin tasker:

curl -X POST http://localhost:3000/api/admin/tasks/import \
  -H "Content-Type: application/json" \
  -H "Cookie: $CORTEXMD_ADMIN_COOKIE" \
  -d "$(jq -n \
    --arg text "$COMPLETION_REPORT" \
    '{source: "claude-code", report_text: $text, auto_categorize: true, mark_done: true}')"

Where $COMPLETION_REPORT is the text of the task report (the same 
text shown to the user). The cookie $CORTEXMD_ADMIN_COOKIE must be 
set as an environment variable before running — Yura provides it 
separately via .env.local or shell export.

If the curl call fails silently (network issue, wrong cookie), do NOT 
block the task completion. Log the error but still say "STOP" as 
normal. Auto-import is best-effort, not a blocker.

Production URL: replace localhost:3000 with https://cortexmd-next.vercel.app 
when working against production.
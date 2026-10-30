# Fortnightly Google Sheets reports

- Spreadsheet: https://docs.google.com/spreadsheets/d/1yXkvJBhuvcl8whJOGAc57Fa86uNOvXzbj0JKIE2PbwQ/edit
- n8n workflow: **PERLA Fortnightly Google Sheets Report**, in **Perla Virtual Wardrobe**, at https://raimzhanov.app.n8n.cloud/workflow/ROvH93Z4FaM6vPsU
- Schedule: every **14 days**, on alternate Fridays at **06:15 UTC**, starting **November 13, 2026** (then November 27, December 11, and so on). The immediate report is October 30, 2026. Manual execution uses the editor's **Send report now** trigger.
- A Friday trigger feeds an anchored **Fortnightly date gate**. It returns no items on off-weeks; this prevents premature November 6 updates and keeps the schedule stable when republished. Manual triggers bypass the date gate.
- The workflow makes one POST to `https://studioperla.live/api/public/insights/sheets`, authenticated with the existing **Supabase account 2** n8n credential. Never paste keys into node parameters.
- Google Sheets authentication stays in the linked Lovable **Nursultan's Google Sheets** connection; the app writes through the connector gateway. There is no additional n8n Google OAuth setup.

## Report contents

1. **Overview**: registered members, weekly active try-on customers, completed try-ons, distinct products, created images, likes and survey counts, with definitions.
2. **Brand products**: brand, name, category, style, completed try-ons, unique customers, likes, survey participation, fit concerns and customer preferences.
3. **Personal products**: anonymized uploaded-product labels, known category, self-reported source, feedback and interest in similar pieces. Unknown brands stay “Not supplied.”
4. **Survey feedback**: counts and percentages for each response, grouped by product and question—not identifiable customer rows.
5. **Brand summary**: deduplicated customers and product demand by brand; wardrobe intent is not a measured sales conversion.
6. **Insights**: observed feedback trends, visual fit concerns, Shadow Wardrobe categories and any saved AI narrative with its report date.
7. **Weekly history**: one snapshot per UTC week. Monday reports cover the previous full week; on other days manual tests cover the current partial week. Repeating a report updates its week instead of duplicating it.

Latest product and feedback tabs are cumulative; weekly columns and history retain their labelled UTC-week measurement period (the delivery cadence is now fortnightly). **PERLA Fortnightly Brand Insights & Style DNA** remains separate, scheduled on the same alternate Fridays at **06:00 UTC**. Its **Run insights now** trigger starts an immediate Gemini update. Failure of AI analysis does not prevent the Sheets export of real numbers.

## Privacy and reliability

- Surveys already persist in `feedback_answers`; the report does not replace or change collection.
- No customer names, emails, IDs, private photos, access links or uploaded filenames are written to Sheets.
- Catalog product IDs are deduplicated across customer-specific product snapshots.
- Failed, deleted, video and Studio jobs are excluded from survey/try-on metrics; Studio photos count toward total created images.
- Data reads paginate; writes use batches and `RAW` values so responses cannot execute spreadsheet formulas.
- Fewer than three fit answers yields “Insufficient feedback.” Fit concerns describe perceived silhouette—not measured physical fit or returns.
- The callback rejects unauthenticated requests and accepts no report destination or data supplied by callers.
- Future app changes must be published before this fixed production callback uses them. n8n schedule changes must also be published in n8n.
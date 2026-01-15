# Minimalist Privacy Tool Redesign

## Frontend Changes
- [x] Remove Dashboard page - start directly on Search page
- [x] Remove Accounts page (no account tracking/management)
- [x] Simplify Results page:
  - [x] Remove tier badges and detailed confidence explanations
  - [x] Add simple "How we found this" tooltip instead
  - [x] Show: Platform icon, username, direct link, delete button
  - [x] Keep confirm/deny buttons for filtering report
  - [x] Remove "False Positives" section (just hide denied accounts)
- [x] Simplify Search page:
  - [x] Remove stats cards
  - [x] Just show: input field, search button, progress bar
  - [x] Show results inline as they arrive
- [x] Update navigation: Remove Dashboard and Accounts links
- [x] Simplify export: Just confirmed accounts in report (CSV/JSON)

## Backend Changes
- [x] Backend is already minimal - status tracking needed for confirm/deny
- [x] API endpoints are focused on search and results
- [x] No changes needed - backend architecture supports privacy tool use case

## Design
- [ ] Maintain dark minimalist theme with cyan accents
- [ ] Focus on clean, privacy-focused messaging
- [ ] Remove all "management" language - this is a discovery tool

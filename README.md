# JV Dashboard — Google Sheets API Version

This version removes Apps Script and reads the Google Sheet directly through the official Google Sheets API.

## Setup

1. In Google Cloud Console, create/select a project.
2. Enable **Google Sheets API**.
3. Create an **API key**.
4. Restrict the API key:
   - Application restriction: HTTP referrers
   - Add: `https://tiwarisagar2910-lab.github.io/*`
   - API restriction: Google Sheets API
5. In `config.js`, replace:
   `PASTE_YOUR_GOOGLE_SHEETS_API_KEY_HERE`
   with your API key.
6. Commit/push these files to GitHub Pages.

## Important

Your Google Sheet must be viewable by the API key. For a public wedding dashboard, the simplest setup is:
- Share the Google Sheet as **Anyone with the link can view**
- Only give edit access to trusted family members separately

Dashboard URL:
https://tiwarisagar2910-lab.github.io/JV/

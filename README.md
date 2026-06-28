# JV | Jyoti Weds Vaibhav Dashboard

This is a static live dashboard connected to your Google Sheet via Google Apps Script.

## Files

- `index.html` — main dashboard page
- `styles.css` — visual design
- `app.js` — dashboard logic
- `config.js` — Apps Script API URL

## How to run locally

Open this folder in Terminal and run:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

Do not use `file://` if the browser blocks API requests.

## How to deploy

Upload these files to GitHub Pages, Netlify, or Vercel.

## Data source

Google Apps Script Web App:
https://script.google.com/macros/s/AKfycbyq62KADMRurvs1rF7kxeK-M9R_Hi5umuNqa4klVcgP1omWu60Csaoqas8FydJGY79WWQ/exec

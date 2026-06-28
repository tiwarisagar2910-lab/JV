const CONFIG = {
  spreadsheetId: "1NQOVXmsPdEb3VvGHgDaZfrIao-2azJ_08v97xi2_1xc",

  // Add your Google Cloud API key here.
  // Enable Google Sheets API in Google Cloud first.
  apiKey: "PASTE_YOUR_GOOGLE_SHEETS_API_KEY_HERE",

  autoRefreshMs: 60000,

  // These are the source tab names in your Google Sheet.
  ranges: {
    events: "Events!A1:Z",
    guests: "Guest List!A1:Z",
    rooms: "Accomodation!A1:Z",
    vendors: "Vendor list!A1:Z",
    budget: "Budget!A1:Z",
    tasks: "Tasks!A1:Z",
    dashboard: "Dashboard!A1:Z"
  }
};

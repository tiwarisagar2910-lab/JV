let DATA = {
  events: [],
  tasks: [],
  rooms: [],
  guests: [],
  vendors: [],
  budget: [],
  dashboard: []
};

const tabs = ["Dashboard", "Events", "Tasks", "Accommodation", "Guests", "Vendors", "Budget"];

function initNav() {
  const nav = document.getElementById("nav");

  tabs.forEach((tab, idx) => {
    const btn = document.createElement("button");
    btn.textContent = tab;

    if (idx === 0) btn.classList.add("active");

    btn.onclick = () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
      document.getElementById(tab).classList.add("active");
      btn.classList.add("active");
    };

    nav.appendChild(btn);
  });
}

async function loadDashboard() {
  try {
    if (!CONFIG.apiKey || CONFIG.apiKey.includes("PASTE_YOUR")) {
      throw new Error("Missing Google Sheets API key in config.js");
    }

    document.getElementById("syncStatus").textContent = "Syncing...";

    const rangeEntries = Object.entries(CONFIG.ranges);
    const rangeParams = rangeEntries
      .map(([_, range]) => "ranges=" + encodeURIComponent(range))
      .join("&");

    const url =
      "https://sheets.googleapis.com/v4/spreadsheets/" +
      CONFIG.spreadsheetId +
      "/values:batchGet?" +
      rangeParams +
      "&majorDimension=ROWS&key=" +
      encodeURIComponent(CONFIG.apiKey);

    const response = await fetch(url);

    if (!response.ok) {
      const message = await response.text();
      throw new Error("Google Sheets API HTTP " + response.status + ": " + message);
    }

    const payload = await response.json();

    DATA = {};
    payload.valueRanges.forEach((vr, index) => {
      const key = rangeEntries[index][0];
      DATA[key] = rowsToObjects(vr.values || []);
    });

    document.getElementById("syncStatus").textContent = "Live connected";
    document.getElementById("lastUpdated").textContent = "Last synced: " + new Date().toLocaleString();
    document.getElementById("errorBox").style.display = "none";

    renderAll();
  } catch (error) {
    document.getElementById("syncStatus").textContent = "Sync failed";

    const box = document.getElementById("errorBox");
    box.style.display = "block";
    box.textContent = error.message;
  }
}

function rowsToObjects(values) {
  if (!values || values.length < 2) return [];

  const headers = values[0].map(h => String(h || "").trim());

  return values
    .slice(1)
    .filter(row => row.some(cell => cell !== ""))
    .map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        if (header) obj[header] = row[i] || "";
      });
      return obj;
    });
}

function renderAll() {
  const events = DATA.events || [];
  const tasks = DATA.tasks || [];
  const rooms = DATA.rooms || [];
  const guests = DATA.guests || [];
  const vendors = DATA.vendors || [];
  const budget = DATA.budget || [];

  setText("statEvents", events.length);
  setText("statTasks", tasks.length);
  setText("statRooms", rooms.length);
  setText("statGuests", guests.length);
  setText("statVendors", vendors.length);
  setText("statBudget", budget.length);

  renderTimeline(events);
  renderTable("eventsTable", events);
  renderTable("tasksTable", tasks);
  renderTable("roomsTable", rooms);
  renderTable("vendorsTable", vendors);
  renderTable("budgetTable", budget);
  renderGuests(guests);
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function renderTimeline(events) {
  const el = document.getElementById("dashboardTimeline");
  const list = events.slice(0, 10);

  if (!list.length) {
    el.innerHTML = "<p>No events found yet.</p>";
    return;
  }

  el.innerHTML = list.map(e => `
    <div class="event">
      <h3>${safe(e["Event Name"] || e["Event"] || e["Source Task"] || e["Task"] || "Event")}</h3>
      <div>${safe(e["Day"] || "")} ${safe(e["Date"] || "")} ${safe(e["Time"] || e["Start Time"] || "")}</div>
      <small>${safe(e["Venue"] || e["Stage"] || e["Notes"] || "")}</small>
    </div>
  `).join("");
}

function renderGuests(guests) {
  const search = document.getElementById("guestSearch");

  const render = () => {
    const query = search.value.toLowerCase();
    const filtered = guests.filter(g => JSON.stringify(g).toLowerCase().includes(query));
    renderTable("guestsTable", filtered);
  };

  search.oninput = render;
  render();
}

function renderTable(id, rows) {
  const el = document.getElementById(id);

  if (!rows || !rows.length) {
    el.innerHTML = "<p>No data found yet.</p>";
    return;
  }

  const keys = Object.keys(rows[0]);

  el.innerHTML = `
    <table>
      <thead>
        <tr>${keys.map(k => `<th>${safe(k)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>${keys.map(k => `<td>${formatCell(k, row[k])}</td>`).join("")}</tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function formatCell(key, value) {
  const text = safe(value);

  if (String(key).toLowerCase().includes("status")) {
    const cls = "status-" + String(text).toLowerCase().replace(/\s+/g, "-");
    return `<span class="pill ${cls}">${text}</span>`;
  }

  return text;
}

function safe(value) {
  if (value === null || value === undefined) return "";

  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

initNav();
loadDashboard();
setInterval(loadDashboard, CONFIG.autoRefreshMs);

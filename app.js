let DATA = {
  events: [],
  tasks: [],
  rooms: [],
  guests: [],
  vendors: [],
  budget: [],
  dashboard: []
};

let DEBUG = [];

const tabs = ["Dashboard", "Events", "Tasks", "Accommodation", "Guests", "Vendors", "Budget", "Debug"];

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
    DEBUG = [];
    document.getElementById("syncStatus").textContent = "Syncing...";

    const entries = Object.entries(CONFIG.sheets);
    const results = await Promise.all(
      entries.map(([key, sheetName]) => loadSheetJsonp(sheetName).then(rows => [key, rows]))
    );

    DATA = Object.fromEntries(results);

    document.getElementById("syncStatus").textContent = "Live connected";
    document.getElementById("lastUpdated").textContent = "Last synced: " + new Date().toLocaleString();
    document.getElementById("errorBox").style.display = "none";

    renderAll();
    renderDebug();
  } catch (error) {
    document.getElementById("syncStatus").textContent = "Sync failed";

    const box = document.getElementById("errorBox");
    box.style.display = "block";
    box.textContent = error.message || "Load failed";

    DEBUG.push({ type: "error", message: error.message || "Load failed" });
    renderDebug();
  }
}

function loadSheetJsonp(sheetName) {
  return new Promise((resolve, reject) => {
    const callbackName = "jvGviz_" + Math.random().toString(36).slice(2) + "_" + Date.now();

    const url =
      "https://docs.google.com/spreadsheets/d/" +
      CONFIG.spreadsheetId +
      "/gviz/tq?tqx=" +
      encodeURIComponent("out:json;responseHandler:" + callbackName) +
      "&sheet=" +
      encodeURIComponent(sheetName) +
      "&t=" +
      Date.now();

    DEBUG.push({ type: "request", sheetName, url });

    let done = false;
    const script = document.createElement("script");

    const timeout = setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error("Timed out loading sheet tab: " + sheetName));
    }, 15000);

    window[callbackName] = function(payload) {
      if (done) return;
      done = true;
      clearTimeout(timeout);

      try {
        const rows = parseGoogleVisualizationPayload(payload, sheetName);
        DEBUG.push({ type: "success", sheetName, rowCount: rows.length });
        resolve(rows);
      } catch (err) {
        reject(err);
      } finally {
        cleanup();
      }
    };

    script.onerror = function() {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      cleanup();
      reject(new Error("Script load failed for sheet tab: " + sheetName));
    };

    function cleanup() {
      try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    script.src = url;
    document.body.appendChild(script);
  });
}

function parseGoogleVisualizationPayload(json, sheetName) {
  if (!json || json.status === "error") {
    const message = json && json.errors && json.errors[0]
      ? json.errors[0].detailed_message || json.errors[0].message
      : "Unknown error";
    throw new Error("Google Visualization API error for " + sheetName + ": " + message);
  }

  const cols = (json.table.cols || []).map((col, idx) => {
    return col.label || col.id || ("Column " + (idx + 1));
  });

  const rows = json.table.rows || [];

  return rows
    .map(row => {
      const obj = {};
      cols.forEach((header, i) => {
        const cell = row.c && row.c[i] ? row.c[i] : null;
        obj[header] = cell ? (cell.f || cell.v || "") : "";
      });
      return obj;
    })
    .filter(row => Object.values(row).some(value => value !== ""));
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

function renderDebug() {
  const box = document.getElementById("debugBox");
  if (!box) return;

  const summary = {
    version: "visualization-api-jsonp-v3",
    source: "Google Visualization API JSONP",
    spreadsheetId: CONFIG.spreadsheetId,
    configuredSheets: CONFIG.sheets,
    loadedCounts: {
      events: (DATA.events || []).length,
      tasks: (DATA.tasks || []).length,
      rooms: (DATA.rooms || []).length,
      guests: (DATA.guests || []).length,
      vendors: (DATA.vendors || []).length,
      budget: (DATA.budget || []).length,
      dashboard: (DATA.dashboard || []).length
    },
    log: DEBUG
  };

  box.textContent = JSON.stringify(summary, null, 2);
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function renderTimeline(events) {
  const el = document.getElementById("dashboardTimeline");
  const list = events.slice(0, 12);

  if (!list.length) {
    el.innerHTML = "<p>No events found yet.</p>";
    return;
  }

  el.innerHTML = list.map(e => `
    <div class="event">
      <h3>${safe(e["Event Name"] || e["Event"] || e["Source Task"] || e["Task"] || Object.values(e)[0] || "Event")}</h3>
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

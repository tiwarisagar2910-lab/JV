let DATA = {
  events: [],
  tasks: [],
  rooms: [],
  meals: [],
  guests: [],
  vendors: [],
  budget: [],
  dashboard: [],
  metadata: []
};

const tabs = ["Dashboard", "Events", "Tasks", "Accommodation", "Meals", "Guests", "Vendors", "Budget"];

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
    document.getElementById("syncStatus").textContent = "Syncing...";

    const response = await fetch(CONFIG.apiUrl + "?v=" + Date.now());

    if (!response.ok) {
      throw new Error("API returned HTTP " + response.status);
    }

    DATA = await response.json();

    document.getElementById("syncStatus").textContent = "Live connected";
    document.getElementById("lastUpdated").textContent = "Last synced: " + new Date().toLocaleString();
    document.getElementById("errorBox").style.display = "none";

    renderAll();
  } catch (error) {
    document.getElementById("syncStatus").textContent = "Sync failed";

    const box = document.getElementById("errorBox");
    box.style.display = "block";
    box.textContent = "Could not load Google Sheet data: " + error.message;
  }
}

function renderAll() {
  const events = DATA.events || [];
  const tasks = DATA.tasks || [];
  const rooms = DATA.rooms || [];
  const meals = DATA.meals || [];
  const guests = DATA.guests || [];
  const vendors = DATA.vendors || [];
  const budget = DATA.budget || [];

  setText("statEvents", events.length);
  setText("statTasks", tasks.length);
  setText("statRooms", rooms.length);
  setText("statMeals", meals.length);
  setText("statGuests", guests.length);
  setText("statVendors", vendors.length);

  renderTimeline(events);
  renderTable("eventsTable", events);
  renderTable("tasksTable", tasks);
  renderRooms(rooms);
  renderTable("mealsTable", meals);
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
      <h3>${safe(e["Event Name"] || e["Event"] || e["Source Task"] || "Event")}</h3>
      <div>${safe(e["Day"] || "")} ${safe(e["Date"] || "")} ${safe(e["Time"] || e["Start Time"] || "")}</div>
      <small>${safe(e["Venue"] || e["Stage"] || e["Notes"] || "")}</small>
    </div>
  `).join("");
}

function renderRooms(rooms) {
  const el = document.getElementById("roomsGrid");

  if (!rooms.length) {
    el.innerHTML = "<p>No rooms found yet.</p>";
    return;
  }

  el.innerHTML = rooms.map(r => `
    <div class="room-card">
      <h3>${safe(r["Room ID"] || r["Room Number"] || r["Room Type"] || "Room")}</h3>
      <div><b>Floor:</b> ${safe(r["Floor"] || "")}</div>
      <div><b>Type:</b> ${safe(r["Room Type"] || "")}</div>
      <div><b>Qty:</b> ${safe(r["Qty"] || "")}</div>
      <div><b>Capacity:</b> ${safe(r["Capacity"] || "")}</div>
      <div><b>Day:</b> ${safe(r["Day"] || "")}</div>
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

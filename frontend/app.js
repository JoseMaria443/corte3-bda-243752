const API_BASE = (() => {
  if (window.location.protocol === "file:") {
    return "http://localhost:8080/api";
  }

  if (window.location.port === "3000" || window.location.hostname === "localhost") {
    return "/api";
  }

  return "http://localhost:8080/api";
})();

const profiles = {
  vet_pablo: {
    displayName: "Pablo",
    role: "rol_veterinario",
    label: "Veterinario"
  },
  recepcion_maria: {
    displayName: "Maria",
    role: "rol_recepcion",
    label: "Recepcion"
  },
  admin_ana: {
    displayName: "Ana",
    role: "rol_admin",
    label: "Administrador"
  }
};

const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const profileGrid = document.getElementById("profileGrid");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const enterBtn = document.getElementById("enterBtn");
const logoutBtn = document.getElementById("logoutBtn");
const sessionInfo = document.getElementById("sessionInfo");
const welcomeTitle = document.getElementById("welcomeTitle");
const welcomeSubtitle = document.getElementById("welcomeSubtitle");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchLatency = document.getElementById("searchLatency");
const searchResults = document.getElementById("searchResults");

const pendingBtnVet = document.getElementById("pendingBtnVet");
const pendingLatencyVet = document.getElementById("pendingLatencyVet");
const pendingResultsVet = document.getElementById("pendingResultsVet");

const pendingBtnRecepcion = document.getElementById("pendingBtnRecepcion");
const pendingLatencyRecepcion = document.getElementById("pendingLatencyRecepcion");
const pendingResultsRecepcion = document.getElementById("pendingResultsRecepcion");

const opsVeterinario = document.getElementById("opsVeterinario");
const opsRecepcion = document.getElementById("opsRecepcion");
const applyVacunaBtn = document.getElementById("applyVacunaBtn");

function saveSession(session) {
  localStorage.setItem("app.session", JSON.stringify(session));
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem("app.session") || "null");
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem("app.session");
}

function getActiveProfileKey(eventTarget) {
  return eventTarget.closest(".profile-card")?.dataset.profile ?? null;
}

function markSelectedProfile(profileKey) {
  profileGrid.querySelectorAll(".profile-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.profile === profileKey);
  });
}

function renderLoginState() {
  const session = readSession();
  const isAuthenticated = Boolean(session);

  loginView.classList.toggle("hidden", isAuthenticated);
  dashboardView.classList.toggle("hidden", !isAuthenticated);

  if (!session) {
    sessionInfo.textContent = "Selecciona un perfil para ingresar.";
    welcomeTitle.textContent = "";
    welcomeSubtitle.textContent = "";
    return;
  }

  const profile = profiles[session.profileKey];
  const isVet = profile.role === "rol_veterinario";
  const isAdmin = profile.role === "rol_admin";

  welcomeTitle.textContent = `Bienvenido, ${profile.displayName}`;
  welcomeSubtitle.textContent = `Perfil activo: ${profile.label}`;
  sessionInfo.textContent = `${profile.displayName} listo para operar.`;

  opsVeterinario.classList.toggle("hidden", !(isVet || isAdmin));
  opsRecepcion.classList.toggle("hidden", isVet && !isAdmin);
  applyVacunaBtn.disabled = !(isVet || isAdmin);

  const selectedProfile = profileGrid.querySelector(`[data-profile="${session.profileKey}"]`);
  if (selectedProfile) {
    markSelectedProfile(session.profileKey);
  }
}

function headersWithContext() {
  const session = readSession();
  if (!session) {
    return { "Content-Type": "application/json" };
  }

  const profile = profiles[session.profileKey];
  const headers = {
    "Content-Type": "application/json",
    "x-rol": profile.role
  };

  if (profile.role === "rol_veterinario") {
    headers["x-vet-id"] = String(session.vetId ?? 1);
  }

  return headers;
}

function renderRows(tbody, rows, columns) {
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="${columns.length}">Sin resultados</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map((row) => {
      const cells = columns.map((col) => `<td>${row[col] ?? "-"}</td>`).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const body = await response.text();
    throw new Error(`La API devolvio una respuesta no JSON (${response.status}). Revisa que el backend este activo y que la ruta ${url} exista.`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Operacion fallida");
  }

  return data;
}

async function buscarMascotas() {
  const start = performance.now();

  try {
    const q = encodeURIComponent(searchInput.value || "");
    const data = await fetchJson(`${API_BASE}/mascotas/buscar?q=${q}`, {
      method: "GET",
      headers: headersWithContext()
    });

    const elapsed = (performance.now() - start).toFixed(2);
    searchLatency.textContent = `Tiempo: ${elapsed} ms`;
    renderRows(searchResults, data, ["id", "nombre", "especie", "fecha_nacimiento", "dueno_id"]);
  } catch (error) {
    searchLatency.textContent = `Error: ${error.message}`;
    renderRows(searchResults, [], ["id", "nombre", "especie", "fecha_nacimiento", "dueno_id"]);
  }
}

async function cargarPendientes(tbody, latencyNode) {
  const start = performance.now();

  try {
    const data = await fetchJson(`${API_BASE}/vacunas/pendientes`, {
      method: "GET",
      headers: headersWithContext()
    });

    const elapsed = (performance.now() - start).toFixed(2);
    latencyNode.textContent = `Tiempo: ${elapsed} ms`;
    renderRows(tbody, data, [
      "nombre_mascota",
      "especie",
      "nombre_dueno",
      "telefono_dueno",
      "fecha_ultima_vacuna",
      "dias_desde_ultima_vacuna",
      "estado_vacunacion"
    ]);
  } catch (error) {
    latencyNode.textContent = `Error: ${error.message}`;
    renderRows(tbody, [], [
      "nombre_mascota",
      "especie",
      "nombre_dueno",
      "telefono_dueno",
      "fecha_ultima_vacuna",
      "dias_desde_ultima_vacuna",
      "estado_vacunacion"
    ]);
  }
}

async function aplicarVacunaDemo() {
  const session = readSession();
  if (!session) {
    return;
  }

  await fetchJson(`${API_BASE}/vacunas/aplicar`, {
    method: "POST",
    headers: headersWithContext(),
    body: JSON.stringify({
      mascotaId: 1,
      vacunaId: 1,
      costoCobrado: 350
    })
  });

  await cargarPendientes(pendingResultsVet, pendingLatencyVet);
}

function loginWithProfile(profileKey) {
  const profile = profiles[profileKey];
  if (!profile) {
    return;
  }

  const session = {
    profileKey,
    vetId: profile.role === "rol_admin" ? 1 : profile.role === "rol_veterinario" ? 1 : null,
    username: usernameInput.value.trim() || profile.displayName,
    password: passwordInput.value.trim() || "demo"
  };

  saveSession(session);
  renderLoginState();

  if (profile.role === "rol_veterinario" || profile.role === "rol_admin") {
    cargarPendientes(pendingResultsVet, pendingLatencyVet);
  }

  if (profile.role === "rol_recepcion" || profile.role === "rol_admin") {
    cargarPendientes(pendingResultsRecepcion, pendingLatencyRecepcion);
  }
}

profileGrid.addEventListener("click", (event) => {
  const profileKey = getActiveProfileKey(event.target);
  if (!profileKey) {
    return;
  }

  markSelectedProfile(profileKey);
  loginWithProfile(profileKey);
});

enterBtn.addEventListener("click", () => {
  const selected = profileGrid.querySelector(".profile-card.selected")?.dataset.profile || "recepcion_maria";
  loginWithProfile(selected);
});

logoutBtn.addEventListener("click", () => {
  clearSession();
  renderLoginState();
});

searchBtn.addEventListener("click", buscarMascotas);
pendingBtnVet.addEventListener("click", () => cargarPendientes(pendingResultsVet, pendingLatencyVet));
pendingBtnRecepcion.addEventListener("click", () => cargarPendientes(pendingResultsRecepcion, pendingLatencyRecepcion));
applyVacunaBtn.addEventListener("click", aplicarVacunaDemo);

const existingSession = readSession();
if (existingSession) {
  markSelectedProfile(existingSession.profileKey);
}

renderLoginState();

const clientSelect = document.querySelector("#client");
const saveButtons = document.querySelectorAll("[data-save-client]");
const adminStatus = document.querySelector("#adminStatus");

let activeClient = null;

function setStatus(message) {
  if (adminStatus) {
    adminStatus.textContent = message;
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }

  return response.json();
}

function value(id) {
  return document.querySelector(`#${id}`)?.value || "";
}

function setValue(id, nextValue) {
  const field = document.querySelector(`#${id}`);
  if (field) {
    field.value = nextValue || "";
  }
}

function collectClient() {
  return {
    name: value("clientName"),
    status: value("clientStatus"),
    industry: value("industry"),
    instagram: value("instagram"),
    logo: value("logo"),
    logoAlt: value("logoAlt"),
    photoFolder: value("photoFolder"),
    colors: {
      primary: value("colorPrimary"),
      accent: value("colorAccent"),
      dark: value("colorDark"),
      background: value("colorBackground")
    },
    fonts: {
      primary: value("font"),
      secondary: value("fontSecondary")
    },
    visualStyle: value("visualStyle"),
    tone: value("tone"),
    keywords: value("keywords"),
    bannedWords: value("bannedWords"),
    imageRules: value("imageRules"),
    aiRules: value("rules"),
    captionRules: value("captionRules"),
    enabledTemplates: [...document.querySelectorAll("[data-template-enabled]:checked")].map((input) => input.value),
    approval: value("approval"),
    lockedElements: value("lockedElements"),
    exportFormats: value("exportFormats")
  };
}

function renderClient(client) {
  activeClient = client;
  setValue("clientName", client.name);
  setValue("clientStatus", client.status);
  setValue("industry", client.industry);
  setValue("instagram", client.instagram);
  setValue("logo", client.logo);
  setValue("logoAlt", client.logoAlt);
  setValue("photoFolder", client.photoFolder);
  setValue("colorPrimary", client.colors?.primary);
  setValue("colorAccent", client.colors?.accent);
  setValue("colorDark", client.colors?.dark);
  setValue("colorBackground", client.colors?.background);
  setValue("font", client.fonts?.primary);
  setValue("fontSecondary", client.fonts?.secondary);
  setValue("visualStyle", client.visualStyle);
  setValue("tone", client.tone);
  setValue("keywords", client.keywords);
  setValue("bannedWords", client.bannedWords);
  setValue("imageRules", client.imageRules);
  setValue("rules", client.aiRules);
  setValue("captionRules", client.captionRules);
  setValue("approval", client.approval);
  setValue("lockedElements", client.lockedElements);
  setValue("exportFormats", client.exportFormats);

  document.querySelectorAll("[data-template-enabled]").forEach((input) => {
    input.checked = client.enabledTemplates?.includes(input.value);
  });

  document.querySelector(".brand-preview strong").textContent = client.name;
  document.querySelector(".brand-logo-preview").textContent = client.name.split(" ").map((word) => word[0]).join("").slice(0, 3);
  setStatus("Brand kit caricato.");
}

async function loadClients() {
  const { clients } = await api("/api/clients");
  clientSelect.innerHTML = clients.map((client) => `<option value="${client.id}">${client.name}</option>`).join("");
  await loadClient(clientSelect.value);
}

async function loadClient(id) {
  renderClient(await api(`/api/clients/${id}`));
}

async function saveClient() {
  if (!activeClient) {
    return;
  }

  setStatus("Salvataggio in corso...");
  const saved = await api(`/api/clients/${activeClient.id}`, {
    method: "PUT",
    body: JSON.stringify(collectClient())
  });

  renderClient(saved);
  setStatus("Brand kit salvato nel backend.");
}

clientSelect.addEventListener("change", () => loadClient(clientSelect.value));
saveButtons.forEach((button) => button.addEventListener("click", saveClient));
loadClients().catch((error) => setStatus(`Errore backend: ${error.message}`));

const clientSelect = document.querySelector("#client");
const saveButtons = document.querySelectorAll("[data-save-client]");
const adminStatus = document.querySelector("#adminStatus");
const brandPhotoUpload = document.querySelector("#brandPhotoUpload");
const uploadBrandPhotoButton = document.querySelector("#uploadBrandPhoto");
const photoLibrary = document.querySelector("#photoLibrary");

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

async function uploadAsset(file) {
  const formData = new FormData();
  formData.append("photo", file);
  formData.append("source", "brand-library");

  const response = await fetch(`/api/clients/${activeClient.id}/assets`, {
    method: "POST",
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Upload ${response.status}`);
  }

  return data;
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
    photoLibrary: activeClient?.photoLibrary || [],
    aiRules: value("rules"),
    captionRules: value("captionRules"),
    flyerReferences: value("flyerReferences"),
    enabledTemplates: [...document.querySelectorAll("[data-template-enabled]:checked")].map((input) => input.value),
    approval: value("approval"),
    lockedElements: value("lockedElements"),
    exportFormats: value("exportFormats")
  };
}

function renderPhotoLibrary(assets = []) {
  if (!photoLibrary) return;

  if (!assets.length) {
    photoLibrary.innerHTML = '<div class="model-summary">Nessuna foto caricata. Aggiungi immagini reali del cliente per farle scegliere da Claude.</div>';
    return;
  }

  photoLibrary.innerHTML = assets.map((asset) => `
    <div class="photo-library-item">
      <img src="${asset.url}" alt="">
      <div>
        <strong>${asset.name}</strong>
        <span>${asset.description || "Foto disponibile per gli sfondi."}</span>
        <span>${(asset.tags || []).slice(0, 5).join(", ")}</span>
      </div>
    </div>
  `).join("");
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
  setValue("flyerReferences", client.flyerReferences);
  setValue("approval", client.approval);
  setValue("lockedElements", client.lockedElements);
  setValue("exportFormats", client.exportFormats);

  document.querySelectorAll("[data-template-enabled]").forEach((input) => {
    input.checked = client.enabledTemplates?.includes(input.value);
  });

  document.querySelector(".brand-preview strong").textContent = client.name;
  document.querySelector(".brand-logo-preview").textContent = client.name.split(" ").map((word) => word[0]).join("").slice(0, 3);
  renderPhotoLibrary(client.photoLibrary || []);
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

if (uploadBrandPhotoButton) {
  uploadBrandPhotoButton.addEventListener("click", async () => {
    const file = brandPhotoUpload?.files?.[0];

    if (!file || !activeClient) {
      setStatus("Seleziona una foto prima di caricare.");
      return;
    }

    try {
      setStatus("Caricamento foto e analisi Claude...");
      const asset = await uploadAsset(file);
      activeClient.photoLibrary = [asset, ...(activeClient.photoLibrary || [])];
      renderPhotoLibrary(activeClient.photoLibrary);
      brandPhotoUpload.value = "";
      setStatus("Foto aggiunta alla libreria cliente.");
    } catch (error) {
      setStatus(`Errore upload foto: ${error.message}`);
    }
  });
}

loadClients().catch((error) => setStatus(`Errore backend: ${error.message}`));

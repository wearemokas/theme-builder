const typeInput = document.querySelector("#type");
const notesInput = document.querySelector("#notes");
const regenerateTextButton = document.querySelector("#regenerateTextButton");
const regenerateStyleButton = document.querySelector("#regenerateStyleButton");
const generateDesignButton = document.querySelector("#generateDesignButton");
const dynamicFields = document.querySelector("#dynamicFields");
const modelSummary = document.querySelector("#modelSummary");
const templateButtons = document.querySelectorAll("[data-template]");
const styleButtons = document.querySelectorAll("[data-style]");

const canvas = document.querySelector("#canvas");
const canvasType = document.querySelector("#canvasType");
const canvasTitle = document.querySelector("#canvasTitle");
const canvasDetails = document.querySelector("#canvasDetails");
const canvasBadge = document.querySelector("#canvasBadge");
const canvasLogo = document.querySelector("#canvasLogo");
const stepPanels = document.querySelectorAll(".step-panel");
const stepDots = document.querySelectorAll("[data-step-target]");
const nextButtons = document.querySelectorAll("[data-next-step]");
const prevButtons = document.querySelectorAll("[data-prev-step]");
const saveDraftButton = document.querySelector("#saveDraftButton");
const clientStatus = document.querySelector("#clientStatus");
const clientGreeting = document.querySelector("#clientGreeting");

let currentStep = 1;
let activeClient = null;
let activeStyle = "premium-night";

const styleClasses = ["premium-night", "editorial-menu", "bold-promo", "warm-launch", "clean-story"];

const models = {
  event: {
    label: "Evento speciale",
    summary: "Per serate, inaugurazioni, open day, workshop e appuntamenti locali.",
    titleFallback: "Aperitivo Live",
    ctaFallback: "Prenota ora",
    fields: [
      { id: "title", label: "Nome evento", value: "Aperitivo Live", preview: "title" },
      { id: "date", label: "Data", value: "Venerdi 24 maggio", preview: "detail" },
      { id: "time", label: "Orario", value: "Dalle 19:30", preview: "detail", optional: true },
      { id: "place", label: "Luogo", value: "RHD Lounge, Milano", preview: "detail" },
      { id: "guest", label: "Ospite / DJ / speaker", value: "", preview: "detail", optional: true },
      { id: "cta", label: "Call to action", value: "Prenota ora", preview: "badge", optional: true }
    ]
  },
  menu: {
    label: "Menu del giorno",
    summary: "Per menu pranzo, cena, degustazione, drink list o proposte stagionali.",
    titleFallback: "Menu Signature",
    ctaFallback: "Scopri il menu",
    fields: [
      { id: "title", label: "Titolo menu", value: "Menu Signature", preview: "title" },
      { id: "starter", label: "Antipasto", value: "Tartare di tonno", preview: "detail", optional: true },
      { id: "main", label: "Piatto principale", value: "Risotto agrumi e gamberi", preview: "detail" },
      { id: "dessert", label: "Dessert", value: "Cheesecake al lime", preview: "detail", optional: true },
      { id: "price", label: "Prezzo", value: "35 euro a persona", preview: "detail", optional: true },
      { id: "cta", label: "Call to action", value: "Prenota il tavolo", preview: "badge", optional: true }
    ]
  },
  offer: {
    label: "Promo esclusiva",
    summary: "Per sconti, pacchetti, offerte weekend e campagne a tempo.",
    titleFallback: "Weekend Special",
    ctaFallback: "Approfittane",
    fields: [
      { id: "title", label: "Nome offerta", value: "Weekend Special", preview: "title" },
      { id: "discount", label: "Sconto / vantaggio", value: "-20% sui pacchetti coppia", preview: "detail" },
      { id: "period", label: "Validita", value: "Solo questo weekend", preview: "detail", optional: true },
      { id: "code", label: "Codice promo", value: "", preview: "detail", optional: true },
      { id: "cta", label: "Call to action", value: "Prenota online", preview: "badge", optional: true }
    ]
  },
  launch: {
    label: "Lancio prodotto",
    summary: "Per annunciare nuovi prodotti, servizi, collezioni o aperture.",
    titleFallback: "Nuova Collezione",
    ctaFallback: "Scopri ora",
    fields: [
      { id: "title", label: "Nome prodotto", value: "Nuova Collezione", preview: "title" },
      { id: "subtitle", label: "Sottotitolo", value: "Disponibile da oggi", preview: "detail" },
      { id: "benefit", label: "Beneficio principale", value: "Design premium, pronto all'uso", preview: "detail", optional: true },
      { id: "price", label: "Prezzo o fascia", value: "", preview: "detail", optional: true },
      { id: "cta", label: "Call to action", value: "Scopri ora", preview: "badge", optional: true }
    ]
  },
  story: {
    label: "Story Instagram",
    summary: "Per contenuti veloci, reminder, countdown e aggiornamenti quotidiani.",
    titleFallback: "Ultimi posti",
    ctaFallback: "Scrivici",
    fields: [
      { id: "title", label: "Messaggio principale", value: "Ultimi posti", preview: "title" },
      { id: "line1", label: "Riga 1", value: "Evento di venerdi", preview: "detail" },
      { id: "line2", label: "Riga 2", value: "Prenotazioni aperte", preview: "detail", optional: true },
      { id: "sticker", label: "Sticker testuale", value: "Swipe up", preview: "detail", optional: true },
      { id: "cta", label: "Call to action", value: "Scrivici", preview: "badge", optional: true }
    ]
  }
};

function currentModel() {
  return models[typeInput.value];
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API ${response.status}`);
  }

  return data;
}

function setClientStatus(message) {
  if (clientStatus) {
    clientStatus.textContent = message;
  }
}

function collectFields() {
  const fields = {};
  dynamicFields.querySelectorAll("[data-field-id]").forEach((input) => {
    fields[input.dataset.fieldId] = input.value.trim();
  });
  return fields;
}

function applyBrand(client) {
  activeClient = client;
  document.documentElement.style.setProperty("--accent", client.colors?.primary || "#1f7a8c");
  document.documentElement.style.setProperty("--accent-2", client.colors?.accent || "#ef8354");

  if (clientGreeting) clientGreeting.textContent = client.name;
  if (canvasLogo) {
    canvasLogo.textContent = client.name.split(" ").map((word) => word[0]).join("").slice(0, 3);
  }

  setClientStatus(`Brand kit caricato: ${client.name}`);
}

function fieldValue(id) {
  const input = dynamicFields.querySelector(`[data-field-id="${id}"]`);
  return input ? input.value.trim() : "";
}

function renderFields() {
  const model = currentModel();

  modelSummary.textContent = model.label;
  dynamicFields.innerHTML = model.fields.map((field) => {
    const optional = field.optional ? '<span class="optional-tag">Opzionale</span>' : "";
    return `
      <div class="field">
        <label for="${field.id}">${field.label}${optional}</label>
        <input id="${field.id}" data-field-id="${field.id}" value="${field.value}" placeholder="${field.label}">
      </div>
    `;
  }).join("");

  dynamicFields.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", syncCanvas);
  });
}

function syncCanvas() {
  const model = currentModel();
  const title = fieldValue("title") || model.titleFallback;
  const cta = fieldValue("cta") || model.ctaFallback;
  const detailFields = model.fields.filter((field) => field.preview === "detail");
  const details = detailFields
    .map((field) => fieldValue(field.id))
    .filter(Boolean);

  canvas.className = `canvas ${typeInput.value} style-${activeStyle}`;
  canvasType.textContent = model.label;
  canvasTitle.textContent = title;
  canvasBadge.textContent = cta;
  canvasDetails.innerHTML = "";
  details.forEach((detail) => {
    const item = document.createElement("span");
    item.textContent = detail;
    canvasDetails.appendChild(item);
  });
}

function setFieldValue(id, value) {
  const input = dynamicFields.querySelector(`[data-field-id="${id}"]`);
  if (input && value) {
    input.value = value;
  }
}

function applyGeneratedText(generation) {
  if (generation.title) {
    setFieldValue("title", generation.title);
  }

  if (generation.cta) {
    setFieldValue("cta", generation.cta);
  }

  const detailFieldIds = currentModel().fields
    .filter((field) => field.preview === "detail")
    .map((field) => field.id);

  (generation.details || []).forEach((detail, index) => {
    setFieldValue(detailFieldIds[index], detail);
  });

  syncCanvas();
}

function syncStyleButtons() {
  styleButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.style === activeStyle);
  });
}

async function regenerateTexts() {
  const model = currentModel();
  setClientStatus("Rigenerazione testi in corso...");

  const result = await api("/api/ai/generate", {
    method: "POST",
    body: JSON.stringify({
      mode: "text",
      clientId: activeClient?.id || "studio-social-pack",
      templateId: typeInput.value,
      fields: collectFields(),
      notes: notesInput.value
    })
  });

  if (result.generation) {
    applyGeneratedText(result.generation);
  }

  if (result.text) {
    notesInput.value = result.text;
  }

  setClientStatus(result.configured ? "Testi rigenerati." : result.text);
}

async function regenerateStyle() {
  setClientStatus("Rigenerazione stile in corso...");

  const result = await api("/api/ai/generate", {
    method: "POST",
    body: JSON.stringify({
      mode: "style",
      clientId: activeClient?.id || "studio-social-pack",
      templateId: typeInput.value,
      fields: collectFields(),
      notes: notesInput.value,
      currentStyle: activeStyle
    })
  });

  if (result.generation?.styleToken && styleClasses.includes(result.generation.styleToken)) {
    activeStyle = result.generation.styleToken;
  } else {
    const currentIndex = styleClasses.indexOf(activeStyle);
    activeStyle = styleClasses[(currentIndex + 1) % styleClasses.length];
  }

  syncStyleButtons();
  syncCanvas();
  setClientStatus(result.configured ? `Stile applicato: ${activeStyle}` : result.text);
}

function showStep(step) {
  currentStep = Math.min(4, Math.max(1, step));

  stepPanels.forEach((panel) => {
    panel.classList.toggle("active", Number(panel.dataset.step) === currentStep);
  });

  stepDots.forEach((dot) => {
    dot.classList.toggle("active", Number(dot.dataset.stepTarget) === currentStep);
  });
}

typeInput.addEventListener("input", () => {
  renderFields();
  syncCanvas();
});

templateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    typeInput.value = button.dataset.template;
    renderFields();
    syncCanvas();
    showStep(2);
  });
});

styleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeStyle = button.dataset.style;
    styleButtons.forEach((item) => item.classList.toggle("active", item === button));
    syncCanvas();
  });
});

regenerateTextButton.addEventListener("click", () => {
  regenerateTexts().catch((error) => setClientStatus(`Errore testi AI: ${error.message}`));
});

regenerateStyleButton.addEventListener("click", () => {
  regenerateStyle().catch((error) => setClientStatus(`Errore stile AI: ${error.message}`));
});

generateDesignButton.addEventListener("click", async () => {
  try {
    await regenerateTexts();
    await regenerateStyle();
    showStep(4);
  } catch (error) {
    setClientStatus(`Errore generazione: ${error.message}`);
  }
});

saveDraftButton.addEventListener("click", async () => {
  try {
    const saved = await api("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        clientId: activeClient?.id || "studio-social-pack",
        templateId: typeInput.value,
        fields: collectFields(),
        notes: notesInput.value
      })
    });

    setClientStatus(`Bozza salvata: ${saved.id}`);
  } catch (error) {
    setClientStatus(`Errore salvataggio: ${error.message}`);
  }
});

stepDots.forEach((dot) => {
  dot.addEventListener("click", () => showStep(Number(dot.dataset.stepTarget)));
});

nextButtons.forEach((button) => {
  button.addEventListener("click", () => showStep(currentStep + 1));
});

prevButtons.forEach((button) => {
  button.addEventListener("click", () => showStep(currentStep - 1));
});

renderFields();
syncCanvas();
showStep(1);

api("/api/clients/studio-social-pack")
  .then(applyBrand)
  .catch((error) => setClientStatus(`Errore backend: ${error.message}`));

const typeInput = document.querySelector("#type");
const notesInput = document.querySelector("#notes");
const aiButton = document.querySelector("#aiButton");
const dynamicFields = document.querySelector("#dynamicFields");
const modelSummary = document.querySelector("#modelSummary");

const canvas = document.querySelector("#canvas");
const canvasType = document.querySelector("#canvasType");
const canvasTitle = document.querySelector("#canvasTitle");
const canvasDetails = document.querySelector("#canvasDetails");
const canvasBadge = document.querySelector("#canvasBadge");
const stepPanels = document.querySelectorAll(".step-panel");
const stepDots = document.querySelectorAll("[data-step-target]");
const nextButtons = document.querySelectorAll("[data-next-step]");
const prevButtons = document.querySelectorAll("[data-prev-step]");

let currentStep = 1;

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

function fieldValue(id) {
  const input = dynamicFields.querySelector(`[data-field-id="${id}"]`);
  return input ? input.value.trim() : "";
}

function renderFields() {
  const model = currentModel();

  modelSummary.innerHTML = `<strong>${model.label}</strong>${model.summary}`;
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

  canvas.className = `canvas ${typeInput.value}`;
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

function simulateClaudeCopy() {
  const model = currentModel();
  const titleField = dynamicFields.querySelector('[data-field-id="title"]');

  if (titleField) {
    titleField.value = model.titleFallback;
  }

  notesInput.value = "Bozza AI: testo piu pulito, CTA visibile e messaggio coerente con il brand.";
  syncCanvas();
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

aiButton.addEventListener("click", simulateClaudeCopy);

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

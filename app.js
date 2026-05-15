const typeInput = document.querySelector("#type");
const titleInput = document.querySelector("#title");
const dateInput = document.querySelector("#date");
const placeInput = document.querySelector("#place");
const notesInput = document.querySelector("#notes");
const aiButton = document.querySelector("#aiButton");

const canvas = document.querySelector("#canvas");
const canvasType = document.querySelector("#canvasType");
const canvasTitle = document.querySelector("#canvasTitle");
const canvasDate = document.querySelector("#canvasDate");
const canvasPlace = document.querySelector("#canvasPlace");

const labels = {
  event: "Evento speciale",
  menu: "Menu del giorno",
  offer: "Promo esclusiva"
};

function syncCanvas() {
  const type = typeInput.value;
  canvas.className = `canvas ${type}`;
  canvasType.textContent = labels[type];
  canvasTitle.textContent = titleInput.value || "Titolo grafica";
  canvasDate.textContent = dateInput.value || "Data";
  canvasPlace.textContent = placeInput.value || "Luogo";
}

function simulateClaudeCopy() {
  const type = typeInput.value;
  const suggestions = {
    event: "Aperitivo Live",
    menu: "Menu Signature",
    offer: "Weekend Special"
  };

  titleInput.value = suggestions[type];
  notesInput.value = "Bozza AI: testo piu pulito, CTA visibile e messaggio coerente con il brand.";
  syncCanvas();
}

[typeInput, titleInput, dateInput, placeInput].forEach((input) => {
  input.addEventListener("input", syncCanvas);
});

aiButton.addEventListener("click", simulateClaudeCopy);

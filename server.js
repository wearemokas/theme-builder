const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const port = Number(process.env.PORT || 3000);
const root = __dirname;
const dataDir = path.join(root, "data");
const dbPath = path.join(dataDir, "db.json");

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function seedDatabase() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    return;
  }

  const seed = {
    clients: [
      {
        id: "studio-social-pack",
        name: "Studio Social Pack",
        status: "Attivo",
        industry: "Ristorazione e nightlife",
        instagram: "@studiosocialpack",
        logo: "studio-social-pack-logo.png",
        logoAlt: "studio-social-pack-logo-white.png",
        photoFolder: "/assets/clienti/studio-social-pack/foto",
        colors: {
          primary: "#1F7A8C",
          accent: "#EF8354",
          dark: "#182231",
          background: "#F5F7FB"
        },
        fonts: {
          primary: "Inter",
          secondary: "Playfair Display"
        },
        visualStyle: "Premium minimale",
        tone: "Professionale, diretto e premium",
        keywords: "qualita, atmosfera, esperienza, prenotazione",
        bannedWords: "super offerta, imperdibile, gratis",
        imageRules: "Usare immagini luminose, poco affollate, con prodotto o locale ben visibile.",
        aiRules: "Tono professionale, diretto e premium. Evitare testi troppo lunghi. Inserire sempre una call to action chiara.",
        captionRules: "Massimo 700 caratteri. Prima riga forte, corpo breve, CTA finale.",
        enabledTemplates: ["event", "menu", "offer", "story", "launch"],
        approval: "Cliente puo esportare senza revisione",
        lockedElements: "Logo, font, palette, margini principali e posizione CTA non modificabili dal cliente.",
        exportFormats: "Instagram post 4:5, Story 9:16, PDF"
      }
    ],
    projects: []
  };

  fs.writeFileSync(dbPath, JSON.stringify(seed, null, 2));
}

function readDb() {
  seedDatabase();
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload too large"));
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function resolveFile(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const requested = cleanPath === "/" ? "/index.html" : cleanPath;
  const filePath = path.normalize(path.join(root, requested));

  if (!filePath.startsWith(root)) {
    return null;
  }

  if (filePath.startsWith(dataDir)) {
    return null;
  }

  return filePath;
}

function templateDefinitions() {
  return [
    { id: "event", name: "Evento", format: "Instagram post 4:5" },
    { id: "menu", name: "Menu", format: "Instagram post 4:5" },
    { id: "offer", name: "Promo", format: "Instagram post 4:5" },
    { id: "launch", name: "Lancio prodotto", format: "Instagram post 4:5" },
    { id: "story", name: "Story Instagram", format: "Story 9:16" }
  ];
}

function parseJsonObject(text) {
  if (!text) {
    return null;
  }

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]);
  } catch (error) {
    return null;
  }
}

async function generateWithClaude(payload, client) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      configured: false,
      text: "Claude non e ancora configurato. Aggiungi ANTHROPIC_API_KEY su Railway per usare la generazione reale."
    };
  }

  const textPrompt = [
    `Cliente: ${client.name}`,
    `Tone of voice: ${client.tone}`,
    `Parole chiave: ${client.keywords}`,
    `Parole da evitare: ${client.bannedWords}`,
    `Regole: ${client.aiRules}`,
    `Template: ${payload.templateId}`,
    `Campi compilati: ${JSON.stringify(payload.fields)}`,
    `Note utente: ${payload.notes || ""}`,
    "Rigenera solo i testi mantenendo lo stesso tipo di grafica.",
    "Rispondi solo con JSON valido nel formato:",
    "{\"title\":\"...\",\"details\":[\"...\",\"...\"],\"cta\":\"...\"}"
  ].join("\n");

  const stylePrompt = [
    `Cliente: ${client.name}`,
    `Palette brand: ${JSON.stringify(client.colors)}`,
    `Font: ${JSON.stringify(client.fonts)}`,
    `Stile visuale approvato: ${client.visualStyle}`,
    `Regole immagini: ${client.imageRules}`,
    `Template: ${payload.templateId}`,
    `Campi compilati: ${JSON.stringify(payload.fields)}`,
    `Stile corrente: ${payload.currentStyle || "premium-night"}`,
    "Scegli uno stile grafico diverso e coerente con il brand.",
    "styleToken deve essere uno tra: premium-night, editorial-menu, bold-promo, warm-launch, clean-story.",
    "Rispondi solo con JSON valido nel formato:",
    "{\"styleToken\":\"premium-night\",\"backgroundPrompt\":\"...\",\"logoPlacement\":\"top-left\",\"designNotes\":\"...\"}"
  ].join("\n");

  const prompt = payload.mode === "style" ? stylePrompt : textPrompt;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      configured: true,
      error: data.error?.message || "Claude API error"
    };
  }

  const text = data.content?.map((item) => item.text).filter(Boolean).join("\n") || "";

  return {
    configured: true,
    text,
    generation: parseJsonObject(text)
  };
}

async function handleApi(req, res, pathname) {
  const db = readDb();

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && pathname === "/api/templates") {
    sendJson(res, 200, { templates: templateDefinitions() });
    return;
  }

  if (req.method === "GET" && pathname === "/api/clients") {
    sendJson(res, 200, {
      clients: db.clients.map((client) => ({ id: client.id, name: client.name, status: client.status }))
    });
    return;
  }

  const clientMatch = pathname.match(/^\/api\/clients\/([^/]+)$/);

  if (clientMatch && req.method === "GET") {
    const client = db.clients.find((item) => item.id === clientMatch[1]);
    sendJson(res, client ? 200 : 404, client || { error: "Client not found" });
    return;
  }

  if (clientMatch && req.method === "PUT") {
    const payload = await readBody(req);
    const index = db.clients.findIndex((item) => item.id === clientMatch[1]);

    if (index === -1) {
      sendJson(res, 404, { error: "Client not found" });
      return;
    }

    db.clients[index] = { ...db.clients[index], ...payload, id: db.clients[index].id };
    writeDb(db);
    sendJson(res, 200, db.clients[index]);
    return;
  }

  if (req.method === "POST" && pathname === "/api/projects") {
    const payload = await readBody(req);
    const project = {
      id: `project-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...payload
    };

    db.projects.unshift(project);
    writeDb(db);
    sendJson(res, 201, project);
    return;
  }

  if (req.method === "POST" && pathname === "/api/ai/generate") {
    const payload = await readBody(req);
    const client = db.clients.find((item) => item.id === (payload.clientId || "studio-social-pack")) || db.clients[0];
    sendJson(res, 200, await generateWithClaude(payload, client));
    return;
  }

  sendJson(res, 404, { error: "Route not found" });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname);
      return;
    }
  } catch (error) {
    sendJson(res, 500, { error: error.message });
    return;
  }

  const filePath = resolveFile(req.url || "/");

  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const contentType = types[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
});

server.listen(port, () => {
  seedDatabase();
  console.log(`Theme Builder listening on port ${port}`);
});

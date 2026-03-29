import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
loadEnvFile(path.join(__dirname, ".env"));
const PORT = Number(process.env.PORT) || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini";
const ATTENTION_RANDOM_THEMES = [
  { key: "living-room", label: "Гостиная", query: "living room" },
  { key: "kitchen", label: "Кухня", query: "kitchen" },
  { key: "bookshelf", label: "Книжная полка", query: "bookshelf" },
  { key: "market", label: "Рынок", query: "market" },
  { key: "workshop", label: "Мастерская", query: "workshop" },
  { key: "street", label: "Улица", query: "street" },
  { key: "park", label: "Парк", query: "park" },
  { key: "desk", label: "Рабочий стол", query: "desk" },
  { key: "museum", label: "Музей", query: "museum" },
  { key: "cafe", label: "Кафе", query: "cafe" },
];

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/describe-image") {
      await handleDescribeImage(req, res);
      return;
    }
    if (req.method === "POST" && req.url === "/api/compare-attention") {
      await handleCompareAttention(req, res);
      return;
    }
    if (req.method === "GET" && req.url === "/api/random-attention-image") {
      await handleRandomAttentionImage(req, res);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Internal server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

async function handleDescribeImage(req, res) {
  if (!OPENAI_API_KEY) {
    sendJson(res, 500, {
      error: "OPENAI_API_KEY is missing. Add it to your environment before starting the server.",
    });
    return;
  }

  const formData = await readFormData(req);
  const image = formData.get("image");

  if (!isUploadedImage(image)) {
    sendJson(res, 400, { error: "Поле image с файлом обязательно." });
    return;
  }

  if (!image.type.startsWith("image/")) {
    sendJson(res, 400, { error: "Можно загружать только изображения." });
    return;
  }

  const imageDataUrl = await fileToDataUrl(image);

  const payload = await requestOpenAI({
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Опиши, что видно на изображении. Ответ дай на русском языке, кратко и по делу, 2-4 предложения без домыслов.",
          },
          {
            type: "input_image",
            image_url: imageDataUrl,
          },
        ],
      },
    ],
  });

  const description = extractDescription(payload);
  if (!description) {
    console.error("OpenAI response without description:", payload);
    sendJson(res, 502, {
      error: "Модель не вернула текстовое описание изображения.",
    });
    return;
  }

  sendJson(res, 200, {
    description,
  });
}

async function handleCompareAttention(req, res) {
  if (!OPENAI_API_KEY) {
    sendJson(res, 500, {
      error: "OPENAI_API_KEY is missing. Add it to your environment before starting the server.",
    });
    return;
  }

  const formData = await readFormData(req);
  const image = formData.get("image");
  const notes = String(formData.get("notes") || "").trim();

  if (!isUploadedImage(image)) {
    sendJson(res, 400, { error: "Поле image с файлом обязательно." });
    return;
  }
  if (!notes) {
    sendJson(res, 400, { error: "Нужно описать, что ты заметил на фото." });
    return;
  }

  const imageDataUrl = await fileToDataUrl(image);
  const payload = await requestOpenAI({
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Сравни описание пользователя с изображением. Верни только JSON без markdown. " +
              "Формат: {\"totalDetails\": число, \"rememberedDetails\": число, \"matchedDetails\": [строки], " +
              "\"missedDetails\": [строки], \"extraDetails\": [строки], \"summary\": \"строка\"}. " +
              "Считай только конкретные визуальные детали, не придумывай. Все строки на русском языке, короткие. " +
              `Ответ пользователя: ${notes}`,
          },
          {
            type: "input_image",
            image_url: imageDataUrl,
          },
        ],
      },
    ],
  });

  const comparisonRaw = extractDescription(payload);
  const comparison = parseJsonObject(comparisonRaw);
  if (!comparison) {
    console.error("OpenAI comparison response without JSON:", payload);
    sendJson(res, 502, {
      error: "Модель не вернула корректный JSON для сравнения.",
    });
    return;
  }

  sendJson(res, 200, {
    totalDetails: normalizePositiveInt(comparison.totalDetails),
    rememberedDetails: normalizePositiveInt(comparison.rememberedDetails),
    matchedDetails: normalizeStringArray(comparison.matchedDetails),
    missedDetails: normalizeStringArray(comparison.missedDetails),
    extraDetails: normalizeStringArray(comparison.extraDetails),
    summary: String(comparison.summary || "").trim(),
  });
}

async function handleRandomAttentionImage(req, res) {
  let theme = ATTENTION_RANDOM_THEMES[Math.floor(Math.random() * ATTENTION_RANDOM_THEMES.length)];

  if (OPENAI_API_KEY) {
    try {
      const payload = await requestOpenAI({
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Выбери одну тему для тренировки внимания. Верни только JSON без markdown в формате " +
                  "{\"themeKey\":\"...\"}. Разрешенные themeKey: " +
                  ATTENTION_RANDOM_THEMES.map((item) => item.key).join(", "),
              },
            ],
          },
        ],
      });

      const raw = extractDescription(payload);
      const parsed = parseJsonObject(raw);
      const matchedTheme = ATTENTION_RANDOM_THEMES.find((item) => item.key === parsed?.themeKey);
      if (matchedTheme) theme = matchedTheme;
    } catch (error) {
      console.error("Random attention image theme fallback:", error);
    }
  }

  const imageResponse = await fetch(`https://picsum.photos/seed/${encodeURIComponent(`attention-${theme.key}-${Date.now()}`)}/1200/800`);
  if (!imageResponse.ok) {
    sendJson(res, 502, { error: "Не удалось получить случайное фото." });
    return;
  }

  const imageType = imageResponse.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  sendJson(res, 200, {
    themeKey: theme.key,
    themeLabel: theme.label,
    imageDataUrl: `data:${imageType};base64,${buffer.toString("base64")}`,
  });
}

async function serveStatic(req, res) {
  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(__dirname, safePath);

  if (!filePath.startsWith(__dirname)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  let stat;
  try {
    stat = await fs.promises.stat(filePath);
  } catch {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  if (stat.isDirectory()) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  fs.createReadStream(filePath).pipe(res);
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

async function requestOpenAI({ input }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    console.error("OpenAI API error:", payload);
    throw new Error(payload?.error?.message || "OpenAI request failed.");
  }

  return payload;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 15 * 1024 * 1024) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

async function readFormData(req) {
  const request = new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: req,
    duplex: "half",
  });

  return request.formData();
}

async function fileToDataUrl(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

function extractDescription(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload?.output)) return "";

  const parts = [];
  payload.output.forEach((item) => {
    if (!Array.isArray(item?.content)) return;
    item.content.forEach((contentItem) => {
      if (typeof contentItem?.text === "string" && contentItem.text.trim()) {
        parts.push(contentItem.text.trim());
      }
    });
  });

  return parts.join("\n\n").trim();
}

function parseJsonObject(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function normalizePositiveInt(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.round(number));
}

function isUploadedImage(value) {
  return Boolean(
    value
      && typeof value === "object"
      && typeof value.arrayBuffer === "function"
      && typeof value.type === "string"
      && typeof value.name === "string",
  );
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  });
}

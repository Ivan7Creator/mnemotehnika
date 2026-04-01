export const ATTENTION_RANDOM_THEMES = [
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

export async function handleDescribeImageRequest(request) {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, {
      error: "OPENAI_API_KEY is missing. Add it to your environment before starting the server.",
    });
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!isUploadedImage(image)) {
    return jsonResponse(400, { error: "Поле image с файлом обязательно." });
  }

  if (!image.type.startsWith("image/")) {
    return jsonResponse(400, { error: "Можно загружать только изображения." });
  }

  const imageDataUrl = await fileToDataUrl(image);
  const payload = await requestOpenAI(apiKey, {
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
    return jsonResponse(502, {
      error: "Модель не вернула текстовое описание изображения.",
    });
  }

  return jsonResponse(200, { description });
}

export async function handleCompareAttentionRequest(request) {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, {
      error: "OPENAI_API_KEY is missing. Add it to your environment before starting the server.",
    });
  }

  const formData = await request.formData();
  const image = formData.get("image");
  const notes = String(formData.get("notes") || "").trim();

  if (!isUploadedImage(image)) {
    return jsonResponse(400, { error: "Поле image с файлом обязательно." });
  }
  if (!notes) {
    return jsonResponse(400, { error: "Нужно описать, что ты заметил на фото." });
  }

  const imageDataUrl = await fileToDataUrl(image);
  const payload = await requestOpenAI(apiKey, {
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
    return jsonResponse(502, {
      error: "Модель не вернула корректный JSON для сравнения.",
    });
  }

  return jsonResponse(200, {
    totalDetails: normalizePositiveInt(comparison.totalDetails),
    rememberedDetails: normalizePositiveInt(comparison.rememberedDetails),
    matchedDetails: normalizeStringArray(comparison.matchedDetails),
    missedDetails: normalizeStringArray(comparison.missedDetails),
    extraDetails: normalizeStringArray(comparison.extraDetails),
    summary: String(comparison.summary || "").trim(),
  });
}

export async function handleRandomAttentionImageRequest(request) {
  if (request.method !== "GET") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  let theme = ATTENTION_RANDOM_THEMES[Math.floor(Math.random() * ATTENTION_RANDOM_THEMES.length)];

  if (apiKey) {
    try {
      const payload = await requestOpenAI(apiKey, {
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

  const imageResponse = await fetch(
    `https://picsum.photos/seed/${encodeURIComponent(`attention-${theme.key}-${Date.now()}`)}/1200/800`,
  );
  if (!imageResponse.ok) {
    return jsonResponse(502, { error: "Не удалось получить случайное фото." });
  }

  const imageType = imageResponse.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  return jsonResponse(200, {
    themeKey: theme.key,
    themeLabel: theme.label,
    imageDataUrl: `data:${imageType};base64,${buffer.toString("base64")}`,
  });
}

export function nodeRequestToWebRequest(req, baseUrl = "http://localhost") {
  const url = new URL(req.url || "/", baseUrl);
  const init = {
    method: req.method,
    headers: req.headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req;
    init.duplex = "half";
  }

  return new Request(url, init);
}

export async function sendWebResponseToNode(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!response.body) {
    res.end();
    return;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}

function jsonResponse(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

async function requestOpenAI(apiKey, { input }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
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

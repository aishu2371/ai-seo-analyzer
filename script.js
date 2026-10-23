
const API_URL = "https://api.microlink.io/?url=";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

const form = document.getElementById("seoForm");
const urlInput = document.getElementById("websiteUrl");
const analyzeBtn = document.getElementById("analyzeBtn");
const buttonText = document.getElementById("buttonText");
const message = document.getElementById("message");

const CHECKS = [
  { name: "HTTPS connection", icon: "◇" },
  { name: "Page title", icon: "T" },
  { name: "Meta description", icon: "≡" },
  { name: "Page language", icon: "文" },
  { name: "Preview image", icon: "▧" }
];

function showMessage(text, type = "info") {
  message.textContent = text;
  message.className = `message show ${type}`;
}

function hideMessage() {
  message.textContent = "";
  message.className = "message";
}

function normalizeUrl(value) {
  let url;

  try {
    url = new URL(
      /^https?:\/\//i.test(value.trim())
        ? value.trim()
        : `https://${value.trim()}`
    );
  } catch {
    throw new Error("Please enter a valid website URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Please enter an HTTP or HTTPS website URL.");
  }

  if (!url.hostname.includes(".") || url.hostname.includes(" ")) {
    throw new Error("Please enter a complete domain, such as example.com.");
  }

  if (url.username || url.password) {
    throw new Error("Please enter a public website URL without login credentials.");
  }

  return url;
}

function safeText(value, fallback = "Not available") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return value.trim();
}

function getScoreLabel(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs improvement";
  return "Needs attention";
}

function updateScore(score) {
  const circumference = 2 * Math.PI * 74;
  const ring = document.getElementById("scoreRing");

  document.getElementById("scoreValue").textContent = score;
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset =
    circumference - (score / 100) * circumference;

  if (score >= 70) {
    ring.style.stroke = "#38e6ad";
  } else if (score >= 50) {
    ring.style.stroke = "#ffbd69";
  } else {
    ring.style.stroke = "#ff718c";
  }

  document.getElementById("scoreStatus").textContent = getScoreLabel(score);
}

function getChecks(url, data) {
  const title = safeText(data.title, "");
  const description = safeText(data.description, "");
  const language = safeText(data.lang, "");
  const image = data.image?.url || data.image?.src || "";

  return [
    {
      ...CHECKS[0],
      passed: url.protocol === "https:",
      detail: url.protocol === "https:"
        ? "Your homepage uses a secure HTTPS connection."
        : "Use HTTPS to protect visitors and secure your website connection.",
      suggestion: "Enable HTTPS and configure a valid SSL/TLS certificate."
    },
    {
      ...CHECKS[1],
      passed: title.length >= 10 && title.length <= 60,
      detail: title
        ? `Title detected (${title.length} characters): ${title}`
        : "No page title was detected by the metadata service.",
      suggestion: title
        ? "Aim for a clear, descriptive title, commonly around 30–60 characters."
        : "Add a unique, descriptive HTML title to your homepage."
    },
    {
      ...CHECKS[2],
      passed: description.length >= 50 && description.length <= 160,
      detail: description
        ? `Description detected (${description.length} characters).`
        : "No meta description was detected by the metadata service.",
      suggestion: description
        ? "Write a useful, relevant description, often around 120–160 characters."
        : "Add a relevant meta description that summarizes your homepage."
    },
    {
      ...CHECKS[3],
      passed: Boolean(language),
      detail: language
        ? `Detected language: ${language}.`
        : "The metadata service did not return a page language.",
      suggestion: "Set an appropriate lang attribute on the HTML element."
    },
    {
      ...CHECKS[4],
      passed: Boolean(image),
      detail: image
        ? "A page preview image was detected."
        : "No page preview image was detected.",
      suggestion: "Consider adding a relevant social-sharing preview image."
    }
  ];
}

function renderChecks(checks) {
  const container = document.getElementById("checkList");
  container.replaceChildren();

  checks.forEach((check, index) => {
    const row = document.createElement("div");
    row.className = "check-item";
    row.style.animationDelay = `${index * 70}ms`;

    const icon = document.createElement("div");
    icon.className = `check-icon ${check.passed ? "pass" : "warn"}`;
    icon.textContent = check.passed ? "✓" : "!";

    const copy = document.createElement("div");
    copy.className = "check-copy";

    const title = document.createElement("strong");
    title.textContent = check.name;

    const detail = document.createElement("p");
    detail.textContent = check.detail;

    copy.append(title, detail);

    const badge = document.createElement("span");
    badge.className = `check-badge ${check.passed ? "pass" : "warn"}`;
    badge.textContent = check.passed ? "Passed" : "Review";

    row.append(icon, copy, badge);
    container.appendChild(row);
  });
}

function renderRecommendations(checks) {
  const container = document.getElementById("recommendationList");
  container.replaceChildren();

  const failed = checks.filter(check => !check.passed);

  const recommendations = failed.length
    ? failed.map(check => ({
        title: check.name,
        text: check.suggestion
      }))
    : [{
        title: "Keep optimizing",
        text: "All five basic checks passed. Review speed, mobile usability, indexability, structured data, and real search performance using additional tools."
      }];

  recommendations.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "recommendation-item";

    const number = document.createElement("div");
    number.className = "recommendation-number";
    number.textContent = index + 1;

    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.title;

    const text = document.createElement("p");
    text.textContent = item.text;

    copy.append(title, text);
    row.append(number, copy);
    container.appendChild(row);
  });

  document.getElementById("recommendationCount").textContent =
    recommendations.length;
}

function updateDetails(url, data) {
  const title = safeText(data.title, "Not detected");
  const description = safeText(data.description, "Not detected");
  const language = safeText(data.lang, "Not detected");
  const image = data.image?.url || data.image?.src || "";

  document.getElementById("siteName").textContent =
    safeText(data.title, url.hostname);

  document.getElementById("siteUrl").textContent = url.hostname;

  const status = document.getElementById("siteStatus");
  status.textContent = "Analyzed";
  status.style.color = "#5ee6b9";

  document.getElementById("detailTitle").textContent = title;
  document.getElementById("detailDescription").textContent = description;
  document.getElementById("detailLanguage").textContent = language;
  document.getElementById("detailHttps").textContent =
    url.protocol === "https:" ? "Secure HTTPS" : "HTTP only";
  document.getElementById("detailImage").textContent =
    image ? "Detected" : "Not detected";

  const preview = document.getElementById("previewBox");
  preview.replaceChildren();

  if (image) {
    const img = document.createElement("img");
    img.alt = "Website preview";
    img.referrerPolicy = "no-referrer";
    img.src = image;

    img.onerror = () => {
      preview.replaceChildren();
      const placeholder = document.createElement("div");
      placeholder.className = "preview-placeholder";

      const symbol = document.createElement("span");
      symbol.className = "preview-symbol";
      symbol.textContent = "⌘";

      const label = document.createElement("strong");
      label.textContent = "Preview unavailable";

      placeholder.append(symbol, label);
      preview.appendChild(placeholder);
    };

    preview.appendChild(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "preview-placeholder";

    const symbol = document.createElement("span");
    symbol.className = "preview-symbol";
    symbol.textContent = "⌘";

    const label = document.createElement("strong");
    label.textContent = "No preview image detected";

    placeholder.append(symbol, label);
    preview.appendChild(placeholder);
  }

  document.getElementById("analysisDate").textContent =
    new Date().toLocaleString();
}

function saveCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch {
    // The analyzer still works if browser storage is unavailable.
  }
}

function readCache(key) {
  try {
    const cached = JSON.parse(localStorage.getItem(key));

    if (
      cached &&
      Date.now() - cached.timestamp < CACHE_DURATION &&
      cached.data
    ) {
      return cached.data;
    }
  } catch {
    // Ignore invalid or unavailable cached data.
  }

  return null;
}

async function fetchMetadata(url) {
  const cacheKey = `nova-seo:${url.href}`;
  const cached = readCache(cacheKey);

  if (cached) {
    showMessage("Loaded a recent cached result to save an API request.", "info");
    return cached;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(
      API_URL + encodeURIComponent(url.href),
      { signal: controller.signal }
    );

    if (!response.ok) {
      throw new Error(`The metadata service returned HTTP ${response.status}.`);
    }

    const result = await response.json();

    if (result.status !== "success" || !result.data) {
      throw new Error(
        result.message || "The service could not retrieve this homepage."
      );
    }

    saveCache(cacheKey, result.data);
    return result.data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The request took too long. Please try again.");
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Could not connect to the metadata service. Check your internet connection, API availability, or browser restrictions."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function resetResults() {
  updateScore(0);
  document.getElementById("scoreValue").textContent = "--";
  document.getElementById("scoreStatus").textContent = "Analyzing...";
  document.getElementById("scoreRing").style.strokeDashoffset =
    2 * Math.PI * 74;

  document.getElementById("passedCount").textContent = "--";
  document.getElementById("issueCount").textContent = "--";
  document.getElementById("recommendationCount").textContent = "--";
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  hideMessage();

  let url;

  try {
    url = normalizeUrl(urlInput.value);
  } catch (error) {
    showMessage(error.message, "error");
    urlInput.focus();
    return;
  }

  analyzeBtn.disabled = true;
  buttonText.textContent = "Analyzing...";
  resetResults();

  try {
    showMessage(
      "Fetching homepage metadata and checking basic SEO signals...",
      "info"
    );

    const data = await fetchMetadata(url);
    const checks = getChecks(url, data);

    const passed = checks.filter(check => check.passed).length;
    const failed = checks.length - passed;
    const score = Math.round((passed / checks.length) * 100);

    updateScore(score);
    document.getElementById("passedCount").textContent = passed;
    document.getElementById("issueCount").textContent = failed;

    renderChecks(checks);
    renderRecommendations(checks);
    updateDetails(url, data);

    showMessage(
      `Analysis complete for ${url.hostname}. ${passed} of ${checks.length} basic checks passed.`,
      "success"
    );

    document.getElementById("results").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } catch (error) {
    document.getElementById("scoreValue").textContent = "--";
    document.getElementById("scoreStatus").textContent = "Analysis failed";
    document.getElementById("scoreRing").style.strokeDashoffset =
      2 * Math.PI * 74;

    showMessage(
      `${error.message} This can happen when the service is unavailable, its request limit is reached, or the website blocks retrieval. Try again later.`,
      "error"
    );
  } finally {
    analyzeBtn.disabled = false;
    buttonText.textContent = "Analyze site";
  }
});

// Mobile navigation
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

document.querySelectorAll(".nav-link, .upgrade-link").forEach(link => {
  link.addEventListener("click", () => {
    sidebar.classList.remove("open");
  });
});

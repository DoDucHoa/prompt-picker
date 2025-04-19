import { loadPrompts, savePrompts } from "../../shared/store.js";
import "./popup.css";

const chatGPTUrl = "https://chatgpt.com/";

let PROMPTS = []; // now filled at runtime
const $query = document.getElementById("query");
const $results = document.getElementById("results");
const $newPrompt = document.getElementById("newPrompt");
const $quickAdd = document.getElementById("quickAdd");
const $options = document.getElementById("open-options");
const $insertDirectly = document.getElementById("insertDirectly");

/* ---------- bootstrap ---------- */
(async () => {
  PROMPTS = await loadPrompts(); // fetch from chrome.storage

  // Load user preference for insert mode
  chrome.storage.sync.get("insertDirectly", (data) => {
    if (data.insertDirectly !== undefined) {
      $insertDirectly.checked = data.insertDirectly;
    }
  });

  render("");
})();

/* ---------- Save checkbox state ---------- */
$insertDirectly.addEventListener("change", (e) => {
  chrome.storage.sync.set({ insertDirectly: e.target.checked });
});

/* ---------- live filter ---------- */
$query.addEventListener("input", (e) =>
  render(e.target.value.trim().toLowerCase())
);

/* ---------- quick-add ---------- */
$quickAdd.addEventListener("click", async () => {
  const txt = $newPrompt.value.trim();
  if (!txt) return;
  PROMPTS.unshift(txt);
  await savePrompts(PROMPTS);
  $newPrompt.value = "";
  render($query.value.trim().toLowerCase());
});

/* ---------- jump to options ---------- */
$options.addEventListener("click", () => chrome.runtime.openOptionsPage());

/* ---------- build list ---------- */
function render(filter) {
  $results.innerHTML = "";

  PROMPTS.filter((p) => p.toLowerCase().includes(filter)).forEach((prompt) => {
    const li = document.createElement("li");
    li.className = "prompt-row";

    // Truncate text if it exceeds 100 characters
    const displayText =
      prompt.length > 100 ? prompt.substring(0, 100) + "..." : prompt;
    li.textContent = displayText;

    // Add title attribute with full prompt text for hover tooltip
    li.setAttribute("title", prompt);

    // Add click event to either copy or insert directly
    li.addEventListener("click", () => {
      if ($insertDirectly.checked) {
        insertToChatGPT(prompt);
      } else {
        copyToClipboard(prompt);
      }
    });

    $results.appendChild(li);
  });
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
  showToast("Copied to clipboard");
}

async function insertToChatGPT(text) {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      throw new Error("No active tab found");
    }

    // Check if we're on ChatGPT
    if (!tab.url.includes(chatGPTUrl)) {
      throw new Error("Not on ChatGPT website");
    }

    // Execute script to insert text into ChatGPT input field using the new Manifest V3 API
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: insertTextIntoChatGPT,
      args: [text],
    });

    if (results && results[0] && results[0].result) {
      showToast(results[0].result);
    } else {
      showToast("Inserted into ChatGPT");
    }
  } catch (error) {
    console.error("Error inserting text:", error);
    showToast("Error: Make sure you're on ChatGPT");
    // Fallback to clipboard copy
    await copyToClipboard(text);
  }
}

// This function will be executed in the context of the page
function insertTextIntoChatGPT(text) {
  // Look for the contenteditable div with id="prompt-textarea"
  const promptTextarea = document.getElementById("prompt-textarea");

  if (!promptTextarea) {
    console.error("Could not find the prompt-textarea element");
    return "Could not find ChatGPT input field";
  }

  // Make sure it's focused first to ensure any event listeners are triggered
  promptTextarea.focus();

  // Clear existing content (including placeholder)
  promptTextarea.innerHTML = "";

  // Split text by newlines and create <p> tags for each line
  const lines = text.split("\n");

  lines.forEach((line, index) => {
    // Create a new <p> element for each line
    const p = document.createElement("p");
    p.textContent = line || " "; // Use space for empty lines
    promptTextarea.appendChild(p);
  });

  // Trigger input event to let ChatGPT know the content has changed
  promptTextarea.dispatchEvent(new Event("input", { bubbles: true }));

  // Set cursor at end
  const range = document.createRange();
  const sel = window.getSelection();
  const lastP = promptTextarea.lastChild;
  if (lastP) {
    range.setStart(lastP, lastP.childNodes.length || 1);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  return "Inserted into ChatGPT";
}

function showToast(message) {
  // Remove any existing toast
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Create new toast
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add("show"), 10);

  // Auto-hide after 2 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

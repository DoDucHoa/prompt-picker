import { loadPrompts, savePrompts, exportTxt } from "../../shared/store.js";
import "./options.css";

const $tbody = document.querySelector("#table tbody");
const $addInput = document.getElementById("addInput");
const $addBtn = document.getElementById("addBtn");
const $exportBtn = document.getElementById("exportBtn");
const $importBtn = document.getElementById("importBtn");
const $filePick = document.getElementById("filePicker");

let prompts = [];
let dragSrcIndex = null;

/* ---------- bootstrap ---------- */
(async () => {
  prompts = await loadPrompts();
  renderTable();
})();

/* ---------- Add ---------- */
$addBtn.addEventListener("click", addPrompt);
$addInput.addEventListener("keydown", (e) => e.key === "Enter" && addPrompt());

function addPrompt() {
  const txt = $addInput.value.trim();
  if (!txt) return;
  prompts.unshift(txt);
  $addInput.value = "";
  persist();
}

/* ---------- Export ---------- */
$exportBtn.addEventListener("click", () => exportTxt(prompts));

/* ---------- Import ---------- */
$importBtn.addEventListener("click", () => $filePick.click());
$filePick.addEventListener("change", () => {
  if (!$filePick.files?.length) return;
  const file = $filePick.files[0];
  const reader = new FileReader();
  reader.onload = async () => {
    // 1 prompt per line, blank lines ignored
    prompts = reader.result
      .split(/\r?\n/)
      .map((t) => t.trim())
      .filter(Boolean);
    await persist();
  };
  reader.readAsText(file, "utf-8");
});

/* ---------- rendering + per‑row edit/delete/reorder ---------- */
function renderTable() {
  $tbody.innerHTML = "";
  prompts.forEach((prompt, idx) => {
    const tr = document.createElement("tr");
    tr.draggable = true;
    tr.dataset.index = idx;

    // drag handle cell
    const tdDrag = document.createElement("td");
    tdDrag.className = "drag-handle";
    tdDrag.innerHTML = "&#8942;&#8942;"; // Unicode vertical ellipsis
    tdDrag.title = "Drag to reorder";

    // editable cell
    const tdPrompt = document.createElement("td");
    tdPrompt.className = "prompt-cell";
    const input = document.createElement("input");
    input.type = "text";
    input.value = prompt;
    input.addEventListener("change", (e) => {
      prompts[idx] = e.target.value;
      persist(false); // no re‑render yet (we're editing in place)
    });
    tdPrompt.appendChild(input);

    // delete button
    const tdDel = document.createElement("td");
    tdDel.className = "delete-cell";
    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.title = "Delete";
    delBtn.addEventListener("click", () => {
      prompts.splice(idx, 1);
      persist();
    });
    tdDel.appendChild(delBtn);

    tr.append(tdDrag, tdPrompt, tdDel);

    // Add drag and drop event listeners
    tr.addEventListener("dragstart", handleDragStart);
    tr.addEventListener("dragover", handleDragOver);
    tr.addEventListener("dragenter", handleDragEnter);
    tr.addEventListener("dragleave", handleDragLeave);
    tr.addEventListener("drop", handleDrop);
    tr.addEventListener("dragend", handleDragEnd);

    $tbody.appendChild(tr);
  });
}

/* ---------- Drag and Drop Handlers ---------- */
function handleDragStart(e) {
  dragSrcIndex = parseInt(this.dataset.index);
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", dragSrcIndex);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault(); // Necessary to allow dropping
  }
  e.dataTransfer.dropEffect = "move";
  return false;
}

function handleDragEnter(e) {
  this.classList.add("drag-over");
}

function handleDragLeave(e) {
  this.classList.remove("drag-over");
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation(); // Stops some browsers from redirecting
  }

  // Don't do anything if dropping on the same row
  const dragDestIndex = parseInt(this.dataset.index);
  if (dragSrcIndex !== dragDestIndex) {
    // Get the dragged prompt
    const itemDragged = prompts[dragSrcIndex];

    // Remove it from the array
    prompts.splice(dragSrcIndex, 1);

    // Insert it at the new position
    prompts.splice(dragDestIndex, 0, itemDragged);

    // Save and render
    persist();
  }

  return false;
}

function handleDragEnd(e) {
  // Remove dragging styles
  const rows = document.querySelectorAll("tr");
  rows.forEach((row) => {
    row.classList.remove("dragging");
    row.classList.remove("drag-over");
  });
}

/* ---------- persist helper ---------- */
async function persist(rerender = true) {
  await savePrompts(prompts);
  if (rerender) renderTable();
}

/* ---------- Feedback helper ---------- */
function showFeedback(element, message, type = "success") {
  const originalText = element.textContent;
  const originalBg = element.style.backgroundColor;
  const originalColor = element.style.color;

  // Show feedback
  element.textContent = message;

  if (type === "success") {
    element.style.backgroundColor = "#4CAF50";
    element.style.color = "white";
  } else {
    element.style.backgroundColor = "#f44336";
    element.style.color = "white";
  }

  // Restore original state after 1 second
  setTimeout(() => {
    element.textContent = originalText;
    element.style.backgroundColor = originalBg;
    element.style.color = originalColor;
  }, 1000);
}

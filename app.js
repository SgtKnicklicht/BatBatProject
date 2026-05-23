const STORAGE_KEY = "batbat.reservations.v1";
const VIEW_KEY = "batbat.activeView.v1";

const state = {
  reservations: [],
  datasets: [],
  selectedDatasetId: null,
  selectedSheet: null,
  plotMode: "lines",
};

const sampleReservations = [
  {
    id: crypto.randomUUID(),
    channel: "Neware 1-1",
    cell: "Cell A",
    owner: "Team",
    status: "running",
    start: "",
    end: "",
    notes: "Long-term cycling",
  },
  {
    id: crypto.randomUUID(),
    channel: "Neware 1-2",
    cell: "Cell B",
    owner: "Team",
    status: "reserved",
    start: "",
    end: "",
    notes: "Formation",
  },
  {
    id: crypto.randomUUID(),
    channel: "Neware 4-1",
    cell: "Cell C",
    owner: "Team",
    status: "available",
    start: "",
    end: "",
    notes: "Rate scan",
  },
  {
    id: crypto.randomUUID(),
    channel: "Neware 4-3",
    cell: "",
    owner: "",
    status: "available",
    start: "",
    end: "",
    notes: "Ready",
  },
];

const statusMeta = {
  running: { label: "Running", color: "#20a464" },
  reserved: { label: "Reserved", color: "#e7b10a" },
  available: { label: "Available", color: "#0d8f7a" },
  maintenance: { label: "Maintenance", color: "#f05d48" },
};

const el = {
  tabs: document.querySelectorAll(".nav-tab"),
  views: document.querySelectorAll(".view"),
  sessionSummary: document.querySelector("#sessionSummary"),
  channelGrid: document.querySelector("#channelGrid"),
  reservationSearch: document.querySelector("#reservationSearch"),
  statusFilter: document.querySelector("#statusFilter"),
  addReservationBtn: document.querySelector("#addReservationBtn"),
  exportReservationsBtn: document.querySelector("#exportReservationsBtn"),
  dialog: document.querySelector("#reservationDialog"),
  form: document.querySelector("#reservationForm"),
  reservationId: document.querySelector("#reservationId"),
  channelInput: document.querySelector("#channelInput"),
  cellInput: document.querySelector("#cellInput"),
  ownerInput: document.querySelector("#ownerInput"),
  reservationStatusInput: document.querySelector("#reservationStatusInput"),
  startInput: document.querySelector("#startInput"),
  endInput: document.querySelector("#endInput"),
  notesInput: document.querySelector("#notesInput"),
  deleteReservationBtn: document.querySelector("#deleteReservationBtn"),
  dropZone: document.querySelector("#dropZone"),
  fileInput: document.querySelector("#fileInput"),
  datasetSelect: document.querySelector("#datasetSelect"),
  sheetSelect: document.querySelector("#sheetSelect"),
  xColumnSelect: document.querySelector("#xColumnSelect"),
  yColumnSelect: document.querySelector("#yColumnSelect"),
  plotMode: document.querySelector("#plotMode"),
  plotCanvas: document.querySelector("#plotCanvas"),
  datasetStats: document.querySelector("#datasetStats"),
  exportPlotBtn: document.querySelector("#exportPlotBtn"),
  exportSelectedCsvBtn: document.querySelector("#exportSelectedCsvBtn"),
  exportWorkbookZipBtn: document.querySelector("#exportWorkbookZipBtn"),
  previewTable: document.querySelector("#previewTable"),
  schemaList: document.querySelector("#schemaList"),
  massInput: document.querySelector("#massInput"),
  capacityInput: document.querySelector("#capacityInput"),
  currentInput: document.querySelector("#currentInput"),
  nominalInput: document.querySelector("#nominalInput"),
  calcResults: document.querySelector("#calcResults"),
};

function boot() {
  state.reservations = loadReservations();
  bindNavigation();
  bindReservations();
  bindFiles();
  bindCalculator();
  renderReservations();
  renderEmptyPlot();
  calculate();

  const activeView = localStorage.getItem(VIEW_KEY) || "channels";
  switchView(activeView);
}

function bindNavigation() {
  el.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });
}

function switchView(viewId) {
  el.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewId));
  el.views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  localStorage.setItem(VIEW_KEY, viewId);
  if (viewId === "plot" && state.datasets.length) {
    window.setTimeout(renderPlot, 60);
  }
}

function loadReservations() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) && saved.length ? saved : sampleReservations;
  } catch {
    return sampleReservations;
  }
}

function saveReservations() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.reservations));
}

function bindReservations() {
  el.addReservationBtn.addEventListener("click", () => openReservationDialog());
  el.exportReservationsBtn.addEventListener("click", exportReservations);
  el.reservationSearch.addEventListener("input", renderReservations);
  el.statusFilter.addEventListener("change", renderReservations);

  el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = el.reservationId.value || crypto.randomUUID();
    const payload = {
      id,
      channel: el.channelInput.value.trim(),
      cell: el.cellInput.value.trim(),
      owner: el.ownerInput.value.trim(),
      status: el.reservationStatusInput.value,
      start: el.startInput.value,
      end: el.endInput.value,
      notes: el.notesInput.value.trim(),
    };
    const index = state.reservations.findIndex((item) => item.id === id);
    if (index >= 0) {
      state.reservations[index] = payload;
    } else {
      state.reservations.push(payload);
    }
    saveReservations();
    renderReservations();
    el.dialog.close();
  });

  el.deleteReservationBtn.addEventListener("click", () => {
    const id = el.reservationId.value;
    state.reservations = state.reservations.filter((item) => item.id !== id);
    saveReservations();
    renderReservations();
    el.dialog.close();
  });
}

function renderReservations() {
  const query = el.reservationSearch.value.trim().toLowerCase();
  const status = el.statusFilter.value;
  const cards = state.reservations
    .filter((item) => status === "all" || item.status === status)
    .filter((item) => {
      const haystack = [item.channel, item.cell, item.owner, item.notes].join(" ").toLowerCase();
      return !query || haystack.includes(query);
    })
    .sort((a, b) => a.channel.localeCompare(b.channel, undefined, { numeric: true }));

  el.channelGrid.innerHTML = cards.map(reservationCard).join("");
  el.channelGrid.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.reservations.find((entry) => entry.id === button.dataset.edit);
      openReservationDialog(item);
    });
  });
}

function reservationCard(item) {
  const meta = statusMeta[item.status] || statusMeta.available;
  return `
    <article class="channel-card" style="--status-color: ${meta.color}">
      <div class="channel-top">
        <div class="channel-title">
          <strong>${escapeHtml(item.channel)}</strong>
          <span>${escapeHtml(item.cell || "No sample assigned")}</span>
        </div>
        <span class="status-pill">${meta.label}</span>
      </div>
      <div class="meta-row">
        <span>Owner</span>
        <strong>${escapeHtml(item.owner || "Unassigned")}</strong>
      </div>
      <div class="meta-row">
        <span>Window</span>
        <strong>${formatWindow(item.start, item.end)}</strong>
      </div>
      <div class="meta-row">
        <span>Notes</span>
        <strong>${escapeHtml(item.notes || "-")}</strong>
      </div>
      <div class="channel-actions">
        <button class="mini-button" data-edit="${item.id}" title="Edit reservation">Edit</button>
      </div>
    </article>
  `;
}

function openReservationDialog(item = null) {
  el.reservationId.value = item?.id || "";
  el.channelInput.value = item?.channel || "";
  el.cellInput.value = item?.cell || "";
  el.ownerInput.value = item?.owner || "";
  el.reservationStatusInput.value = item?.status || "reserved";
  el.startInput.value = item?.start || "";
  el.endInput.value = item?.end || "";
  el.notesInput.value = item?.notes || "";
  el.deleteReservationBtn.style.visibility = item ? "visible" : "hidden";
  el.dialog.showModal();
}

function exportReservations() {
  const rows = [
    ["Channel", "Cell", "Owner", "Status", "Start", "End", "Notes"],
    ...state.reservations.map((item) => [
      item.channel,
      item.cell,
      item.owner,
      item.status,
      item.start,
      item.end,
      item.notes,
    ]),
  ];
  downloadText("batbat_channel_reservations.csv", toCsv(rows));
}

function bindFiles() {
  el.fileInput.addEventListener("change", (event) => handleFiles([...event.target.files]));
  ["dragenter", "dragover"].forEach((name) => {
    el.dropZone.addEventListener(name, (event) => {
      event.preventDefault();
      el.dropZone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach((name) => {
    el.dropZone.addEventListener(name, (event) => {
      event.preventDefault();
      el.dropZone.classList.remove("dragover");
    });
  });
  el.dropZone.addEventListener("drop", (event) => handleFiles([...event.dataTransfer.files]));

  el.datasetSelect.addEventListener("change", () => {
    state.selectedDatasetId = el.datasetSelect.value;
    const dataset = getSelectedDataset();
    state.selectedSheet = preferredSheetName(dataset);
    renderDatasetControls();
  });
  el.sheetSelect.addEventListener("change", () => {
    state.selectedSheet = el.sheetSelect.value;
    renderColumnControls();
    renderPlot();
    renderPreview();
  });
  el.xColumnSelect.addEventListener("change", renderPlot);
  el.yColumnSelect.addEventListener("change", renderPlot);
  el.plotMode.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.plotMode = button.dataset.mode;
      el.plotMode.querySelectorAll("button").forEach((entry) => {
        entry.classList.toggle("active", entry === button);
      });
      renderPlot();
    });
  });
  el.exportPlotBtn.addEventListener("click", exportPlot);
  el.exportSelectedCsvBtn.addEventListener("click", exportSelectedCsv);
  el.exportWorkbookZipBtn.addEventListener("click", exportAllCsv);
}

async function handleFiles(files) {
  const usable = files.filter((file) => /\.(xlsx|xls|csv|tsv)$/i.test(file.name));
  if (!usable.length) return;

  const parsed = [];
  for (const file of usable) {
    parsed.push(await parseFile(file));
  }
  state.datasets.push(...parsed);
  state.selectedDatasetId = parsed[0].id;
  state.selectedSheet = preferredSheetName(parsed[0]);
  updateSessionSummary();
  renderDatasetControls();
  switchView("plot");
}

async function parseFile(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  const id = crypto.randomUUID();
  if (extension === "csv" || extension === "tsv") {
    const text = await file.text();
    const delimiter = extension === "tsv" ? "\t" : detectDelimiter(text);
    return {
      id,
      name: file.name,
      sheets: {
        data: normalizeRows(parseDelimited(text, delimiter)),
      },
    };
  }

  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array", cellDates: false, nodim: true });
  const sheets = {};
  workbook.SheetNames.forEach((name) => {
    const sheet = workbook.Sheets[name];
    repairSheetRange(sheet);
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });
    sheets[name] = normalizeRows(rows);
  });
  return { id, name: file.name, sheets };
}

function repairSheetRange(sheet) {
  const refs = Object.keys(sheet)
    .filter((key) => /^[A-Z]+[0-9]+$/.test(key))
    .map((key) => XLSX.utils.decode_cell(key));
  if (!refs.length) return;
  const range = refs.reduce(
    (acc, ref) => ({
      s: { r: Math.min(acc.s.r, ref.r), c: Math.min(acc.s.c, ref.c) },
      e: { r: Math.max(acc.e.r, ref.r), c: Math.max(acc.e.c, ref.c) },
    }),
    { s: refs[0], e: refs[0] },
  );
  sheet["!ref"] = XLSX.utils.encode_range(range);
}

function normalizeRows(rows) {
  const compact = rows.filter((row) => row.some((value) => value !== null && value !== ""));
  if (!compact.length) return { headers: [], rows: [], rowCount: 0 };
  const headers = compact[0].map((header, index) => cleanHeader(header, index));
  const body = compact.slice(1).map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = normalizeValue(row[index]);
    });
    return item;
  });
  return { headers, rows: body, rowCount: body.length };
}

function cleanHeader(value, index) {
  const fallback = `Column ${index + 1}`;
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).trim().replace(/\s+/g, " ");
}

function normalizeValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value;
  const text = String(value).trim();
  if (!text) return "";
  const numeric = Number(text.replace(",", "."));
  if (/^-?\d+([.,]\d+)?(e-?\d+)?$/i.test(text) && Number.isFinite(numeric)) return numeric;
  return text;
}

function renderDatasetControls() {
  el.datasetSelect.innerHTML = state.datasets
    .map((dataset) => `<option value="${dataset.id}">${escapeHtml(dataset.name)}</option>`)
    .join("");
  el.datasetSelect.value = state.selectedDatasetId || "";

  const dataset = getSelectedDataset();
  if (!dataset) {
    renderEmptyPlot();
    return;
  }

  el.sheetSelect.innerHTML = Object.keys(dataset.sheets)
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("");
  el.sheetSelect.value = state.selectedSheet || preferredSheetName(dataset);
  renderColumnControls();
  renderSchema();
  renderPreview();
  renderPlot();
}

function renderColumnControls() {
  const table = getSelectedTable();
  const headers = table?.headers || [];
  const options = headers.map((header) => `<option value="${escapeHtml(header)}">${escapeHtml(header)}</option>`);
  el.xColumnSelect.innerHTML = options.join("");
  el.yColumnSelect.innerHTML = options.join("");

  const preferredX = pickColumn(headers, ["Cycle Index", "Total Time", "Time", "Date", "DataPoint"]) || headers[0];
  const preferredY =
    pickColumn(headers, ["Voltage(V)", "DChg. Cap.(Ah)", "Capacity(Ah)", "Current(A)"]) || headers[1];
  el.xColumnSelect.value = preferredX || "";
  [...el.yColumnSelect.options].forEach((option) => {
    option.selected = option.value === preferredY || option.value === "Current(A)";
  });
}

function renderPlot() {
  const dataset = getSelectedDataset();
  const table = getSelectedTable();
  if (!dataset || !table || !table.rows.length || !window.Plotly) {
    renderEmptyPlot();
    return;
  }

  const xColumn = el.xColumnSelect.value;
  const yColumns = [...el.yColumnSelect.selectedOptions].map((option) => option.value);
  if (!xColumn || !yColumns.length) return;

  const traces = yColumns.map((column) => ({
    x: table.rows.map((row) => row[xColumn]),
    y: table.rows.map((row) => row[column]),
    type: "scatter",
    mode: state.plotMode,
    name: column,
    line: { width: 2.4 },
    marker: { size: 5 },
  }));

  Plotly.react(el.plotCanvas, traces, {
    title: { text: `${dataset.name} - ${state.selectedSheet}`, x: 0.03 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(255,255,255,0.72)",
    margin: { t: 60, r: 26, b: 58, l: 64 },
    xaxis: { title: xColumn, gridcolor: "#e6eee8", zerolinecolor: "#cfdad2" },
    yaxis: { title: yColumns.join(", "), gridcolor: "#e6eee8", zerolinecolor: "#cfdad2" },
    legend: { orientation: "h", y: -0.22 },
    colorway: ["#0d8f7a", "#f05d48", "#6e56cf", "#e7b10a", "#17211d"],
  }, { responsive: true, displaylogo: false });

  renderStats(table, dataset);
}

function renderEmptyPlot() {
  el.datasetStats.innerHTML = statsHtml([
    ["Files", state.datasets.length],
    ["Rows", 0],
    ["Sheets", 0],
    ["Columns", 0],
  ]);
  if (window.Plotly) {
    Plotly.react(el.plotCanvas, [], {
      annotations: [
        {
          text: "Load a Neware workbook to begin",
          showarrow: false,
          font: { size: 18, color: "#68756e" },
        },
      ],
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(255,255,255,0.65)",
      xaxis: { visible: false },
      yaxis: { visible: false },
      margin: { t: 20, r: 20, b: 20, l: 20 },
    }, { responsive: true, displaylogo: false });
  }
}

function renderStats(table, dataset) {
  el.datasetStats.innerHTML = statsHtml([
    ["File", dataset.name],
    ["Sheet", state.selectedSheet],
    ["Rows", table.rowCount.toLocaleString()],
    ["Columns", table.headers.length],
  ]);
}

function statsHtml(items) {
  return items
    .map(([label, value]) => `<div class="stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");
}

function renderSchema() {
  const dataset = getSelectedDataset();
  if (!dataset) {
    el.schemaList.innerHTML = "";
    return;
  }
  el.schemaList.innerHTML = Object.entries(dataset.sheets)
    .map(([name, table]) => {
      const preview = table.headers.slice(0, 5).join(", ");
      return `
        <div class="schema-item">
          <strong>${escapeHtml(name)}</strong>
          <span>${table.rowCount.toLocaleString()} rows - ${table.headers.length} columns</span>
          <span>${escapeHtml(preview || "No columns detected")}</span>
        </div>
      `;
    })
    .join("");
}

function renderPreview() {
  const table = getSelectedTable();
  if (!table || !table.headers.length) {
    el.previewTable.innerHTML = "";
    return;
  }
  const headers = table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const rows = table.rows
    .slice(0, 80)
    .map((row) => `<tr>${table.headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join("")}</tr>`)
    .join("");
  el.previewTable.innerHTML = `<thead><tr>${headers}</tr></thead><tbody>${rows}</tbody>`;
}

function getSelectedDataset() {
  return state.datasets.find((dataset) => dataset.id === state.selectedDatasetId);
}

function getSelectedTable() {
  const dataset = getSelectedDataset();
  if (!dataset) return null;
  return dataset.sheets[state.selectedSheet] || dataset.sheets[preferredSheetName(dataset)];
}

function preferredSheetName(dataset) {
  if (!dataset) return "";
  const names = Object.keys(dataset.sheets);
  return names.find((name) => name.toLowerCase() === "cycle")
    || names.find((name) => name.toLowerCase() === "record")
    || names[0]
    || "";
}

function pickColumn(headers, preferred) {
  return preferred.find((name) => headers.includes(name));
}

function exportSelectedCsv() {
  const table = getSelectedTable();
  if (!table) return;
  const xColumn = el.xColumnSelect.value;
  const yColumns = [...el.yColumnSelect.selectedOptions].map((option) => option.value);
  const columns = [xColumn, ...yColumns.filter((column) => column !== xColumn)];
  const rows = [columns, ...table.rows.map((row) => columns.map((column) => row[column]))];
  downloadText(`batbat_${safeName(state.selectedSheet)}_plot.csv`, toCsv(rows));
}

function exportAllCsv() {
  const dataset = getSelectedDataset();
  if (!dataset) return;
  Object.entries(dataset.sheets).forEach(([sheetName, table]) => {
    const rows = [table.headers, ...table.rows.map((row) => table.headers.map((header) => row[header]))];
    downloadText(`${safeName(dataset.name)}_${safeName(sheetName)}.csv`, toCsv(rows));
  });
}

function exportPlot() {
  if (!window.Plotly) return;
  Plotly.downloadImage(el.plotCanvas, {
    format: "png",
    filename: "batbat_plot",
    width: 1600,
    height: 960,
    scale: 2,
  });
}

function bindCalculator() {
  [el.massInput, el.capacityInput, el.currentInput, el.nominalInput].forEach((input) => {
    input.addEventListener("input", calculate);
  });
}

function calculate() {
  const massMg = Number(el.massInput.value);
  const capacityAh = Number(el.capacityInput.value);
  const currentA = Number(el.currentInput.value);
  const nominal = Number(el.nominalInput.value);
  const massG = massMg / 1000;
  const capacityMah = capacityAh * 1000;
  const specificCapacity = massG ? capacityMah / massG : 0;
  const nominalCapacityAh = (nominal * massG) / 1000;
  const cRate = nominalCapacityAh ? Math.abs(currentA) / nominalCapacityAh : 0;

  el.calcResults.innerHTML = [
    ["Specific capacity", `${formatNumber(specificCapacity)} mAh/g`],
    ["Capacity", `${formatNumber(capacityMah)} mAh`],
    ["Nominal capacity", `${formatNumber(nominalCapacityAh * 1000)} mAh`],
    ["C-rate", `${formatNumber(cRate)} C`],
  ]
    .map(([label, value]) => `<div class="result-card"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function updateSessionSummary() {
  const rows = state.datasets.reduce((sum, dataset) => {
    return sum + Object.values(dataset.sheets).reduce((inner, table) => inner + table.rowCount, 0);
  }, 0);
  el.sessionSummary.textContent = `${state.datasets.length} file(s), ${rows.toLocaleString()} parsed rows`;
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const comma = (firstLine.match(/,/g) || []).length;
  const semicolon = (firstLine.match(/;/g) || []).length;
  const tab = (firstLine.match(/\t/g) || []).length;
  if (tab > comma && tab > semicolon) return "\t";
  return semicolon > comma ? ";" : ",";
}

function parseDelimited(text, delimiter) {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => splitDelimitedLine(line, delimiter));
}

function splitDelimitedLine(line, delimiter) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = value === null || value === undefined ? "" : String(value);
          return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(","),
    )
    .join("\n");
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function safeName(value) {
  return String(value || "data")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function formatWindow(start, end) {
  if (!start && !end) return "Open";
  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
}

function formatDateTime(value) {
  if (!value) return "?";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat(undefined, { maximumSignificantDigits: 5 }).format(value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

boot();

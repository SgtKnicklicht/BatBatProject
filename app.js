const STORAGE_KEY = "batbat.reservations.v2";
const HISTORY_KEY = "batbat.reservationHistory.v1";
const PROFILE_KEY = "batbat.profile.v1";
const MEMBER_KEY = "batbat.members.v1";
const VIEW_KEY = "batbat.activeView.v1";
const CALC_STANDARDS_KEY = "batbat.calculatorStandards.v1";
const CHANNEL_COLUMNS = 8;
const CHANNEL_ROWS = 5;
const ACTIVE_CHANNELS = CHANNEL_COLUMNS * CHANNEL_ROWS;
const DEFAULT_TEAM_MEMBERS = [
  { id: "tom", name: "Tom", color: "#5b02a3" },
  { id: "member-2", name: "Member 2", color: "#f0f921" },
  { id: "member-3", name: "Member 3", color: "#cc4778" },
  { id: "member-4", name: "Member 4", color: "#fdb42f" },
];
const DEFAULT_CALC_STANDARDS = {
  materials: {
    graphite: { label: "Graphite", capacity: 372 },
    nmc: { label: "NMC / layered oxide", capacity: 180 },
    lfp: { label: "LFP", capacity: 160 },
    custom: { label: "Custom", capacity: 372 },
  },
  foils: {
    al15: { label: "Al foil", diameter: 15, mass: 7.127 },
    cu15: { label: "Cu foil", diameter: 15, mass: 43 },
    custom15: { label: "Custom foil", diameter: 15, mass: 43 },
  },
};
const PLOT_METHODS = {
  cv: { short: "I-V", label: "I vs V", hint: "CV current vs voltage", colors: ["#3b3b3b", "#ef4444", "#2563eb", "#9c179e"] },
  cd: { short: "V-Cap", label: "V vs Cap / Spec Cap", hint: "voltage vs capacity or specific capacity", colors: ["#0d0887", "#5b02a3", "#9c179e", "#cc4778"] },
  "cd-time": { short: "V-t", label: "V vs t", hint: "voltage vs total time", colors: ["#0d0887", "#5b02a3", "#9c179e", "#cc4778"] },
  "v-cycle": { short: "V-#", label: "V vs #", hint: "voltage vs cycle or point index", colors: ["#0d0887", "#5b02a3", "#9c179e", "#cc4778"] },
  rate: { short: "Cap/CE", label: "Spec Cap + CE vs #", hint: "specific capacity and CE vs cycle index", colors: ["#ef4444", "#111111", "#2563eb", "#ed7953"] },
  "rate-time": { short: "Cap/CE-t", label: "Spec Cap + CE vs t", hint: "specific capacity and CE vs total time", colors: ["#ef4444", "#111111", "#2563eb", "#ed7953"] },
  dqdv: { short: "dQ/dV", label: "dQ/dV", hint: "derivative from CD data", colors: ["#7e03a8", "#cc4778", "#ed7953", "#1f6feb"] },
  eis: { short: "EIS", hint: "Nyquist", colors: ["#0d0887", "#2563eb", "#22a7f0", "#5b02a3"] },
  gitt: { short: "GITT", label: "GITT V vs t", hint: "GITT voltage vs time", colors: ["#ed7953", "#fdb42f", "#cc4778", "#5b02a3"] },
  custom: { short: "Custom", hint: "custom axes", colors: ["#0d0887", "#9c179e", "#ed7953", "#f0f921"] },
};
const PLOT_FAMILIES = {
  voltage: { label: "Voltage", methods: ["cd-time", "v-cycle", "cd"] },
  cv: { label: "CV", methods: ["cv"] },
  capacity: { label: "Cap + CE", methods: ["rate"] },
  dqdv: { label: "dQ/dV", methods: ["dqdv"] },
  eis: { label: "EIS", methods: ["eis"] },
  gitt: { label: "GITT", methods: ["gitt"] },
  custom: { label: "Custom", methods: ["custom"] },
};
const DATASET_TYPES = {
  cv: "CV",
  cd: "CD",
  rate: "Rate",
  dqdv: "dQ/dV",
  eis: "EIS",
  gitt: "GITT",
  custom: "Custom",
  metadata: "Notes",
};

const state = {
  reservations: [],
  reservationHistory: [],
  selectedChannels: new Set(),
  lastSelectedChannel: null,
  openChannel: null,
  menuChannel: null,
  clickTimer: null,
  teamMembers: [...DEFAULT_TEAM_MEMBERS],
  calcStandards: cloneCalcStandards(),
  profile: {
    memberId: "tom",
    name: "Tom",
    color: "#5b02a3",
  },
  datasets: [],
  selectedDatasetId: null,
  selectedSheet: null,
  plotMode: "lines",
  plotTheme: "light",
  plotFamily: "cv",
  plotMethod: "cv",
  plot3d: false,
  plotAutoColor: true,
  plotColor: "#2563eb",
  plotLineWidth: 2.4,
  plotMarkerSize: 5,
  plotGradient: "plasma",
  plotOverlayFiles: false,
  cycleFilter: "",
  cycleStep: 1,
  dqdvSmoothing: "sg",
  dqdvWindow: 9,
  dqdvPolynomial: 2,
  dqdvBinMv: 0,
  dqdvPostWindow: 0,
  dqdvMinDvMv: 0.05,
  dqdvShowRaw: false,
};

const el = {
  tabs: document.querySelectorAll(".nav-tab"),
  views: document.querySelectorAll(".view"),
  sessionSummary: document.querySelector("#sessionSummary"),
  channelGrid: document.querySelector("#channelGrid"),
  exportReservationsBtn: document.querySelector("#exportReservationsBtn"),
  exportHistoryBtn: document.querySelector("#exportHistoryBtn"),
  historyList: document.querySelector("#historyList"),
  selectedChannelsText: document.querySelector("#selectedChannelsText"),
  batteryNameInput: document.querySelector("#batteryNameInput"),
  activeMassInput: document.querySelector("#activeMassInput"),
  channelDetailsInput: document.querySelector("#channelDetailsInput"),
  clearSelectionBtn: document.querySelector("#clearSelectionBtn"),
  releaseChannelsBtn: document.querySelector("#releaseChannelsBtn"),
  applyDetailsBtn: document.querySelector("#applyDetailsBtn"),
  memberList: document.querySelector("#memberList"),
  memberNameInput: document.querySelector("#memberNameInput"),
  memberColorInput: document.querySelector("#memberColorInput"),
  addMemberBtn: document.querySelector("#addMemberBtn"),
  channelDetailOverlay: document.querySelector("#channelDetailOverlay"),
  detailPanel: document.querySelector("#detailPanel"),
  closeDetailBtn: document.querySelector("#closeDetailBtn"),
  channelActionMenu: document.querySelector("#channelActionMenu"),
  dropZone: document.querySelector("#dropZone"),
  fileInput: document.querySelector("#fileInput"),
  datasetSelect: document.querySelector("#datasetSelect"),
  importedFileList: document.querySelector("#importedFileList"),
  sheetSelect: document.querySelector("#sheetSelect"),
  xColumnSelect: document.querySelector("#xColumnSelect"),
  yColumnSelect: document.querySelector("#yColumnSelect"),
  plotMode: document.querySelector("#plotMode"),
  plotTheme: document.querySelector("#plotTheme"),
  plotFamilyTabs: document.querySelector("#plotFamilyTabs"),
  plotVariantTabs: document.querySelector("#plotVariantTabs"),
  plotMethodSelect: document.querySelector("#plotMethodSelect"),
  plotBatteryNameInput: document.querySelector("#plotBatteryNameInput"),
  plotActiveMassInput: document.querySelector("#plotActiveMassInput"),
  plot3dToggleBtn: document.querySelector("#plot3dToggleBtn"),
  plotOverlayInput: document.querySelector("#plotOverlayInput"),
  plotAutoColorInput: document.querySelector("#plotAutoColorInput"),
  plotGradientSelect: document.querySelector("#plotGradientSelect"),
  plotGradientPreview: document.querySelector("#plotGradientPreview"),
  plotColorInput: document.querySelector("#plotColorInput"),
  plotLineWidthInput: document.querySelector("#plotLineWidthInput"),
  plotLineWidthValue: document.querySelector("#plotLineWidthValue"),
  plotMarkerSizeInput: document.querySelector("#plotMarkerSizeInput"),
  plotMarkerSizeValue: document.querySelector("#plotMarkerSizeValue"),
  advancedPlotControls: document.querySelector("#advancedPlotControls"),
  cycleControls: document.querySelector("#cycleControls"),
  cycleFilterInput: document.querySelector("#cycleFilterInput"),
  cycleStepInput: document.querySelector("#cycleStepInput"),
  dqdvControls: document.querySelector("#dqdvControls"),
  dqdvSmoothingSelect: document.querySelector("#dqdvSmoothingSelect"),
  dqdvWindowInput: document.querySelector("#dqdvWindowInput"),
  dqdvPolynomialSelect: document.querySelector("#dqdvPolynomialSelect"),
  dqdvBinInput: document.querySelector("#dqdvBinInput"),
  dqdvPostWindowInput: document.querySelector("#dqdvPostWindowInput"),
  dqdvMinDvInput: document.querySelector("#dqdvMinDvInput"),
  dqdvShowRawInput: document.querySelector("#dqdvShowRawInput"),
  plotCanvas: document.querySelector("#plotCanvas"),
  datasetStats: document.querySelector("#datasetStats"),
  exportPlotBtn: document.querySelector("#exportPlotBtn"),
  exportSelectedCsvBtn: document.querySelector("#exportSelectedCsvBtn"),
  exportWorkbookZipBtn: document.querySelector("#exportWorkbookZipBtn"),
  generateReportBtn: document.querySelector("#generateReportBtn"),
  printReportBtn: document.querySelector("#printReportBtn"),
  reportSampleInput: document.querySelector("#reportSampleInput"),
  reportBatchInput: document.querySelector("#reportBatchInput"),
  reportGraphLimit: document.querySelector("#reportGraphLimit"),
  reportNotesInput: document.querySelector("#reportNotesInput"),
  reportSheet: document.querySelector("#reportSheet"),
  previewTable: document.querySelector("#previewTable"),
  schemaList: document.querySelector("#schemaList"),
  calcOptionsBtn: document.querySelector("#calcOptionsBtn"),
  calcOptionsDialog: document.querySelector("#calcOptionsDialog"),
  closeCalcOptionsBtn: document.querySelector("#closeCalcOptionsBtn"),
  saveCalcOptionsBtn: document.querySelector("#saveCalcOptionsBtn"),
  materialPresetSelect: document.querySelector("#materialPresetSelect"),
  foilPresetSelect: document.querySelector("#foilPresetSelect"),
  materialStandardsList: document.querySelector("#materialStandardsList"),
  foilStandardsList: document.querySelector("#foilStandardsList"),
  newMaterialNameInput: document.querySelector("#newMaterialNameInput"),
  newMaterialCapacityInput: document.querySelector("#newMaterialCapacityInput"),
  addMaterialStandardBtn: document.querySelector("#addMaterialStandardBtn"),
  newFoilNameInput: document.querySelector("#newFoilNameInput"),
  newFoilDiameterInput: document.querySelector("#newFoilDiameterInput"),
  newFoilMassInput: document.querySelector("#newFoilMassInput"),
  addFoilStandardBtn: document.querySelector("#addFoilStandardBtn"),
  grossMassInput: document.querySelector("#grossMassInput"),
  emptyMassInput: document.querySelector("#emptyMassInput"),
  diameterInput: document.querySelector("#diameterInput"),
  nominalInput: document.querySelector("#nominalInput"),
  recipeAmInput: document.querySelector("#recipeAmInput"),
  recipeCarbonInput: document.querySelector("#recipeCarbonInput"),
  recipeBinderInput: document.querySelector("#recipeBinderInput"),
  recipeExtraInput: document.querySelector("#recipeExtraInput"),
  toggleBatchBtn: document.querySelector("#toggleBatchBtn"),
  batchPanel: document.querySelector("#batchPanel"),
  batchMassesInput: document.querySelector("#batchMassesInput"),
  batchResults: document.querySelector("#batchResults"),
  calcResults: document.querySelector("#calcResults"),
  rateTable: document.querySelector("#rateTable"),
  cyclerLineInput: document.querySelector("#cyclerLineInput"),
  copyCyclerLineBtn: document.querySelector("#copyCyclerLineBtn"),
};

function boot() {
  state.reservations = loadReservations();
  state.reservationHistory = loadReservationHistory();
  state.teamMembers = loadTeamMembers();
  state.calcStandards = loadCalcStandards();
  state.profile = loadProfile();
  saveTeamMembers();
  saveProfile(state.profile.memberId);
  bindNavigation();
  bindReservations();
  bindFiles();
  bindReports();
  bindCalculator();
  renderMemberList();
  renderReservations();
  renderReservationHistory();
  renderImportedFileList();
  renderPlotTabs();
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
    return Array.isArray(saved)
      ? saved
          .filter((item) => Number(item.channelNumber) <= ACTIVE_CHANNELS)
          .map((item) => ({
            ...item,
            createdAt: item.createdAt || item.reservedAt || new Date().toISOString(),
            activeMass: item.activeMass || "",
          }))
      : [];
  } catch {
    return [];
  }
}

function saveReservations() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.reservations));
}

function loadReservationHistory() {
  try {
    const entries = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(entries)
      ? entries.filter((item) => item && Number(item.channelNumber) <= ACTIVE_CHANNELS)
      : [];
  } catch {
    return [];
  }
}

function saveReservationHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(state.reservationHistory));
}

function loadTeamMembers() {
  try {
    const saved = JSON.parse(localStorage.getItem(MEMBER_KEY) || "[]");
    const members = Array.isArray(saved)
      ? saved.map(normalizeMember).filter(Boolean)
      : [];
    return members.length ? members : [...DEFAULT_TEAM_MEMBERS];
  } catch {
    return [...DEFAULT_TEAM_MEMBERS];
  }
}

function normalizeMember(member) {
  if (!member?.name?.trim()) return null;
  const migratedColor = member.id === "tom" && member.color === "#f0f921" ? "#5b02a3" : member.color;
  return {
    id: member.id || crypto.randomUUID(),
    name: member.name.trim(),
    color: /^#[0-9a-f]{6}$/i.test(migratedColor) ? migratedColor : "#5b02a3",
  };
}

function saveTeamMembers() {
  localStorage.setItem(MEMBER_KEY, JSON.stringify(state.teamMembers));
}

function cloneCalcStandards(source = DEFAULT_CALC_STANDARDS) {
  return JSON.parse(JSON.stringify(source));
}

function loadCalcStandards() {
  try {
    const saved = JSON.parse(localStorage.getItem(CALC_STANDARDS_KEY) || "{}");
    return saved.replaceDefaults ? normalizeCalcStandards(saved) : mergeCalcStandards(saved);
  } catch {
    return cloneCalcStandards();
  }
}

function normalizeCalcStandards(saved = {}) {
  const defaults = cloneCalcStandards();
  const materials = {};
  Object.entries(saved.materials || {}).forEach(([key, material]) => {
    const capacity = readPositiveStandard(material?.capacity, NaN);
    if (!Number.isFinite(capacity)) return;
    materials[key] = {
      label: cleanStandardLabel(material?.label || key, "Material"),
      capacity,
    };
  });
  const foils = {};
  Object.entries(saved.foils || {}).forEach(([key, foil]) => {
    const diameter = readPositiveStandard(foil?.diameter, NaN);
    const mass = readPositiveStandard(foil?.mass, NaN);
    if (!Number.isFinite(diameter) || !Number.isFinite(mass)) return;
    foils[key] = {
      label: cleanStandardLabel(foil?.label || key, "Foil"),
      diameter,
      mass,
    };
  });
  return {
    materials: Object.keys(materials).length ? materials : defaults.materials,
    foils: Object.keys(foils).length ? foils : defaults.foils,
  };
}

function mergeCalcStandards(saved = {}) {
  const merged = cloneCalcStandards();
  Object.entries(saved.materials || {}).forEach(([key, material]) => {
    const id = standardId(key || material?.label || "material", merged.materials);
    const fallback = merged.materials[key] || DEFAULT_CALC_STANDARDS.materials.graphite;
    const capacity = readPositiveStandard(material?.capacity, fallback.capacity);
    merged.materials[id] = {
      label: cleanStandardLabel(material?.label || fallback.label || key, "Material"),
      capacity,
    };
  });
  Object.entries(saved.foils || {}).forEach(([key, foil]) => {
    const migratedKey = key === "al" ? "al15" : key === "cu" ? "cu15" : key === "custom" ? "custom15" : key;
    const id = standardId(migratedKey || foil?.label || "foil", merged.foils);
    const fallback = merged.foils[migratedKey] || merged.foils[key] || DEFAULT_CALC_STANDARDS.foils.al15;
    const savedDiameter = readNumber(foil?.diameter);
    const savedMass = readNumber(foil?.mass);
    const isOldDefaultFoil = !Number.isFinite(savedDiameter) && ["al", "cu", "custom"].includes(key) && savedMass === 43;
    const diameter = readPositiveStandard(savedDiameter, fallback.diameter || 15);
    const mass = isOldDefaultFoil ? fallback.mass : readPositiveStandard(savedMass, fallback.mass);
    merged.foils[id] = {
      label: cleanStandardLabel(foil?.label || fallback.label || key, "Foil"),
      diameter,
      mass,
    };
  });
  return merged;
}

function standardId(seed, existing = {}) {
  const base = String(seed || "standard")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36) || "standard";
  let id = base;
  let counter = 2;
  while (existing[id] && id !== seed) {
    id = `${base}-${counter}`;
    counter += 1;
  }
  return id;
}

function cleanStandardLabel(value, fallback) {
  const label = String(value || "").trim();
  return label || fallback;
}

function readPositiveStandard(value, fallback) {
  const parsed = readNumber(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function saveCalcStandards() {
  localStorage.setItem(CALC_STANDARDS_KEY, JSON.stringify({ ...state.calcStandards, replaceDefaults: true }));
}

function loadProfile() {
  try {
    const saved = { ...state.profile, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") };
    const member = activeMember(saved.memberId);
    return member ? { memberId: member.id, name: member.name, color: member.color } : state.profile;
  } catch {
    return state.profile;
  }
}

function saveProfile(memberId = state.profile.memberId) {
  const member = activeMember(memberId);
  state.profile = { memberId: member.id, name: member.name, color: member.color };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile));
}

function activeMember(memberId = state.profile.memberId) {
  return state.teamMembers.find((member) => member.id === memberId) || state.teamMembers[0];
}

function channelLabel(channelNumber) {
  const row = Math.floor((channelNumber - 1) / CHANNEL_COLUMNS) + 1;
  const column = ((channelNumber - 1) % CHANNEL_COLUMNS) + 1;
  return `${row}-${column}`;
}

function bindReservations() {
  el.exportReservationsBtn?.addEventListener("click", exportReservations);
  el.exportHistoryBtn.addEventListener("click", exportReservationHistory);
  el.addMemberBtn.addEventListener("click", addTeamMember);
  el.memberNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addTeamMember();
  });
  el.memberList.addEventListener("input", handleMemberInput);
  el.memberList.addEventListener("change", handleMemberInput);
  el.memberList.addEventListener("click", handleMemberClick);
  el.clearSelectionBtn.addEventListener("click", () => {
    state.selectedChannels.clear();
    state.lastSelectedChannel = null;
    syncSelectionInputs();
    renderReservations();
  });
  el.releaseChannelsBtn.addEventListener("click", releaseSelectedChannels);
  el.applyDetailsBtn.addEventListener("click", applySelectedChannelDetails);
  el.closeDetailBtn.addEventListener("click", closeChannelDetails);
  el.channelDetailOverlay.addEventListener("click", (event) => {
    if (event.target === el.channelDetailOverlay) closeChannelDetails();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeChannelDetails();
      closeChannelMenu();
      if (!isTypingTarget(event.target) && state.selectedChannels.size) {
        state.selectedChannels.clear();
        state.lastSelectedChannel = null;
        syncSelectionInputs();
        renderReservations();
      }
    }
  });
  document.addEventListener("click", (event) => {
    if (
      !event.target.closest(".channel-action-menu") &&
      !event.target.closest(".channel-square")
    ) {
      closeChannelMenu();
    }
  });
  el.channelActionMenu.addEventListener("click", handleChannelMenuAction);
}

function renderMemberList() {
  el.memberList.innerHTML = state.teamMembers
    .map((member, index) => {
      const checked = member.id === state.profile.memberId ? "checked" : "";
      const canRemove = state.teamMembers.length > 1 ? "" : "disabled";
      const moveUp = index === 0 ? "disabled" : "";
      const moveDown = index === state.teamMembers.length - 1 ? "disabled" : "";
      return `
        <div class="member-row" data-member="${escapeHtml(member.id)}">
          <label class="member-active" title="Quick-reserve member">
            <input type="radio" name="activeMember" data-action="set-active" ${checked} />
            <span style="--member-color: ${escapeHtml(member.color)}"></span>
          </label>
          <input class="member-name" data-action="rename" value="${escapeHtml(member.name)}" aria-label="Member name" />
          <input class="member-color" type="color" data-action="recolor" value="${escapeHtml(member.color)}" aria-label="Member color" />
          <div class="member-tools">
            <button data-action="move-up" ${moveUp}>Up</button>
            <button data-action="move-down" ${moveDown}>Down</button>
            <button data-action="remove" ${canRemove}>Remove</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function addTeamMember() {
  const name = el.memberNameInput.value.trim();
  if (!name) return;
  const member = normalizeMember({
    name,
    color: el.memberColorInput.value || "#f0f921",
  });
  if (!member) return;
  state.teamMembers.push(member);
  saveTeamMembers();
  saveProfile(member.id);
  el.memberNameInput.value = "";
  renderMemberList();
  renderReservations();
}

function handleMemberInput(event) {
  const row = event.target.closest("[data-member]");
  const action = event.target.dataset.action;
  if (!row || !action) return;
  const member = state.teamMembers.find((item) => item.id === row.dataset.member);
  if (!member) return;
  const oldName = member.name;
  const oldColor = member.color;

  if (action === "set-active" && event.target.checked) {
    saveProfile(member.id);
  }

  if (action === "rename") {
    member.name = event.target.value.trim() || member.name;
  }

  if (action === "recolor") {
    member.color = event.target.value;
  }

  state.reservations.forEach((reservation) => {
    const matchesMember = reservation.memberId === member.id
      || (reservation.owner === oldName && reservation.color === oldColor);
    if (matchesMember) {
      reservation.memberId = member.id;
      reservation.owner = member.name;
      reservation.color = member.color;
    }
  });

  saveTeamMembers();
  saveReservations();
  saveProfile(state.profile.memberId);
  renderReservations();
}

function handleMemberClick(event) {
  const button = event.target.closest("button[data-action]");
  const row = event.target.closest("[data-member]");
  if (!button || !row) return;
  const index = state.teamMembers.findIndex((member) => member.id === row.dataset.member);
  if (index < 0) return;

  if (button.dataset.action === "move-up" && index > 0) {
    [state.teamMembers[index - 1], state.teamMembers[index]] = [state.teamMembers[index], state.teamMembers[index - 1]];
  }

  if (button.dataset.action === "move-down" && index < state.teamMembers.length - 1) {
    [state.teamMembers[index + 1], state.teamMembers[index]] = [state.teamMembers[index], state.teamMembers[index + 1]];
  }

  if (button.dataset.action === "remove" && state.teamMembers.length > 1) {
    const [removed] = state.teamMembers.splice(index, 1);
    if (removed.id === state.profile.memberId) saveProfile(state.teamMembers[0].id);
  }

  saveTeamMembers();
  renderMemberList();
}

function renderReservations() {
  const reservationsByChannel = new Map(state.reservations.map((item) => [item.channelNumber, item]));
  const cells = Array.from({ length: ACTIVE_CHANNELS }, (_, index) => {
    const channelNumber = index + 1;
    const reservation = reservationsByChannel.get(channelNumber);
    const isSelected = state.selectedChannels.has(channelNumber);
    return channelSquare(channelNumber, reservation, isSelected);
  });

  el.channelGrid.innerHTML = cells.join("");
  el.channelGrid.querySelectorAll(".channel-square").forEach((button) => {
    button.addEventListener("click", (event) => handleChannelClick(event, Number(button.dataset.channel)));
    button.addEventListener("dblclick", (event) => {
      event.preventDefault();
      clearChannelClickTimer();
      openChannelMenu(Number(button.dataset.channel), button);
    });
  });
  syncSelectionInputs();
}

function renderReservationHistory() {
  if (!el.historyList) return;
  const recent = state.reservationHistory
    .slice()
    .sort((a, b) => new Date(b.releasedAt || 0) - new Date(a.releasedAt || 0))
    .slice(0, 8);

  el.historyList.innerHTML = recent.length
    ? recent.map(historyItemHtml).join("")
    : `<div class="history-empty">Released reservations will appear here automatically.</div>`;
}

function historyItemHtml(item) {
  const battery = item.battery || "No battery";
  const duration = formatDuration(item.createdAt, item.releasedAt);
  return `
    <div class="history-item">
      <span>${escapeHtml(channelLabel(item.channelNumber))}</span>
      <strong>${escapeHtml(battery)}</strong>
      <em>${escapeHtml(item.owner || "Unknown")} / ${escapeHtml(duration)}</em>
    </div>
  `;
}

function channelSquare(channelNumber, reservation, isSelected) {
  const label = channelLabel(channelNumber);
  const color = reservation?.color || "#20132e";
  const owner = reservation?.owner || "";
  const battery = reservation?.battery || "";
  const classes = [
    "channel-square",
    reservation ? "reserved" : "",
    isSelected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <button
      class="${classes}"
      data-channel="${channelNumber}"
      style="--channel-color: ${escapeHtml(color)}"
      title="Channel ${label}"
    >
      <span class="channel-number">${label}</span>
      <strong>${escapeHtml(battery || (reservation ? owner : ""))}</strong>
      <em>${escapeHtml(battery && owner ? owner : "")}</em>
    </button>
  `;
}

function handleChannelClick(event, channelNumber) {
  const rangeSelect = event.shiftKey && state.lastSelectedChannel;
  const toggleSelect = event.ctrlKey || event.metaKey;
  clearChannelClickTimer();

  if (!rangeSelect && !toggleSelect) {
    if (event.detail > 1) return;
    state.clickTimer = window.setTimeout(() => {
      state.clickTimer = null;
      fastReserveChannel(channelNumber);
    }, 320);
    return;
  }

  const channels = rangeSelect
    ? channelsBetween(state.lastSelectedChannel, channelNumber)
    : [channelNumber];

  if (rangeSelect && !toggleSelect) {
    state.selectedChannels.clear();
  }

  channels.forEach((currentChannel) => {
    if (toggleSelect && state.selectedChannels.has(currentChannel)) {
      state.selectedChannels.delete(currentChannel);
      return;
    }
    state.selectedChannels.add(currentChannel);
  });

  state.lastSelectedChannel = state.selectedChannels.size ? channelNumber : null;

  syncSelectionInputs();
  renderReservations();
}

function clearChannelClickTimer() {
  if (!state.clickTimer) return;
  clearTimeout(state.clickTimer);
  state.clickTimer = null;
}

function channelsBetween(start, end) {
  const min = Math.max(1, Math.min(start, end));
  const max = Math.min(ACTIVE_CHANNELS, Math.max(start, end));
  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}

function targetChannels(channelNumber) {
  return state.selectedChannels.has(channelNumber)
    ? [...state.selectedChannels].sort((a, b) => a - b)
    : [channelNumber];
}

function openChannelMenu(channelNumber, anchor) {
  state.menuChannel = channelNumber;
  const reservation = findReservation(channelNumber);
  const targetCount = targetChannels(channelNumber).length;
  const rect = anchor.getBoundingClientRect();
  el.channelActionMenu.innerHTML = channelMenuHtml(channelNumber, reservation, targetCount);
  el.channelActionMenu.hidden = false;
  const menuRect = el.channelActionMenu.getBoundingClientRect();
  const left = Math.min(rect.right + 10, window.innerWidth - menuRect.width - 12);
  const top = Math.min(rect.top, window.innerHeight - menuRect.height - 12);
  el.channelActionMenu.style.left = `${Math.max(12, left)}px`;
  el.channelActionMenu.style.top = `${Math.max(12, top)}px`;
  window.requestAnimationFrame(() => el.channelActionMenu.classList.add("open"));
}

function closeChannelMenu() {
  el.channelActionMenu.classList.remove("open");
  el.channelActionMenu.hidden = true;
  state.menuChannel = null;
}

function channelMenuHtml(channelNumber, reservation, targetCount) {
  return `
    <div class="menu-title">
      <strong>Channel ${channelLabel(channelNumber)}</strong>
      <span>${targetCount > 1 ? `${targetCount} selected` : reservation ? "Reserved" : "Available"}</span>
    </div>
    <div class="menu-section">
      <span>Reserve for</span>
      ${state.teamMembers.map(
        (member) => `
          <button class="menu-member" data-action="reserve" data-member="${member.id}">
            <i style="background:${member.color}"></i>
            ${escapeHtml(member.name)}
          </button>
        `,
      ).join("")}
    </div>
    <button class="menu-button" data-action="details">Add details</button>
    <button class="menu-button" data-action="view">${reservation ? "Show details" : "Open details"}</button>
    <button class="menu-button danger" data-action="free" ${reservation ? "" : "disabled"}>Free channel</button>
  `;
}

function handleChannelMenuAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button || !state.menuChannel) return;
  const action = button.dataset.action;
  const channels = targetChannels(state.menuChannel);

  if (action === "reserve") {
    const member = activeMember(button.dataset.member);
    saveProfile(member.id);
    reserveChannels(channels, member);
    channels.forEach((channel) => state.selectedChannels.add(channel));
    renderReservations();
    closeChannelMenu();
    return;
  }

  if (action === "free") {
    releaseReservation(state.menuChannel);
    state.selectedChannels.clear();
    state.lastSelectedChannel = null;
    renderReservations();
    closeChannelMenu();
    return;
  }

  if (action === "details") {
    state.selectedChannels = new Set(channels);
    channels
      .filter((channel) => !findReservation(channel))
      .forEach((channel) => state.selectedChannels.add(channel));
    syncSelectionInputs();
    closeChannelMenu();
    el.batteryNameInput.focus();
    return;
  }

  if (action === "view") {
    openChannelDetails(state.menuChannel);
    closeChannelMenu();
  }
}

function fastReserveChannel(channelNumber) {
  const member = activeMember(state.profile.memberId);
  reserveChannels([channelNumber], member);
  state.selectedChannels = new Set([channelNumber]);
  state.lastSelectedChannel = channelNumber;
  renderReservations();
  closeChannelMenu();
}

function reserveChannels(channelNumbers, member = state.profile) {
  channelNumbers.forEach((channelNumber) => {
    const existing = findReservation(channelNumber);
    if (existing) {
      existing.memberId = member.id;
      existing.owner = member.name;
      existing.color = member.color;
      return;
    }
    state.reservations.push({
      id: crypto.randomUUID(),
      channelNumber,
      memberId: member.id,
      owner: member.name,
      color: member.color,
      battery: "",
      activeMass: "",
      notes: "",
      createdAt: new Date().toISOString(),
    });
  });
  saveReservations();
}

function applySelectedChannelDetails() {
  const selected = [...state.selectedChannels];
  if (!selected.length) return;
  reserveChannels(selected);
  selected.forEach((channelNumber) => {
    const reservation = findReservation(channelNumber);
    reservation.battery = el.batteryNameInput.value.trim();
    reservation.activeMass = el.activeMassInput.value.trim();
    reservation.notes = el.channelDetailsInput.value.trim();
    reservation.createdAt ||= new Date().toISOString();
  });
  saveReservations();
  renderReservations();
}

function releaseSelectedChannels() {
  const selected = [...state.selectedChannels];
  if (selected.length !== 1) return;
  releaseReservation(selected[0]);
  state.selectedChannels.clear();
  state.lastSelectedChannel = null;
  el.batteryNameInput.value = "";
  el.activeMassInput.value = "";
  el.channelDetailsInput.value = "";
  renderReservations();
}

function releaseReservation(channelNumber) {
  const reservation = findReservation(channelNumber);
  if (!reservation) return;
  appendReservationHistory(reservation);
  state.reservations = state.reservations.filter((item) => item.channelNumber !== channelNumber);
  saveReservations();
  renderReservationHistory();
}

function appendReservationHistory(reservation) {
  const releasedAt = new Date().toISOString();
  const entry = {
    historyId: crypto.randomUUID(),
    reservationId: reservation.id || "",
    channelNumber: reservation.channelNumber,
    channel: channelLabel(reservation.channelNumber),
    memberId: reservation.memberId || "",
    owner: reservation.owner || "",
    color: reservation.color || "",
    battery: reservation.battery || "",
    activeMass: reservation.activeMass || "",
    notes: reservation.notes || "",
    createdAt: reservation.createdAt || reservation.reservedAt || "",
    releasedAt,
    durationMinutes: durationMinutes(reservation.createdAt || reservation.reservedAt, releasedAt),
  };
  state.reservationHistory.push(entry);
  saveReservationHistory();
}

function syncSelectionInputs() {
  const selected = [...state.selectedChannels].sort((a, b) => a - b);
  el.selectedChannelsText.textContent = selected.length
    ? `${selected.length} selected: ${selected.map((channel) => `Ch ${channelLabel(channel)}`).join(", ")}`
    : "No channels selected";

  const selectedReservations = selected.map(findReservation).filter(Boolean);
  const commonBattery = sharedValue(selectedReservations, "battery");
  const commonMass = sharedValue(selectedReservations, "activeMass");
  const commonNotes = sharedValue(selectedReservations, "notes");
  el.batteryNameInput.value = commonBattery || "";
  el.activeMassInput.value = commonMass || "";
  el.channelDetailsInput.value = commonNotes || "";

  const releasable = selected.length === 1 && Boolean(findReservation(selected[0]));
  el.releaseChannelsBtn.disabled = !releasable;
  el.releaseChannelsBtn.textContent = selected.length > 1 ? "Release one" : "Release";
  el.releaseChannelsBtn.title = releasable
    ? `Release Ch ${channelLabel(selected[0])}`
    : "Select one reserved channel to release it";
}

function sharedValue(items, key) {
  if (!items.length) return "";
  const first = items[0][key] || "";
  return items.every((item) => (item[key] || "") === first) ? first : "";
}

function findReservation(channelNumber) {
  return state.reservations.find((item) => item.channelNumber === channelNumber);
}

function isTypingTarget(target) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
}

function openChannelDetails(channelNumber) {
  const reservation = findReservation(channelNumber);
  state.openChannel = channelNumber;
  el.detailPanel.innerHTML = channelDetailHtml(channelNumber, reservation);
  el.detailPanel.querySelector("[data-close-detail]").addEventListener("click", closeChannelDetails);
  el.channelDetailOverlay.hidden = false;
  window.requestAnimationFrame(() => {
    el.channelDetailOverlay.classList.add("open");
  });
}

function closeChannelDetails() {
  if (el.channelDetailOverlay.hidden) return;
  el.channelDetailOverlay.classList.remove("open");
  window.setTimeout(() => {
    el.channelDetailOverlay.hidden = true;
    el.detailPanel.innerHTML = "";
    state.openChannel = null;
  }, 220);
}

function channelDetailHtml(channelNumber, reservation) {
  const color = reservation?.color || "#20132e";
  return `
    <div class="detail-header" style="--channel-color: ${escapeHtml(color)}">
      <div>
        <p class="eyebrow">Neware channel</p>
        <h2>Channel ${channelLabel(channelNumber)}</h2>
      </div>
      <button class="icon-button" data-close-detail title="Close">x</button>
    </div>
    <div class="detail-grid">
      ${detailItem("Battery", reservation?.battery || "No battery name")}
      ${detailItem("Reserved by", reservation?.owner || "Available")}
      ${detailItem("Created", reservation?.createdAt ? formatFullDateTime(reservation.createdAt) : "-")}
      ${detailItem("Active mass", reservation?.activeMass || "-")}
    </div>
    <div class="detail-notes">
      <span>Details</span>
      <p>${escapeHtml(reservation?.notes || "No details added yet.")}</p>
    </div>
  `;
}

function detailItem(label, value) {
  return `<div class="detail-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function exportReservations() {
  const rows = [
    ["Channel", "Owner", "Color", "Battery", "Active Mass", "Notes", "Created At"],
    ...state.reservations
      .slice()
      .sort((a, b) => a.channelNumber - b.channelNumber)
      .map((item) => [
        channelLabel(item.channelNumber),
        item.owner,
        item.color,
        item.battery,
        item.activeMass,
        item.notes,
        item.createdAt || item.reservedAt,
      ]),
  ];
  downloadText("batbat_channel_reservations.csv", toCsv(rows));
}

function exportReservationHistory() {
  const rows = [
    ["Channel", "Owner", "Color", "Battery", "Active Mass", "Notes", "Created At", "Released At", "Duration Minutes"],
    ...state.reservationHistory
      .slice()
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
      .map((item) => [
        item.channel || channelLabel(item.channelNumber),
        item.owner,
        item.color,
        item.battery,
        item.activeMass,
        item.notes,
        item.createdAt,
        item.releasedAt,
        item.durationMinutes,
      ]),
  ];
  downloadText("batbat_channel_reservation_history.csv", toCsv(rows));
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
  el.importedFileList.addEventListener("change", handleImportedFileChange);
  el.importedFileList.addEventListener("click", handleImportedFileClick);
  el.sheetSelect.addEventListener("change", () => {
    state.selectedSheet = el.sheetSelect.value;
    renderColumnControls();
    renderPlot();
    renderPreview();
  });
  el.xColumnSelect.addEventListener("change", renderPlot);
  el.yColumnSelect.addEventListener("change", renderPlot);
  el.plotMethodSelect.addEventListener("change", () => {
    state.plotMethod = el.plotMethodSelect.value;
    state.plotFamily = familyForMethod(state.plotMethod);
    applyMethodStyleDefaults();
    syncAdvancedPlotControls();
    renderColumnControls();
    renderPlot();
  });
  el.plotFamilyTabs.addEventListener("click", handlePlotFamilyClick);
  el.plotVariantTabs.addEventListener("click", handlePlotVariantClick);
  bindDecimalInput(el.plotActiveMassInput);
  el.plotBatteryNameInput.addEventListener("input", renderPlot);
  el.plotActiveMassInput.addEventListener("input", renderPlot);
  el.plot3dToggleBtn.addEventListener("click", () => {
    state.plot3d = !state.plot3d;
    syncAdvancedPlotControls();
    renderPlot();
  });
  bindPlotStyleControls();
  el.plotMode.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.plotMode = button.dataset.mode;
      el.plotMode.querySelectorAll("button").forEach((entry) => {
        entry.classList.toggle("active", entry === button);
      });
      renderPlot();
    });
  });
  el.plotTheme.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.plotTheme = button.dataset.theme;
      el.plotTheme.querySelectorAll("button").forEach((entry) => {
        entry.classList.toggle("active", entry === button);
      });
      renderPlot();
    });
  });
  el.exportPlotBtn.addEventListener("click", exportPlot);
  el.exportSelectedCsvBtn.addEventListener("click", exportSelectedCsv);
  el.exportWorkbookZipBtn.addEventListener("click", exportAllCsv);
}

function handlePlotFamilyClick(event) {
  const button = event.target.closest("[data-family]");
  if (!button) return;
  state.plotFamily = button.dataset.family;
  state.plotMethod = PLOT_FAMILIES[state.plotFamily]?.methods[0] || "custom";
  el.plotMethodSelect.value = state.plotMethod;
  selectDatasetForFamily(state.plotFamily);
  applyMethodStyleDefaults();
  syncAdvancedPlotControls();
  renderDatasetControls();
}

function handlePlotVariantClick(event) {
  const button = event.target.closest("[data-method]");
  if (!button) return;
  state.plotMethod = button.dataset.method;
  state.plotFamily = familyForMethod(state.plotMethod);
  el.plotMethodSelect.value = state.plotMethod;
  applyMethodStyleDefaults();
  syncAdvancedPlotControls();
  renderPlotTabs();
  renderColumnControls();
  renderPlot();
}

function handleImportedFileChange(event) {
  const item = event.target.closest("[data-dataset-id]");
  if (!item) return;
  const dataset = state.datasets.find((entry) => entry.id === item.dataset.datasetId);
  if (!dataset) return;

  const action = event.target.dataset.fileAction;
  if (action === "toggle") {
    dataset.enabled = event.target.checked;
    if (!dataset.enabled && state.selectedDatasetId === dataset.id) {
      selectDatasetForFamily(state.plotFamily);
    }
  }
  if (action === "type") {
    dataset.type = event.target.value;
    dataset.methods = methodsForDatasetType(dataset.type);
    dataset.enabled = dataset.type !== "metadata";
    state.plotFamily = dataset.type === "metadata" ? state.plotFamily : datasetFamily(dataset);
    state.plotMethod = PLOT_FAMILIES[state.plotFamily]?.methods[0] || "custom";
    state.selectedDatasetId = dataset.enabled ? dataset.id : null;
    state.selectedSheet = preferredSheetName(dataset);
    applyMethodStyleDefaults();
    syncAdvancedPlotControls();
  }
  updateSessionSummary();
  renderDatasetControls();
}

function handleImportedFileClick(event) {
  const button = event.target.closest("[data-file-action]");
  const item = event.target.closest("[data-dataset-id]");
  if (!button || !item) return;
  const dataset = state.datasets.find((entry) => entry.id === item.dataset.datasetId);
  if (!dataset) return;

  if (button.dataset.fileAction === "select") {
    if (dataset.type === "metadata") return;
    dataset.enabled = true;
    state.selectedDatasetId = dataset.id;
    state.plotFamily = datasetFamily(dataset);
    state.plotMethod = PLOT_FAMILIES[state.plotFamily]?.methods[0] || "custom";
    state.selectedSheet = preferredSheetName(dataset);
    applyMethodStyleDefaults();
    syncAdvancedPlotControls();
    renderDatasetControls();
  }

  if (button.dataset.fileAction === "delete") {
    state.datasets = state.datasets.filter((entry) => entry.id !== dataset.id);
    if (state.selectedDatasetId === dataset.id) {
      selectDatasetForFamily(state.plotFamily);
    }
    updateSessionSummary();
    renderDatasetControls();
  }
}

function bindPlotStyleControls() {
  if (!el.plotAutoColorInput) return;
  const syncStyleInputs = () => {
    state.plotOverlayFiles = el.plotOverlayInput.checked;
    state.plotAutoColor = el.plotAutoColorInput.checked;
    state.plotGradient = el.plotGradientSelect.value;
    state.plotColor = el.plotColorInput.value;
    state.plotLineWidth = readNumber(el.plotLineWidthInput.value) || 2.4;
    state.plotMarkerSize = readNumber(el.plotMarkerSizeInput.value) || 5;
    state.cycleFilter = el.cycleFilterInput.value.trim();
    state.cycleStep = Math.max(1, Math.round(readNumber(el.cycleStepInput.value) || 1));
    state.dqdvSmoothing = el.dqdvSmoothingSelect.value;
    state.dqdvWindow = oddNumberInRange(readNumber(el.dqdvWindowInput.value) || 9, 5, 41);
    state.dqdvPolynomial = Math.max(2, Math.min(3, Math.round(readNumber(el.dqdvPolynomialSelect.value) || 2)));
    state.dqdvBinMv = Math.max(0, readNumber(el.dqdvBinInput.value) || 0);
    state.dqdvPostWindow = oddOrZero(readNumber(el.dqdvPostWindowInput.value) || 0, 0, 21);
    state.dqdvMinDvMv = Math.max(0.0001, readNumber(el.dqdvMinDvInput.value) || 0.05);
    state.dqdvShowRaw = el.dqdvShowRawInput.checked;
    el.plotColorInput.disabled = state.plotAutoColor;
    if (el.dqdvWindowInput.value !== String(state.dqdvWindow)) el.dqdvWindowInput.value = String(state.dqdvWindow);
    if (el.dqdvPostWindowInput.value !== String(state.dqdvPostWindow)) el.dqdvPostWindowInput.value = String(state.dqdvPostWindow);
    document.querySelector("#dqdvWindowValue").textContent = String(state.dqdvWindow);
    el.plotLineWidthValue.textContent = formatNumber(state.plotLineWidth);
    el.plotMarkerSizeValue.textContent = formatNumber(state.plotMarkerSize);
    renderGradientPreview();
    renderPlot();
  };
  el.plotOverlayInput.addEventListener("change", syncStyleInputs);
  el.plotAutoColorInput.addEventListener("change", syncStyleInputs);
  el.plotGradientSelect.addEventListener("change", syncStyleInputs);
  el.plotColorInput.addEventListener("input", syncStyleInputs);
  el.plotLineWidthInput.addEventListener("input", syncStyleInputs);
  el.plotMarkerSizeInput.addEventListener("input", syncStyleInputs);
  el.cycleFilterInput.addEventListener("input", syncStyleInputs);
  el.cycleStepInput.addEventListener("input", syncStyleInputs);
  el.dqdvSmoothingSelect.addEventListener("change", syncStyleInputs);
  el.dqdvWindowInput.addEventListener("input", syncStyleInputs);
  el.dqdvPolynomialSelect.addEventListener("change", syncStyleInputs);
  el.dqdvBinInput.addEventListener("input", syncStyleInputs);
  el.dqdvPostWindowInput.addEventListener("input", syncStyleInputs);
  el.dqdvMinDvInput.addEventListener("input", syncStyleInputs);
  el.dqdvShowRawInput.addEventListener("change", syncStyleInputs);
  bindDecimalInput(el.dqdvBinInput);
  bindDecimalInput(el.dqdvMinDvInput);
  applyMethodStyleDefaults();
  syncStyleInputs();
}

function applyMethodStyleDefaults() {
  if (!el.plotAutoColorInput?.checked) return;
  const color = plotMethodColors()[0] || "#2563eb";
  state.plotColor = color;
  if (el.plotColorInput) el.plotColorInput.value = color;
}

function bindReports() {
  el.generateReportBtn.addEventListener("click", generateReport);
  el.printReportBtn.addEventListener("click", () => {
    generateReport();
    window.setTimeout(() => window.print(), 450);
  });
}

async function handleFiles(files) {
  const usable = files.filter((file) => /\.(xlsx|xls|csv|tsv|txt)$/i.test(file.name));
  if (!usable.length) return;

  const parsed = [];
  for (const file of usable) {
    parsed.push(await parseFile(file));
  }
  state.datasets.push(...parsed);
  const firstPlottable = parsed.find((dataset) => Object.keys(dataset.sheets).length && dataset.enabled !== false) || parsed[0];
  state.selectedDatasetId = firstPlottable.id;
  state.selectedSheet = preferredSheetName(firstPlottable);
  state.plotFamily = datasetFamily(firstPlottable);
  state.plotMethod = PLOT_FAMILIES[state.plotFamily]?.methods[0] || preferredPlotMethod(firstPlottable);
  el.plotMethodSelect.value = state.plotMethod;
  syncAdvancedPlotControls();
  updateSessionSummary();
  renderDatasetControls();
  switchView("plot");
}

async function parseFile(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  const id = crypto.randomUUID();
  if (extension === "txt") {
    const text = await file.text();
    return {
      id,
      name: file.name,
      kind: "metadata",
      type: "metadata",
      enabled: true,
      metadata: parseNotes(text),
      sheets: {},
    };
  }
  if (extension === "csv" || extension === "tsv") {
    const text = await file.text();
    const delimiter = extension === "tsv" ? "\t" : detectDelimiter(text);
    const table = normalizeRows(parseDelimited(text, delimiter));
    const sheets = { data: table };
    const methods = inferDatasetMethods(file.name, sheets);
    return {
      id,
      name: file.name,
      kind: inferDatasetKind(file.name, sheets),
      type: primaryDatasetType(file.name, sheets, methods),
      methods,
      enabled: true,
      sheets,
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
  const methods = inferDatasetMethods(file.name, sheets);
  return {
    id,
    name: file.name,
    kind: inferDatasetKind(file.name, sheets),
    type: primaryDatasetType(file.name, sheets, methods),
    methods,
    enabled: true,
    sheets,
  };
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
  const numeric = readNumber(text);
  if (/^-?[\d.,]+(e-?\d+)?$/i.test(text) && Number.isFinite(numeric)) return numeric;
  return text;
}

function inferDatasetKind(name, sheets) {
  const allHeaders = Object.values(sheets).flatMap((table) => table.headers || []);
  if (allHeaders.includes("Working Electrode (V)") || allHeaders.includes("Current Density (A/m^2)")) {
    return "squidstat";
  }
  if (allHeaders.includes("DataPoint") || allHeaders.includes("Cycle Index")) {
    return "neware";
  }
  return /\.(csv|tsv)$/i.test(name) ? "table" : "workbook";
}

function inferDatasetMethods(name, sheets) {
  const headers = Object.values(sheets).flatMap((table) => table.headers || []);
  const normalizedName = String(name || "").toLowerCase();
  const methods = new Set();
  if (hasEisColumns(headers)) {
    methods.add("eis");
  }
  if (hasVoltageColumn(headers) && hasCurrentColumn(headers) && (normalizedName.includes("cv") || !hasCapacityColumn(headers))) {
    methods.add("cv");
  }
  if (hasVoltageColumn(headers) && hasCapacityColumn(headers)) {
    methods.add("cd");
    methods.add("dqdv");
  }
  if (hasVoltageColumn(headers) && (findColumn(headers, ["Cycle Index", "Cycle", "Cycle number"]) || pointIndexColumn(headers))) {
    methods.add("v-cycle");
  }
  if (hasCycleSummaryColumns(headers)) {
    methods.add("rate");
  }
  if (normalizedName.includes("gitt")) {
    methods.add("gitt");
  }
  if (!methods.size) methods.add("custom");
  return [...methods];
}

function primaryDatasetType(name, sheets, methods = inferDatasetMethods(name, sheets)) {
  const headers = Object.values(sheets).flatMap((table) => table.headers || []);
  const normalizedName = String(name || "").toLowerCase();
  if (!headers.length) return "metadata";
  if (normalizedName.includes("gitt") && methods.includes("gitt")) return "gitt";
  if ((normalizedName.includes("eis") || normalizedName.includes("nyquist")) && methods.includes("eis") && !hasCapacityColumn(headers)) return "eis";
  if (normalizedName.includes("cv") && methods.includes("cv")) return "cv";
  if ((normalizedName.includes("cd") || normalizedName.includes("cycle")) && methods.includes("cd")) return "cd";
  if (methods.includes("rate") && hasCycleSummaryColumns(headers)) return "rate";
  if (methods.includes("cd")) return "cd";
  if (methods.includes("cv")) return "cv";
  if (methods.includes("eis")) return "eis";
  if (methods.includes("gitt")) return "gitt";
  return methods[0] || "custom";
}

function methodsForDatasetType(type) {
  if (type === "metadata") return [];
  if (type === "cd") return ["cd-time", "v-cycle", "cd"];
  if (type === "rate") return ["rate"];
  return [type || "custom"];
}

function parseNotes(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { Notes: text.slice(0, 4000) };
  }
}

function renderDatasetControls() {
  renderImportedFileList();
  renderPlotTabs();
  syncAdvancedPlotControls();
  const options = datasetsForFamily(state.plotFamily);
  el.datasetSelect.innerHTML = options
    .map((dataset) => `<option value="${dataset.id}">${escapeHtml(dataset.name)} (${DATASET_TYPES[dataset.type] || dataset.type || dataset.kind})</option>`)
    .join("");
  if (!options.some((dataset) => dataset.id === state.selectedDatasetId)) {
    state.selectedDatasetId = options[0]?.id || null;
  }
  el.datasetSelect.value = state.selectedDatasetId || "";

  const dataset = getSelectedDataset();
  if (!dataset) {
    renderEmptyPlot();
    return;
  }

  el.sheetSelect.innerHTML = Object.keys(dataset.sheets)
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("");
  if (state.plotMethod !== "custom") {
    state.selectedSheet = preferredSheetName(dataset);
  }
  el.sheetSelect.value = state.selectedSheet || preferredSheetName(dataset);
  renderColumnControls();
  renderSchema();
  renderPreview();
  renderPlot();
}

function renderPlotTabs() {
  const available = availablePlotFamilies();
  el.plotFamilyTabs.innerHTML = Object.entries(PLOT_FAMILIES)
    .map(([family, config]) => {
      const count = datasetsForFamily(family).length;
      const active = family === state.plotFamily ? "active" : "";
      const empty = !available.has(family) ? " empty" : "";
      return `<button class="${active}${empty}" data-family="${family}">${config.label}<span>${count}</span></button>`;
    })
    .join("");

  const methods = PLOT_FAMILIES[state.plotFamily]?.methods || ["custom"];
  if (!methods.includes(state.plotMethod)) {
    state.plotMethod = methods[0];
    el.plotMethodSelect.value = state.plotMethod;
  }
  syncAdvancedPlotControls();
  el.plotVariantTabs.innerHTML = methods
    .map((method) => {
      const active = method === state.plotMethod ? "active" : "";
      return `<button class="${active}" data-method="${method}">${escapeHtml(PLOT_METHODS[method]?.label || PLOT_METHODS[method]?.hint || method)}</button>`;
    })
    .join("");
}

function availablePlotFamilies() {
  const families = new Set();
  state.datasets.filter(isDatasetEnabled).forEach((dataset) => {
    families.add(datasetFamily(dataset));
    if (dataset.methods?.includes("cd") || dataset.methods?.includes("v-cycle") || dataset.type === "rate") families.add("voltage");
    if (dataset.methods?.includes("dqdv") || ["cd", "rate"].includes(dataset.type)) families.add("dqdv");
  });
  if (!families.size) families.add("cv");
  return families;
}

function datasetsForFamily(family) {
  return state.datasets
    .filter(isDatasetEnabled)
    .filter((dataset) => {
      if (datasetFamily(dataset) === family) return true;
      if (family === "voltage") return dataset.methods?.includes("cd") || dataset.methods?.includes("v-cycle") || dataset.type === "rate";
      return family === "dqdv" && (dataset.methods?.includes("dqdv") || ["cd", "rate"].includes(dataset.type));
    });
}

function selectDatasetForFamily(family) {
  const match = datasetsForFamily(family)[0];
  state.selectedDatasetId = match?.id || null;
  state.selectedSheet = preferredSheetName(match);
}

function isDatasetEnabled(dataset) {
  return dataset?.enabled !== false && dataset.type !== "metadata";
}

function datasetFamily(dataset) {
  return familyForMethod(dataset?.type || preferredPlotMethod(dataset));
}

function renderImportedFileList() {
  if (!el.importedFileList) return;
  if (!state.datasets.length) {
    el.importedFileList.innerHTML = `<div class="file-empty">No files loaded</div>`;
    return;
  }

  el.importedFileList.innerHTML = state.datasets.map((dataset) => {
    const type = dataset.type || primaryDatasetType(dataset.name, dataset.sheets || {}, dataset.methods || ["custom"]);
    const active = dataset.enabled !== false;
    const selected = dataset.id === state.selectedDatasetId ? " selected" : "";
    const rows = Object.values(dataset.sheets || {}).reduce((sum, table) => sum + (table.rowCount || 0), 0);
    const typeOptions = Object.entries(DATASET_TYPES)
      .map(([value, label]) => `<option value="${value}"${value === type ? " selected" : ""}>${label}</option>`)
      .join("");
    return `
      <div class="file-item${selected}${active ? "" : " disabled"}" data-dataset-id="${dataset.id}">
        <label class="file-check" title="Include this file in plots">
          <input type="checkbox" data-file-action="toggle" ${active ? "checked" : ""} />
          <span></span>
        </label>
        <button class="file-name" data-file-action="select" title="${escapeHtml(dataset.name)}">
          <strong>${escapeHtml(dataset.name)}</strong>
          <small>${escapeHtml(DATASET_TYPES[type] || type)}${rows ? ` - ${rows.toLocaleString()} rows` : ""}</small>
        </button>
        <select class="file-type-select" data-file-action="type" title="Override detected file type">
          ${typeOptions}
        </select>
        <button class="file-delete" data-file-action="delete" title="Remove imported file">x</button>
      </div>
    `;
  }).join("");
}

function familyForMethod(method) {
  return Object.entries(PLOT_FAMILIES).find(([, config]) => config.methods.includes(method))?.[0] || "custom";
}

function renderColumnControls() {
  const dataset = getSelectedDataset();
  const table = getSelectedTable();
  const headers = table?.headers || [];
  const options = headers.map((header) => `<option value="${escapeHtml(header)}">${escapeHtml(header)}</option>`);
  el.xColumnSelect.innerHTML = options.join("");
  el.yColumnSelect.innerHTML = options.join("");

  const preset = buildPlotPreset(table);
  const preferredX = preset?.xColumn || headers[0];
  const preferredY = preset?.yColumns?.[0] || headers[1];
  el.xColumnSelect.value = preferredX || "";
  [...el.yColumnSelect.options].forEach((option) => {
    option.selected = preset?.yColumns?.includes(option.value) || option.value === preferredY;
  });
}

function renderPlot() {
  const dataset = getSelectedDataset();
  const table = getSelectedTable();
  if (!dataset || !table || !table.rows.length || !window.Plotly) {
    renderEmptyPlot();
    return;
  }

  const plotSpec = buildPlotSpec(table, dataset);
  if (!plotSpec.traces.length) {
    renderPlotMessage(plotSpec.message || "No matching columns found for this plot type.");
    renderStats(table, dataset, plotSpec);
    return;
  }
  const theme = plotThemeTokens();
  const layout = plotSpec.is3d ? plot3dLayout(plotSpec, theme) : plot2dLayout(plotSpec, theme);

  Plotly.react(el.plotCanvas, plotSpec.traces, layout, { responsive: true, displaylogo: false });

  attachMiddleAutoscale(el.plotCanvas);
  resizePlotCanvas();
  renderStats(table, dataset, plotSpec);
}

function plot2dLayout(plotSpec, theme) {
  const layout = {
    title: { text: plotSpec.title, x: 0.03 },
    paper_bgcolor: theme.paper,
    plot_bgcolor: theme.plot,
    font: { color: theme.text },
    margin: { t: 62, r: plotSpec.y2Title ? 92 : 34, b: 72, l: 86 },
    xaxis: plotAxisLayout(plotSpec.xTitle, theme),
    yaxis: plotAxisLayout(plotSpec.yTitle, theme),
    legend: {
      bgcolor: theme.legend,
      bordercolor: theme.axis,
      borderwidth: 1,
      font: { color: theme.text, size: 15 },
      x: 0.98,
      xanchor: "right",
      y: 0.02,
      yanchor: "bottom",
    },
    colorway: plotMethodColors(),
  };
  if (plotSpec.y2Title) {
    layout.yaxis2 = {
      ...plotAxisLayout(plotSpec.y2Title, theme),
      overlaying: "y",
      side: "right",
      showgrid: false,
      mirror: false,
      title: { text: plotSpec.y2Title, font: { size: 18, color: "#2563eb" } },
      tickfont: { size: 14, color: "#2563eb" },
      linecolor: "#2563eb",
      tickcolor: "#2563eb",
      zeroline: false,
    };
    if (plotSpec.y2Range) layout.yaxis2.range = plotSpec.y2Range;
  }
  return layout;
}

function plot3dLayout(plotSpec, theme) {
  return {
    title: { text: plotSpec.title, x: 0.03 },
    paper_bgcolor: theme.paper,
    plot_bgcolor: theme.plot,
    font: { color: theme.text },
    margin: { t: 62, r: 20, b: 22, l: 20 },
    scene: {
      bgcolor: theme.plot,
      xaxis: plot3dAxisLayout(plotSpec.xTitle, theme),
      yaxis: plot3dAxisLayout(plotSpec.yTitle, theme),
      zaxis: plot3dAxisLayout(plotSpec.zTitle, theme),
      camera: { eye: { x: 1.45, y: -1.75, z: 1.1 } },
      aspectmode: "cube",
    },
    legend: {
      bgcolor: theme.legend,
      bordercolor: theme.axis,
      borderwidth: 1,
      font: { color: theme.text, size: 12 },
      x: 1,
      xanchor: "right",
      y: 1,
      yanchor: "top",
    },
    colorway: plotMethodColors(),
  };
}

function renderPlotMessage(message) {
  if (!window.Plotly) return;
  const theme = plotThemeTokens();
  Plotly.react(el.plotCanvas, [], {
    annotations: [
      {
        text: message,
        showarrow: false,
        font: { size: 18, color: theme.muted },
      },
    ],
    paper_bgcolor: theme.paper,
    plot_bgcolor: theme.plot,
    font: { color: theme.text },
    xaxis: { visible: false },
    yaxis: { visible: false },
    margin: { t: 20, r: 20, b: 20, l: 20 },
  }, { responsive: true, displaylogo: false });
  resizePlotCanvas();
}

function renderEmptyPlot() {
  el.datasetStats.innerHTML = state.datasets.length
    ? "Choose a plot type and load a plottable table."
    : "Drop files to begin. CV, CD, rate scan, dQ/dV, EIS, and GITT presets will choose useful axes automatically.";
  if (window.Plotly) {
    const theme = plotThemeTokens();
    Plotly.react(el.plotCanvas, [], {
      annotations: [
        {
          text: "Load a Neware workbook to begin",
          showarrow: false,
          font: { size: 18, color: theme.muted },
        },
      ],
      paper_bgcolor: theme.paper,
      plot_bgcolor: theme.plot,
      font: { color: theme.text },
      xaxis: { visible: false },
      yaxis: { visible: false },
      margin: { t: 20, r: 20, b: 20, l: 20 },
    }, { responsive: true, displaylogo: false });
    attachMiddleAutoscale(el.plotCanvas);
    resizePlotCanvas();
  }
}

function resizePlotCanvas() {
  if (!window.Plotly || !el.plotCanvas) return;
  window.setTimeout(() => Plotly.Plots.resize(el.plotCanvas), 60);
}

function buildPlotPreset(table, method = state.plotMethod) {
  if (!table?.headers?.length) return null;
  const headers = table.headers;
  const voltage = voltageColumn(headers);
  const current = currentColumn(headers);
  const time = totalTimeColumn(headers) || findColumn(headers, ["Elapsed Time (s)", "Total Time", "Test Time", "Time", "Step Time"]);
  const charge = capacityColumn(headers);
  const cycle = findColumn(headers, ["Cycle Index", "Cycle", "Cycle number"]);
  const pointIndex = pointIndexColumn(headers);
  const dchg = findColumn(headers, ["DChg. Cap.(Ah)", "Discharge Capacity", "DChg Cap", "Capacity(Ah)"]);
  const zReal = findColumn(headers, ["Zreal", "Z Real", "Zre", "Re(Z)", "Real Impedance", "Z' (ohms)", "Z' (ohm)"]);
  const zImag = findColumn(headers, ["Zimag", "Z Imag", "Zim", "-Im(Z)", "-Zim", "Imaginary Impedance", "Z'' (ohms)", "Z'' (ohm)"]);

  const presets = {
    cv: { xColumn: voltage, yColumns: [current].filter(Boolean), mode: "lines" },
    cd: { xColumn: charge || time, yColumns: [voltage].filter(Boolean), mode: "lines" },
    "cd-time": { xColumn: time, yColumns: [voltage].filter(Boolean), mode: "lines" },
    "v-cycle": { xColumn: cycle || pointIndex, yColumns: voltageIndexColumns(headers), mode: "lines+markers" },
    rate: { xColumn: cycle, yColumns: [dchg || charge].filter(Boolean), mode: "lines+markers" },
    "rate-time": { xColumn: cycle, yColumns: [dchg || charge].filter(Boolean), mode: "lines+markers" },
    dqdv: { xColumn: voltage, yColumns: [charge].filter(Boolean), mode: "lines" },
    eis: { xColumn: zReal, yColumns: [zImag].filter(Boolean), mode: "lines+markers" },
    gitt: { xColumn: time, yColumns: [voltage].filter(Boolean), mode: "lines" },
  };

  return presets[method] || {
    xColumn: el.xColumnSelect.value || headers[0],
    yColumns: [...el.yColumnSelect.selectedOptions].map((option) => option.value),
    mode: state.plotMode,
  };
}

function buildPlotPresetForMethod(table, method) {
  return buildPlotPreset(table, method);
}

function buildPlotSpec(table, dataset) {
  const method = state.plotMethod;
  const preset = buildPlotPreset(table);
  if (!preset) {
    return { traces: [], message: "This file has no plottable table columns yet." };
  }

  if (method === "cv" && state.plot3d) {
    return buildCv3dSpec(dataset);
  }
  if (method === "custom") {
    const xColumn = el.xColumnSelect.value;
    const yColumns = [...el.yColumnSelect.selectedOptions].map((option) => option.value);
    return buildCustomPlotSpec(table, dataset, xColumn, yColumns);
  }

  if (method === "cv" && state.plotOverlayFiles) {
    return buildOverlayCvSpec(dataset);
  }
  if (method === "cd" || method === "cd-time") {
    return buildCdSpec(table, dataset, preset, method);
  }
  if (method === "rate" || method === "rate-time") return buildRateSpec(table, dataset, method);
  if (method === "dqdv") return buildDqdvSpec(table, dataset, preset);
  if (method === "eis") return buildEisSpec(table, dataset, preset);

  const massMg = plotActiveMassMg();
  if (!preset.xColumn || !preset.yColumns.length) {
    return { traces: [], message: `No matching ${plotMethodLabel()} columns found.` };
  }

  const xSeries = transformAxisValues(table.rows, preset.xColumn, "x", method, massMg);
  const traces = preset.yColumns.map((column, index) => {
    const ySeries = transformAxisValues(table.rows, column, "y", method, massMg);
    const style = plotTraceStyle(index, { markerSize: method === "rate" ? 7 : undefined });
    return {
      x: xSeries.values,
      y: ySeries.values,
      type: "scatter",
      mode: state.plotMode,
      name: ySeries.title,
      line: style.line,
      marker: style.marker,
    };
  });

  return {
    traces,
    title: plotTitle(dataset),
    xTitle: xSeries.title,
    yTitle: traces.map((trace) => trace.name).join(", "),
    hint: plotHintText(method, massMg),
  };
}

function buildCustomPlotSpec(table, dataset, xColumn, yColumns) {
  if (!xColumn || !yColumns.length) {
    return { traces: [], message: "Open Custom axes and choose X and Y columns." };
  }
  const xSeries = transformAxisValues(table.rows, xColumn, "x", "custom", plotActiveMassMg());
  return {
    traces: yColumns.map((column, index) => {
      const ySeries = transformAxisValues(table.rows, column, "y", "custom", plotActiveMassMg());
      const style = plotTraceStyle(index);
      return {
        x: xSeries.values,
        y: ySeries.values,
        type: "scatter",
        mode: state.plotMode,
        name: ySeries.title,
        line: style.line,
        marker: style.marker,
      };
    }),
    title: plotTitle(dataset),
    xTitle: xSeries.title,
    yTitle: yColumns.join(", "),
    hint: "Custom axes are using the selected table columns.",
  };
}

function buildCdSpec(table, dataset, preset, method) {
  const massMg = plotActiveMassMg();
  if (!preset.xColumn || !preset.yColumns.length) {
    return { traces: [], message: "CD needs voltage, capacity/time, and preferably cycle columns." };
  }
  if (method === "cd" && !isCapacityColumn(preset.xColumn)) {
    return { traces: [], message: "Voltage vs capacity needs a charge/capacity column. Try the V-t variant for time data." };
  }

  const xColumn = preset.xColumn;
  const yColumn = preset.yColumns[0];
  const xSeries = transformAxisValues(table.rows, xColumn, "x", method, massMg);
  const ySeries = transformAxisValues(table.rows, yColumn, "y", method, massMg);
  const cycleColumn = findCycleColumn(table.headers, table.rows);
  const groups = cycleGroupsForPlot(table.rows, cycleColumn, method === "cd" ? xColumn : capacityColumn(table.headers));
  let selectedGroups = selectedCycleGroups(groups);
  const cycleFilterFallback = !selectedGroups.length && groups.length;
  if (cycleFilterFallback) selectedGroups = groups;
  if (!selectedGroups.length) {
    return { traces: [], message: "No cycles matched the cycle filter." };
  }
  const colors = gradientColors(state.plotGradient, selectedGroups.length || 1);
  const traces = selectedGroups.map(([cycle, rows], index) => {
    const style = plotTraceStyle(index, { color: colors[index] });
    const series = pairedSeriesWithBreaks(rows, xColumn, yColumn, method, massMg, method !== "cd-time");
    return {
      x: series.x,
      y: series.y,
      type: "scatter",
      mode: state.plotMode,
      name: cycle === null ? "CD" : `Cycle ${cycle}`,
      line: style.line,
      marker: style.marker,
    };
  });

  return {
    traces,
    title: plotTitle(dataset),
    xTitle: xSeries.title,
    yTitle: ySeries.title,
    hint: `${selectedGroups.length} of ${groups.length} cycle trace(s) shown.${method === "cd-time" ? " Time is shown as total elapsed test time." : ""}${cycleFilterFallback ? " Cycle filter did not match; showing all cycles." : ""}`,
  };
}

function buildRateSpec(table, dataset, method) {
  const repaired = buildRepairedRateSummary(dataset, method);
  if (repaired?.cycles?.length) {
    return buildRepairedRateSpec(repaired, dataset, method);
  }

  const headers = table.headers;
  const massMg = plotActiveMassMg();
  const massG = massMg ? massMg / 1000 : 0;
  const cycleColumn = findColumn(headers, ["Cycle Index", "Cycle", "Cycle number"]);
  const chgSpecificColumn = chargeSpecificCapacityColumn(headers);
  const dchgSpecificColumn = dischargeSpecificCapacityColumn(headers);
  const chgCapacityColumn = chargeCapacityColumn(headers);
  const dchgCapacityColumn = dischargeCapacityColumn(headers);
  const ceColumnName = coulombicEfficiencyColumn(headers);

  if (!cycleColumn || (!chgSpecificColumn && !dchgSpecificColumn && !chgCapacityColumn && !dchgCapacityColumn)) {
    return { traces: [], message: "Rate needs cycle index plus charge/discharge capacity columns." };
  }

  const xSeries = method === "rate-time"
    ? rateTotalTimeSeries(dataset, table, cycleColumn)
    : { values: numericSeries(table.rows, cycleColumn), title: "Cycle Index" };
  const discharge = rateCapacityValues(table.rows, dchgSpecificColumn, dchgCapacityColumn, massG);
  const charge = rateCapacityValues(table.rows, chgSpecificColumn, chgCapacityColumn, massG);
  const ce = ceColumnName ? numericSeries(table.rows, ceColumnName) : [];
  const yTitle = dchgSpecificColumn || chgSpecificColumn || massG ? "Specific capacity [mAh/g]" : "Capacity [mAh]";
  const markerLine = state.plotTheme === "light" ? { color: "#ffffff", width: 0.6 } : { color: "#12091f", width: 0.6 };
  const traces = [];

  if (charge.some(Number.isFinite)) {
    traces.push({
      x: xSeries.values,
      y: charge,
      type: "scatter",
      mode: state.plotMode,
      name: "Charge specific capacity",
      line: { color: "#ef4444", width: state.plotLineWidth },
      marker: { color: "#ef4444", size: state.plotMarkerSize, line: markerLine },
    });
  }
  if (discharge.some(Number.isFinite)) {
    traces.push({
      x: xSeries.values,
      y: discharge,
      type: "scatter",
      mode: state.plotMode,
      name: "Discharge specific capacity",
      line: { color: "#111111", width: state.plotLineWidth },
      marker: { color: "#111111", size: state.plotMarkerSize, line: markerLine },
    });
  }
  if (ce.some(Number.isFinite)) {
    traces.push({
      x: xSeries.values,
      y: ce,
      yaxis: "y2",
      type: "scatter",
      mode: state.plotMode,
      name: "CE",
      line: { color: "#2563eb", width: state.plotLineWidth },
      marker: { color: "#2563eb", size: state.plotMarkerSize, line: markerLine },
    });
  }

  return {
    traces,
    title: plotTitle(dataset),
    xTitle: xSeries.title,
    yTitle,
    y2Title: ce.some(Number.isFinite) ? "CE [%]" : "",
    hint: `${method === "rate-time" ? "Total elapsed test time from step timestamps. " : ""}Charge red, discharge black, CE blue on right axis.`,
  };
}

function buildRepairedRateSpec(summary, dataset, method) {
  const filtered = filteredRateSummary(summary);
  if (!filtered.cycles.length) {
    return { traces: [], message: "No repaired rate cycles matched the cycle filter." };
  }
  const x = method === "rate-time" ? filtered.timeHours : filtered.cycles;
  const mode = state.plotMode;
  const markerLine = state.plotTheme === "light" ? { color: "#ffffff", width: 0.6 } : { color: "#12091f", width: 0.6 };
  const traces = [];

  if (filtered.charge.some(Number.isFinite)) {
    traces.push({
      x,
      y: filtered.charge,
      type: "scatter",
      mode,
      name: summary.specific ? "Charge specific capacity" : "Charge capacity",
      line: { color: "#ef4444", width: state.plotLineWidth },
      marker: { color: "#ef4444", size: state.plotMarkerSize, line: markerLine },
    });
  }
  if (filtered.discharge.some(Number.isFinite)) {
    traces.push({
      x,
      y: filtered.discharge,
      type: "scatter",
      mode,
      name: summary.specific ? "Discharge specific capacity" : "Discharge capacity",
      line: { color: "#111111", width: state.plotLineWidth },
      marker: { color: "#111111", size: state.plotMarkerSize, line: markerLine },
    });
  }
  if (filtered.ce.some(Number.isFinite)) {
    traces.push({
      x,
      y: filtered.ce,
      yaxis: "y2",
      type: "scatter",
      mode,
      name: "CE",
      line: { color: "#2563eb", width: state.plotLineWidth },
      marker: { color: "#2563eb", size: state.plotMarkerSize, line: markerLine },
    });
  }

  return {
    traces,
    title: plotTitle(dataset),
    xTitle: method === "rate-time" ? "Total time [h]" : "Cycle Index",
    yTitle: summary.specific ? "Specific capacity [mAh/g]" : "Capacity [mAh]",
    y2Title: filtered.ce.some(Number.isFinite) ? "CE [%]" : "",
    y2Range: [0, 110],
    hint: `${filtered.cycles.length} of ${summary.cycles.length} repaired cycle(s) shown from ${summary.source}. Charge red, discharge black, CE blue. Original Neware cycle grouping is bypassed.`,
  };
}

function buildOverlayCvSpec(currentDataset) {
  const massMg = plotActiveMassMg();
  const candidates = datasetsForFamily("cv")
    .map((dataset) => {
      const table = tableForDatasetMethod(dataset, state.plotMethod);
      const preset = buildPlotPreset(table);
      return { dataset, table, preset };
    })
    .filter(({ table, preset }) => table?.rows?.length && preset?.xColumn && preset?.yColumns?.length);

  const colors = gradientColors(state.plotGradient, candidates.length || 1);
  const traces = candidates.flatMap(({ dataset, table, preset }, index) => {
    const cycleColumn = findCycleColumn(table.headers, table.rows);
    const allGroups = cycleGroups(table.rows, cycleColumn);
    const groups = selectedCycleGroups(allGroups);
    const visibleGroups = cycleColumn ? (groups.length ? groups : allGroups) : [[null, table.rows]];
    return visibleGroups.map(([cycle, rows], groupIndex) => {
      const style = plotTraceStyle(index + groupIndex, { color: colors[index] });
      const series = pairedSeriesWithBreaks(rows, preset.xColumn, preset.yColumns[0], state.plotMethod, massMg, false);
      return {
        x: series.x,
        y: series.y,
        type: "scatter",
        mode: state.plotMode,
        name: cycle === null ? dataset.name : `${dataset.name} C${cycle}`,
        line: style.line,
        marker: style.marker,
      };
    });
  });

  if (!traces.length) {
    return { traces: [], message: "No loaded files with compatible CV voltage/current columns found." };
  }

  const first = candidates[0];
  const xSeries = transformAxisValues(first.table.rows, first.preset.xColumn, "x", state.plotMethod, massMg);
  const ySeries = transformAxisValues(first.table.rows, first.preset.yColumns[0], "y", state.plotMethod, massMg);
  return {
    traces,
    title: `${el.plotBatteryNameInput.value.trim() || currentDataset.name} - CV overlay`,
    xTitle: xSeries.title,
    yTitle: ySeries.title,
    hint: `${candidates.length} loaded files overlaid.`,
  };
}

function buildCv3dSpec(currentDataset) {
  const massMg = plotActiveMassMg();
  const candidates = (state.plotOverlayFiles ? datasetsForFamily("cv") : [currentDataset])
    .map((dataset) => {
      const table = tableForDatasetMethod(dataset, "cv");
      const preset = buildPlotPresetForMethod(table, "cv");
      return { dataset, table, preset };
    })
    .filter(({ table, preset }) => table?.rows?.length && preset?.xColumn && preset?.yColumns?.length);

  const traces = [];
  const colors = gradientColors(state.plotGradient, Math.max(1, candidates.length * 3));
  let depth = 0;
  candidates.forEach(({ dataset, table, preset }, datasetIndex) => {
    const cycleColumn = findCycleColumn(table.headers, table.rows);
    const groups = selectedCycleGroups(cycleGroups(table.rows, cycleColumn));
    const visibleGroups = cycleColumn ? groups : [[null, table.rows]];
    visibleGroups.forEach(([cycle, rows], groupIndex) => {
      depth += 1;
      const color = colors[(depth - 1) % colors.length];
      const series = pairedSeriesWithBreaks(rows, preset.xColumn, preset.yColumns[0], "cv", massMg, false);
      traces.push({
        x: series.x,
        y: series.x.map((value) => (Number.isFinite(value) ? depth : null)),
        z: series.y,
        type: "scatter3d",
        mode: "lines",
        name: cycle === null ? dataset.name : `${dataset.name} C${cycle}`,
        line: { color, width: Math.max(2, state.plotLineWidth + 1) },
      });
    });
  });

  if (!traces.length) {
    return { traces: [], message: "No loaded CV files with voltage/current columns found." };
  }

  const first = candidates[0];
  const xSeries = transformAxisValues(first.table.rows, first.preset.xColumn, "x", "cv", massMg);
  const zSeries = transformAxisValues(first.table.rows, first.preset.yColumns[0], "y", "cv", massMg);
  return {
    traces,
    is3d: true,
    title: `${el.plotBatteryNameInput.value.trim() || currentDataset.name} - CV 3D stack`,
    xTitle: xSeries.title,
    yTitle: "Cycle / file",
    zTitle: zSeries.title,
    hint: `3D CV stack: ${traces.length} trace(s). Drag to rotate, scroll to zoom.`,
  };
}

function buildDqdvSpec(table, dataset, preset) {
  const massMg = plotActiveMassMg();
  if (!preset.xColumn || !preset.yColumns.length) {
    return { traces: [], message: "dQ/dV needs voltage and capacity columns from cycling data." };
  }
  const groups = dqdvGroupsForPlot(table, dataset, preset.yColumns[0]);
  if (!groups.length) return { traces: [], message: "No cycles matched the cycle filter." };

  const minDv = state.dqdvMinDvMv / 1000;
  const requestedStep = state.dqdvBinMv / 1000;
  const yTitle = massMg ? "dQ/dV [mAh/g/V]" : "dQ/dV [mAh/V]";
  const colors = gradientColors(state.plotGradient, groups.length || 1);
  const traces = [];
  let processedCount = 0;
  let rawPointCount = 0;

  groups.forEach(([cycle, rows], groupIndex) => {
    const qv = qvSegments(rows, preset.xColumn, preset.yColumns[0], massMg, minDv);
    const raw = derivativeFromQvSegments(qv, minDv);
    rawPointCount += raw.y.filter(Number.isFinite).length;
    const processed = processDqdvSegments(qv, requestedStep, minDv);
    processedCount += processed.y.filter(Number.isFinite).length;
    const style = plotTraceStyle(groupIndex, { color: colors[groupIndex] });

    if (!state.plot3d && state.dqdvShowRaw && raw.x.length) {
      traces.push({
        x: raw.x,
        y: raw.y,
        type: "scatter",
        mode: state.plotMode,
        name: cycle === null ? "Raw dQ/dV" : `Raw C${cycle}`,
        line: { ...style.line, width: Math.max(1, state.plotLineWidth * 0.55), dash: "dot" },
        marker: style.marker,
        opacity: 0.38,
      });
    }

    if (processed.x.length) {
      if (state.plot3d) {
        const depth = cycle === null ? groupIndex + 1 : cycle;
        traces.push({
          x: processed.x,
          y: processed.x.map((value) => (Number.isFinite(value) ? depth : null)),
          z: processed.y,
          type: "scatter3d",
          mode: "lines",
          name: cycle === null ? `Trace ${groupIndex + 1}` : `Cycle ${cycle}`,
          line: { color: colors[groupIndex], width: Math.max(2, state.plotLineWidth + 1) },
        });
      } else {
        traces.push({
          x: processed.x,
          y: processed.y,
          type: "scatter",
          mode: state.plotMode,
          name: cycle === null ? yTitle : `Cycle ${cycle}`,
          line: style.line,
          marker: style.marker,
        });
      }
    }
  });

  const smoothingHint = state.dqdvSmoothing === "sg"
    ? `Q(V) Savitzky-Golay window ${state.dqdvWindow}, polynomial ${state.dqdvPolynomial}`
    : "No smoothing";
  const stepHint = state.dqdvBinMv > 0 ? `voltage step ${formatNumber(state.dqdvBinMv)} mV` : "auto voltage step";
  const postHint = state.dqdvPostWindow >= 3 ? `post SG window ${state.dqdvPostWindow}` : "no post-smoothing";
  return {
    traces,
    is3d: state.plot3d,
    title: plotTitle(dataset),
    xTitle: "Voltage [V]",
    yTitle: state.plot3d ? "Cycle" : yTitle,
    zTitle: yTitle,
    hint: `${state.plot3d ? "3D dQ/dV stack. Drag to rotate, scroll to zoom. " : ""}${smoothingHint}; ${stepHint}; ${postHint}; min dV ${formatNumber(state.dqdvMinDvMv)} mV; ${processedCount}/${rawPointCount} derivative points shown.`,
  };
}

function buildEisSpec(table, dataset, preset) {
  if (!preset.xColumn || !preset.yColumns.length) {
    return { traces: [], message: "EIS needs real and imaginary impedance columns." };
  }
  const x = numericSeries(table.rows, preset.xColumn);
  const yColumn = preset.yColumns[0];
  const y = numericSeries(table.rows, yColumn).map((value) => (isNegativeImaginaryColumn(yColumn) ? value : -value));
  const style = plotTraceStyle(0);
  return {
    traces: [
      {
        x,
        y,
        type: "scatter",
        mode: state.plotMode,
        name: "-Z<sub>im</sub>",
        line: style.line,
        marker: style.marker,
      },
    ],
    title: plotTitle(dataset),
    xTitle: "Z<sub>real</sub> [ohm]",
    yTitle: "-Z<sub>im</sub> [ohm]",
    hint: "Nyquist preset.",
  };
}

function transformAxisValues(rows, column, axis, method, massMg) {
  const lower = column.toLowerCase();
  const massG = massMg ? massMg / 1000 : 0;

  if (axis === "y" && isCurrentColumn(column)) {
    const values = numericSeries(rows, column);
    const currentMA = values.map((value) => currentToMA(value, column));
    if (method === "cv" && massG) {
      return { values: currentMA.map((value) => value / massG), title: "Specific current [mA/g]" };
    }
    return { values: currentMA, title: "Current [mA]" };
  }

  if (isTimeColumn(column)) {
    return { values: rows.map((row) => timeValueToHours(row[column], column)), title: "Time [h]" };
  }

  if (isCapacityColumn(column)) {
    const values = numericSeries(rows, column);
    const capacityMAh = values.map((value) => capacityToMAh(value, column));
    if (axis === "x" && method === "cd" && massG) {
      return { values: capacityMAh.map((value) => value / massG), title: "Specific capacity [mAh/g]" };
    }
    if (axis === "y" && (method === "rate" || method === "cd") && massG) {
      return { values: capacityMAh.map((value) => value / massG), title: "Specific capacity [mAh/g]" };
    }
    return { values: capacityMAh, title: "Capacity [mAh]" };
  }

  const values = numericSeries(rows, column);
  return { values, title: axisTitleFromColumn(column) };
}

function numericSeries(rows, column) {
  return rows.map((row) => readNumber(row[column]));
}

function pairedSeriesWithBreaks(rows, xColumn, yColumn, method, massMg, breakOnXReset = false) {
  const xSeries = transformAxisValues(rows, xColumn, "x", method, massMg).values;
  const ySeries = transformAxisValues(rows, yColumn, "y", method, massMg).values;
  const x = [];
  const y = [];
  let lastX = null;

  xSeries.forEach((xValue, index) => {
    const yValue = ySeries[index];
    if (!Number.isFinite(xValue) || !Number.isFinite(yValue)) return;
    if (breakOnXReset && lastX !== null && xValue < lastX - 1e-8) {
      x.push(null);
      y.push(null);
    }
    x.push(xValue);
    y.push(yValue);
    lastX = xValue;
  });

  return { x, y };
}

function qvSegments(rows, voltageColumn, capacityColumn, massMg, minDv) {
  const voltage = numericSeries(rows, voltageColumn);
  const capacity = transformAxisValues(rows, capacityColumn, "y", "cd", massMg).values;
  const typeColumn = findColumn(Object.keys(rows[0] || {}), ["Step Type", "Step Name", "State"]);
  const segments = [];
  let current = [];
  let lastDirection = 0;
  let lastKind = "";
  const flush = () => {
    if (current.length >= 3) segments.push(current);
    current = [];
    lastDirection = 0;
  };

  voltage.forEach((v, index) => {
    const q = capacity[index];
    const kind = typeColumn ? stepTypeKind(rows[index]?.[typeColumn]) : "";
    if (!Number.isFinite(v) || !Number.isFinite(q)) {
      flush();
      lastKind = "";
      return;
    }
    if (lastKind && kind && kind !== lastKind) {
      flush();
    }
    if (!current.length) {
      current.push({ v, q });
      lastKind = kind || lastKind;
      return;
    }
    const previous = current[current.length - 1];
    const dv = v - previous.v;
    if (Math.abs(dv) < minDv) return;
    const direction = Math.sign(dv);
    if (lastDirection && direction !== lastDirection) {
      if (current.length >= 3) segments.push(current);
      current = [previous];
    }
    current.push({ v, q });
    lastDirection = direction;
    lastKind = kind || lastKind;
  });
  if (current.length >= 3) segments.push(current);
  return segments.map(removeDuplicateVoltages);
}

function removeDuplicateVoltages(segment) {
  const merged = [];
  segment.forEach((point) => {
    const last = merged[merged.length - 1];
    if (last && Math.abs(point.v - last.v) < 1e-12) {
      last.q = (last.q + point.q) / 2;
      return;
    }
    merged.push({ ...point });
  });
  return merged;
}

function derivativeFromQvSegments(segments, minDv) {
  const x = [];
  const y = [];
  segments.forEach((segment, segmentIndex) => {
    if (segmentIndex) {
      x.push(null);
      y.push(null);
    }
    for (let index = 1; index < segment.length; index += 1) {
      const previous = segment[index - 1];
      const current = segment[index];
      const dv = current.v - previous.v;
      if (Math.abs(dv) < minDv) continue;
      x.push((previous.v + current.v) / 2);
      y.push((current.q - previous.q) / dv);
    }
  });
  return { x, y };
}

function processDqdvSegments(segments, requestedStep, minDv) {
  const x = [];
  const y = [];
  segments.forEach((segment, segmentIndex) => {
    const step = requestedStep || autoVoltageStep(segment);
    const grid = interpolateQvSegment(segment, step);
    if (grid.length < 3) return;
    const qValues = grid.map((point) => point.q);
    const smoothQ = state.dqdvSmoothing === "sg"
      ? savitzkyGolaySmooth(qValues, state.dqdvWindow, state.dqdvPolynomial)
      : qValues;
    const derivative = derivativeFromQvSegments([grid.map((point, index) => ({ v: point.v, q: smoothQ[index] }))], minDv);
    const smoothY = state.dqdvPostWindow >= 3
      ? savitzkyGolaySmooth(derivative.y, state.dqdvPostWindow, 2)
      : derivative.y;
    if (segmentIndex && derivative.x.length) {
      x.push(null);
      y.push(null);
    }
    x.push(...derivative.x);
    y.push(...smoothY);
  });
  return { x, y };
}

function autoVoltageStep(segment) {
  const diffs = [];
  for (let index = 1; index < segment.length; index += 1) {
    diffs.push(Math.abs(segment[index].v - segment[index - 1].v));
  }
  const finite = diffs.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  return finite[Math.floor(finite.length / 2)] || 0.001;
}

function interpolateQvSegment(segment, step) {
  const direction = Math.sign(segment[segment.length - 1].v - segment[0].v) || 1;
  const ordered = direction > 0 ? segment : [...segment].reverse();
  const start = ordered[0].v;
  const end = ordered[ordered.length - 1].v;
  const grid = [];
  let cursor = start;
  let pointer = 1;
  while (cursor <= end + step * 0.5) {
    while (pointer < ordered.length - 1 && ordered[pointer].v < cursor) pointer += 1;
    const before = ordered[pointer - 1];
    const after = ordered[pointer];
    if (before && after && after.v !== before.v) {
      const ratio = (cursor - before.v) / (after.v - before.v);
      grid.push({ v: cursor, q: before.q + ratio * (after.q - before.q) });
    }
    cursor += step;
  }
  return direction > 0 ? grid : grid.reverse();
}

function splitSeriesSegments(series) {
  const segments = [];
  let current = { x: [], y: [] };
  series.x.forEach((xValue, index) => {
    const yValue = series.y[index];
    if (!Number.isFinite(xValue) || !Number.isFinite(yValue)) {
      if (current.x.length) segments.push(current);
      current = { x: [], y: [] };
      return;
    }
    current.x.push(xValue);
    current.y.push(yValue);
  });
  if (current.x.length) segments.push(current);
  return segments;
}

function findCycleColumn(headers, rows = []) {
  const exactNames = ["cycleindex", "cyclenumber", "cycleid", "cycle"];
  const candidates = headers.filter((header) => exactNames.includes(normalizeColumnName(header)));
  return candidates.find((column) => looksLikeCycleColumn(rows, column)) || "";
}

function looksLikeCycleColumn(rows, column) {
  if (!column || !rows.length) return false;
  const values = rows
    .slice(0, 800)
    .map((row) => readNumber(row[column]))
    .filter((value) => Number.isFinite(value) && value >= 0);
  if (!values.length) return false;
  const integerRatio = values.filter((value) => Math.abs(value - Math.round(value)) < 1e-6).length / values.length;
  const uniqueCount = new Set(values.map((value) => Math.round(value))).size;
  return integerRatio > 0.92 && uniqueCount > 1 && uniqueCount <= Math.max(2, values.length * 0.75);
}

function cycleGroups(rows, cycleColumn) {
  if (!cycleColumn) return [[null, rows]];
  const groups = new Map();
  rows.forEach((row) => {
    const cycle = readNumber(row[cycleColumn]);
    if (!Number.isFinite(cycle) || cycle <= 0) return;
    const key = Number.isInteger(cycle) ? cycle : Number(cycle.toFixed(6));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  const entries = [...groups.entries()].sort((a, b) => a[0] - b[0]);
  return entries.length ? entries : [[null, rows]];
}

function cycleGroupsForPlot(rows, cycleColumn, resetColumn = "") {
  const explicit = cycleGroups(rows, cycleColumn);
  if (explicit.length > 1 || explicit[0]?.[0] !== null) return explicit;
  const inferred = inferCycleGroupsFromResets(rows, resetColumn);
  return inferred.length > 1 ? inferred : explicit;
}

function inferCycleGroupsFromResets(rows, resetColumn) {
  if (!resetColumn) return [];
  const values = numericSeries(rows, resetColumn);
  const finite = values.filter(Number.isFinite);
  if (finite.length < 12) return [];
  const limits = finite.reduce(
    (acc, value) => ({ min: Math.min(acc.min, value), max: Math.max(acc.max, value) }),
    { min: finite[0], max: finite[0] },
  );
  const span = limits.max - limits.min;
  if (!Number.isFinite(span) || span <= 0) return [];
  const resetThreshold = Math.max(span * 0.08, 1e-6);
  const groups = [];
  let current = [];
  let cycle = 1;
  let lastValue = null;

  rows.forEach((row, index) => {
    const value = values[index];
    if (!Number.isFinite(value)) return;
    if (lastValue !== null && current.length >= 6 && value < lastValue - resetThreshold) {
      groups.push([cycle, current]);
      cycle += 1;
      current = [];
    }
    current.push(row);
    lastValue = value;
  });
  if (current.length >= 6) groups.push([cycle, current]);
  return groups;
}

function selectedCycleGroups(groups) {
  if (!groups.length || groups[0][0] === null) return groups;
  const available = groups.map(([cycle]) => cycle);
  const allowed = parseCycleFilter(state.cycleFilter, available);
  const step = Math.max(1, state.cycleStep || 1);
  return groups.filter(([cycle]) => allowed.has(cycle)).filter((_, index) => index % step === 0);
}

function parseCycleFilter(text, available) {
  if (!text || /^all$/i.test(text.trim())) return new Set(available);
  const allowed = new Set();
  text.split(",").forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const match = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (match) {
      const start = Number(match[1]);
      const end = Number(match[2]);
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      available.filter((cycle) => cycle >= min && cycle <= max).forEach((cycle) => allowed.add(cycle));
      return;
    }
    const cycle = Number(trimmed);
    if (Number.isFinite(cycle)) allowed.add(cycle);
  });
  return allowed.size ? allowed : new Set(available);
}

function currentToMA(value, column) {
  const lower = column.toLowerCase();
  if (lower.includes("ma")) return value;
  if (lower.includes("ua") || lower.includes("micro")) return value / 1000;
  return value * 1000;
}

function isCurrentColumn(column) {
  const lower = column.toLowerCase();
  return lower.includes("current") || lower.includes("i/a") || lower.includes("(a)") || lower === "i";
}

function isTimeColumn(column) {
  const lower = column.toLowerCase();
  return lower.includes("time") || lower.includes("elapsed") || lower.includes("t/s");
}

function totalTimeColumn(headers) {
  const preferred = ["Total Time", "Total Time (s)", "Test Time", "Test Time (s)", "Elapsed Time", "Elapsed Time (s)"];
  const exact = exactColumn(headers, preferred);
  if (exact) return exact;

  const totalLike = headers.find((header) => {
    const normalized = normalizeColumnName(header);
    return (
      (normalized.includes("totaltime") ||
        normalized.includes("testtime") ||
        normalized.includes("elapsedtime") ||
        normalized.includes("runtime")) &&
      !normalized.includes("steptime") &&
      !normalized.includes("cycletime")
    );
  });
  return totalLike || "";
}

function isCapacityColumn(column) {
  const lower = column.toLowerCase();
  return lower.includes("cap") || lower.includes("charge") || lower.includes("q/");
}

function voltageColumn(headers) {
  return electrochemicalVoltageColumn(headers)
    || findColumn(headers, ["DC Working Electrode (V)", "DC Voltage (V)", "DC Voltage"]);
}

function voltageIndexColumns(headers) {
  const columns = [];
  [
    "Oneset Volt.(V)",
    "Onset Volt.(V)",
    "Onset Voltage(V)",
    "Onset Voltage (V)",
    "Start Voltage(V)",
    "Start Voltage (V)",
    "End Voltage(V)",
    "End Voltage (V)",
    "End Volt.(V)",
    "End Volt. (V)",
    "Voltage(V)",
    "Voltage (V)",
  ].forEach((candidate) => {
    const column = findColumn(headers, [candidate]);
    if (column && !columns.includes(column)) columns.push(column);
  });
  const fallback = voltageColumn(headers);
  if (fallback && !columns.includes(fallback)) columns.push(fallback);
  return columns;
}

function pointIndexColumn(headers) {
  return findColumn(headers, ["DataPoint", "Data Point", "Point", "Point Index", "Step Number", "Step Index", "Index"]);
}

function currentColumn(headers) {
  return electrochemicalCurrentColumn(headers)
    || findColumn(headers, ["DC Current (A)", "DC Current"]);
}

function capacityColumn(headers) {
  return exactColumn(headers, [
    "Cumulative Charge (mAh)",
    "Capacity(Ah)",
    "Capacity (Ah)",
    "Capacity(mAh)",
    "Capacity (mAh)",
    "Chg. Cap.(Ah)",
    "DChg. Cap.(Ah)",
    "Charge Capacity",
    "Discharge Capacity",
    "Q/mAh",
  ]) || headers.find((header) => isCapacityColumn(header) && !normalizeColumnName(header).includes("cycle")) || "";
}

function chargeSpecificCapacityColumn(headers) {
  return exactColumn(headers, [
    "Chg. Spec. Cap.(mAh/g)",
    "Chg Spec Cap (mAh/g)",
    "Charge Specific Capacity",
    "Charge Spec. Capacity",
    "Charge Capacity (mAh/g)",
  ]) || headers.find((header) => {
    const normalized = normalizeColumnName(header);
    return normalized.includes("chg") && normalized.includes("spec") && normalized.includes("cap");
  }) || "";
}

function dischargeSpecificCapacityColumn(headers) {
  return exactColumn(headers, [
    "DChg. Spec. Cap.(mAh/g)",
    "DChg Spec Cap (mAh/g)",
    "Discharge Specific Capacity",
    "Discharge Spec. Capacity",
    "Discharge Capacity (mAh/g)",
  ]) || headers.find((header) => {
    const normalized = normalizeColumnName(header);
    return (normalized.includes("dchg") || normalized.includes("discharge")) && normalized.includes("spec") && normalized.includes("cap");
  }) || "";
}

function chargeCapacityColumn(headers) {
  return exactColumn(headers, [
    "Chg. Cap.(Ah)",
    "Chg Cap(Ah)",
    "Charge Capacity",
    "Charge Capacity(Ah)",
    "Charge Capacity (Ah)",
  ]) || headers.find((header) => {
    const normalized = normalizeColumnName(header);
    return normalized.includes("chg") && !normalized.includes("dchg") && !normalized.includes("spec") && normalized.includes("cap");
  }) || "";
}

function dischargeCapacityColumn(headers) {
  return exactColumn(headers, [
    "DChg. Cap.(Ah)",
    "DChg Cap(Ah)",
    "Discharge Capacity",
    "Discharge Capacity(Ah)",
    "Discharge Capacity (Ah)",
  ]) || headers.find((header) => {
    const normalized = normalizeColumnName(header);
    return (normalized.includes("dchg") || normalized.includes("discharge")) && !normalized.includes("spec") && normalized.includes("cap");
  }) || "";
}

function coulombicEfficiencyColumn(headers) {
  return exactColumn(headers, [
    "Chg.-DChg. Eff(%)",
    "Chg.-DChg. Eff (%)",
    "Coulombic Efficiency",
    "Coulombic Efficiency (%)",
    "CE(%)",
    "CE (%)",
  ]) || headers.find((header) => {
    const normalized = normalizeColumnName(header);
    return normalized.includes("eff") || normalized === "ce" || normalized.includes("coulombic");
  }) || "";
}

function electrochemicalVoltageColumn(headers) {
  return exactColumn(headers, ["Working Electrode (V)", "Voltage(V)", "Voltage (V)", "Voltage", "Ewe/V"])
    || headers.find((header) => isVoltageColumn(header) && !normalizeColumnName(header).startsWith("dc")) || "";
}

function electrochemicalCurrentColumn(headers) {
  return exactColumn(headers, ["Current (A)", "Current(A)", "Current", "I/A"])
    || headers.find((header) => {
      const normalized = normalizeColumnName(header);
      const lower = String(header).toLowerCase();
      return isCurrentColumn(header) && !normalized.startsWith("dc") && !lower.includes("density");
    }) || "";
}

function hasVoltageColumn(headers) {
  return Boolean(electrochemicalVoltageColumn(headers));
}

function hasCurrentColumn(headers) {
  return Boolean(electrochemicalCurrentColumn(headers));
}

function hasCapacityColumn(headers) {
  return Boolean(capacityColumn(headers));
}

function hasCycleSummaryColumns(headers) {
  return Boolean(exactColumn(headers, ["Cycle Index", "Cycle"]) && capacityColumn(headers));
}

function hasEisColumns(headers) {
  return Boolean(findColumn(headers, ["Zreal", "Z Real", "Zre", "Re(Z)", "Real Impedance", "Z' (ohms)", "Z' (ohm)"]));
}

function axisTitleFromColumn(column) {
  if (isVoltageColumn(column)) return "Voltage [V]";
  if (isCurrentColumn(column)) return "Current [mA]";
  if (isTimeColumn(column)) return "Time [h]";
  if (isCapacityColumn(column)) return "Capacity [mAh]";
  if (isRealImpedanceColumn(column)) return "Z<sub>real</sub> [ohm]";
  if (isImaginaryImpedanceColumn(column)) return "-Z<sub>im</sub> [ohm]";
  return unitTitle(column);
}

function unitTitle(column) {
  const text = String(column || "").trim();
  const parenthetical = text.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (parenthetical) return `${parenthetical[1].trim()} [${parenthetical[2].trim()}]`;
  const slash = text.match(/^(.*?)\/([A-Za-z][A-Za-z0-9^.-]*)$/);
  if (slash) return `${slash[1].trim()} [${slash[2].trim()}]`;
  return text;
}

function isVoltageColumn(column) {
  const lower = column.toLowerCase();
  return lower.includes("voltage") || lower.includes("electrode") || lower.includes("ewe") || lower.includes("(v)");
}

function isRealImpedanceColumn(column) {
  const normalized = normalizeColumnName(column);
  return normalized.includes("zreal") || normalized.includes("rez") || normalized.includes("realimpedance");
}

function isImaginaryImpedanceColumn(column) {
  const normalized = normalizeColumnName(column);
  return normalized.includes("zimag") || normalized.includes("imz") || normalized.includes("imaginaryimpedance");
}

function isNegativeImaginaryColumn(column) {
  const lower = String(column || "").toLowerCase();
  return lower.includes("-im") || lower.includes("-z") || lower.includes("minus");
}

function capacityToMAh(value, column) {
  const lower = column.toLowerCase();
  return lower.includes("mah") || lower.includes("ma.h") || lower.includes("ma h") ? value : value * 1000;
}

function timeToHours(value, column) {
  const lower = column.toLowerCase();
  if (lower.includes("(h") || lower.includes("hour")) return value;
  if (lower.includes("min")) return value / 60;
  return value / 3600;
}

function timeValueToHours(value, column) {
  if (typeof value === "number") return timeToHours(value, column);
  const text = String(value ?? "").trim();
  if (!text) return NaN;
  const duration = durationTextToHours(text);
  if (Number.isFinite(duration)) return duration;
  if (!/^-?[\d.,]+(?:e-?\d+)?$/i.test(text)) return NaN;
  const numeric = readNumber(text);
  return Number.isFinite(numeric) ? timeToHours(numeric, column) : NaN;
}

function rateCapacityValues(rows, specificColumn, capacityColumnName, massG) {
  if (specificColumn) return numericSeries(rows, specificColumn);
  if (!capacityColumnName) return [];
  const capacity = numericSeries(rows, capacityColumnName).map((value) => capacityToMAh(value, capacityColumnName));
  return massG ? capacity.map((value) => value / massG) : capacity;
}

function buildRepairedRateSummary(dataset) {
  const massMg = plotActiveMassMg();
  const massG = massMg ? massMg / 1000 : 0;
  const fromSteps = repairedRateSummaryFromSteps(dataset?.sheets?.step, massG);
  if (fromSteps?.cycles?.length) return fromSteps;
  return repairedRateSummaryFromRecords(dataset?.sheets?.record || dataset?.sheets?.data, massG);
}

function repairedRateSummaryFromSteps(stepTable, massG) {
  if (!stepTable?.rows?.length) return null;
  const headers = stepTable.headers;
  const typeColumn = findColumn(headers, ["Step Type", "Step Name", "State"]);
  const capacityCol = capacityColumn(headers);
  const cycleColumn = findColumn(headers, ["Cycle Index", "Cycle", "Cycle number"]);
  const startColumn = findColumn(headers, ["Oneset Date", "Onset Date", "Start Date", "Start Time"]);
  const endColumn = findColumn(headers, ["End Date", "End Time"]);
  if (!typeColumn || !capacityCol) return null;
  if (cycleColumn) {
    const byCycle = repairedRateSummaryFromStepCycles(stepTable, cycleColumn, typeColumn, capacityCol, startColumn, endColumn, massG);
    if (byCycle?.cycles?.length) return byCycle;
  }

  let testStart = Infinity;
  const charge = [];
  const discharge = [];
  let current = null;
  const flushCurrent = () => {
    if (!current) return;
    if (current.kind === "charge") charge.push(current);
    if (current.kind === "discharge") discharge.push(current);
    current = null;
  };
  stepTable.rows.forEach((row) => {
    const kind = stepTypeKind(row[typeColumn]);
    if (!kind) {
      flushCurrent();
      return;
    }
    const capacity = capacityToMAh(readNumber(row[capacityCol]), capacityCol);
    if (!Number.isFinite(capacity) || capacity <= 0) {
      flushCurrent();
      return;
    }
    const startMs = dateValueToMs(row[startColumn]);
    const endMs = dateValueToMs(row[endColumn]);
    if (Number.isFinite(startMs)) testStart = Math.min(testStart, startMs);
    if (!current || current.kind !== kind) {
      flushCurrent();
      current = { kind, capacity: 0, endMs: -Infinity };
    }
    current.capacity += capacity;
    if (Number.isFinite(endMs)) current.endMs = Math.max(current.endMs, endMs);
  });
  flushCurrent();
  if (!charge.length && !discharge.length) return null;

  const count = Math.max(charge.length, discharge.length);
  const cycles = Array.from({ length: count }, (_, index) => index + 1);
  const timeHours = cycles.map((_, index) => {
    const end = Math.max(charge[index]?.endMs ?? -Infinity, discharge[index]?.endMs ?? -Infinity);
    return Number.isFinite(end) && Number.isFinite(testStart) ? (end - testStart) / 3600000 : index + 1;
  });
  return normalizeRateSummary({
    cycles,
    charge: charge.map((item) => item.capacity),
    discharge: discharge.map((item) => item.capacity),
    timeHours,
    massG,
    source: "repaired step segments",
  });
}

function repairedRateSummaryFromStepCycles(stepTable, cycleColumn, typeColumn, capacityCol, startColumn, endColumn, massG) {
  let testStart = Infinity;
  const byCycle = new Map();
  stepTable.rows.forEach((row) => {
    const cycle = readNumber(row[cycleColumn]);
    const kind = stepTypeKind(row[typeColumn]);
    const capacity = capacityToMAh(readNumber(row[capacityCol]), capacityCol);
    if (!Number.isFinite(cycle) || cycle <= 0 || !kind || !Number.isFinite(capacity) || capacity <= 0) return;
    const startMs = dateValueToMs(row[startColumn]);
    const endMs = dateValueToMs(row[endColumn]);
    if (Number.isFinite(startMs)) testStart = Math.min(testStart, startMs);
    if (!byCycle.has(cycle)) {
      byCycle.set(cycle, { cycle, charge: 0, discharge: 0, endMs: -Infinity });
    }
    const entry = byCycle.get(cycle);
    entry[kind] += capacity;
    if (Number.isFinite(endMs)) entry.endMs = Math.max(entry.endMs, endMs);
  });

  const entries = [...byCycle.values()]
    .filter((entry) => entry.charge > 0 && entry.discharge > 0)
    .sort((a, b) => a.cycle - b.cycle);
  if (!entries.length) return null;

  return normalizeRateSummary({
    cycles: entries.map((entry) => entry.cycle),
    charge: entries.map((entry) => entry.charge),
    discharge: entries.map((entry) => entry.discharge),
    timeHours: entries.map((entry, index) => {
      return Number.isFinite(entry.endMs) && Number.isFinite(testStart)
        ? (entry.endMs - testStart) / 3600000
        : index + 1;
    }),
    massG,
    source: "cycle-indexed step segments",
  });
}

function repairedRateSummaryFromRecords(recordTable, massG) {
  if (!recordTable?.rows?.length) return null;
  const typeColumn = findColumn(recordTable.headers, ["Step Type", "Step Name", "State"]);
  const capacityCol = capacityColumn(recordTable.headers);
  const timeColumn = totalTimeColumn(recordTable.headers) || findColumn(recordTable.headers, ["Time", "Elapsed Time"]);
  if (!typeColumn || !capacityCol) return null;

  const groups = electrochemicalStepGroups(recordTable.rows, recordTable.headers);
  const charge = [];
  const discharge = [];
  groups.forEach(([, rows]) => {
    const kind = stepTypeKind(rows[0]?.[typeColumn]);
    const capacity = segmentCapacityMAh(rows, capacityCol);
    const last = rows[rows.length - 1];
    const timeHours = timeColumn ? timeValueToHours(last?.[timeColumn], timeColumn) : NaN;
    if (!Number.isFinite(capacity) || capacity <= 0) return;
    const segment = { capacity, timeHours };
    if (kind === "charge") charge.push(segment);
    if (kind === "discharge") discharge.push(segment);
  });
  if (!charge.length && !discharge.length) return null;

  const count = Math.max(charge.length, discharge.length);
  return normalizeRateSummary({
    cycles: Array.from({ length: count }, (_, index) => index + 1),
    charge: charge.map((item) => item.capacity),
    discharge: discharge.map((item) => item.capacity),
    timeHours: Array.from({ length: count }, (_, index) => {
      const time = Math.max(charge[index]?.timeHours ?? -Infinity, discharge[index]?.timeHours ?? -Infinity);
      return Number.isFinite(time) ? time : index + 1;
    }),
    massG,
    source: "repaired record segments",
  });
}

function normalizeRateSummary(summary) {
  const count = summary.cycles.length;
  const charge = Array.from({ length: count }, (_, index) => summary.charge[index] ?? NaN);
  const discharge = Array.from({ length: count }, (_, index) => summary.discharge[index] ?? NaN);
  const toSpecific = (value) => (summary.massG && Number.isFinite(value) ? value / summary.massG : value);
  return {
    cycles: summary.cycles,
    timeHours: Array.from({ length: count }, (_, index) => summary.timeHours[index] ?? index + 1),
    charge: charge.map(toSpecific),
    discharge: discharge.map(toSpecific),
    ce: charge.map((chg, index) => {
      const dchg = discharge[index];
      return Number.isFinite(chg) && chg > 0 && Number.isFinite(dchg) ? (dchg / chg) * 100 : NaN;
    }),
    specific: Boolean(summary.massG),
    source: summary.source,
  };
}

function filteredRateSummary(summary) {
  const allowed = parseCycleFilter(state.cycleFilter, summary.cycles);
  const step = Math.max(1, state.cycleStep || 1);
  const indexes = summary.cycles
    .map((cycle, index) => ({ cycle, index }))
    .filter(({ cycle }) => allowed.has(cycle))
    .filter((_, visibleIndex) => visibleIndex % step === 0)
    .map(({ index }) => index);
  return {
    cycles: indexes.map((index) => summary.cycles[index]),
    timeHours: indexes.map((index) => summary.timeHours[index]),
    charge: indexes.map((index) => summary.charge[index]),
    discharge: indexes.map((index) => summary.discharge[index]),
    ce: indexes.map((index) => summary.ce[index]),
  };
}

function stepTypeKind(value) {
  const text = String(value || "").toLowerCase();
  if (!text) return "";
  if (text.includes("rest") || text.includes("pause") || text.includes("ocv")) return "";
  if (text.includes("dchg") || text.includes("discharge") || text.includes("dch")) return "discharge";
  if (text.includes("chg") || text.includes("charge")) return "charge";
  return "";
}

function segmentCapacityMAh(rows, capacityCol) {
  const values = rows
    .map((row) => capacityToMAh(readNumber(row[capacityCol]), capacityCol))
    .filter(Number.isFinite);
  if (values.length < 2) return NaN;
  const min = Math.min(...values);
  const max = Math.max(...values);
  return Math.max(Math.abs(values[values.length - 1] - values[0]), max - min);
}

function dqdvGroupsForPlot(table, dataset, capacityCol) {
  const cycleColumn = findCycleColumn(table.headers, table.rows);
  if (cycleColumn) return selectedCycleGroups(cycleGroupsForPlot(table.rows, cycleColumn, capacityCol));
  const repairedCycles = electrochemicalCycleGroups(table.rows, table.headers);
  if (repairedCycles.length > 1) return selectedCycleGroups(repairedCycles);
  const inferred = cycleGroupsForPlot(table.rows, cycleColumn, capacityCol);
  return selectedCycleGroups(inferred);
}

function electrochemicalCycleGroups(rows, headers) {
  const typeColumn = findColumn(headers, ["Step Type", "Step Name", "State"]);
  if (!typeColumn) return [];
  const halfCycles = electrochemicalStepGroups(rows, headers)
    .map(([, groupRows]) => ({ kind: stepTypeKind(groupRows[0]?.[typeColumn]), rows: groupRows }))
    .filter((group) => group.kind && group.rows.length);
  if (halfCycles.length < 2) return [];

  const cycles = [];
  let currentRows = [];
  let hasCharge = false;
  let hasDischarge = false;

  halfCycles.forEach((halfCycle) => {
    currentRows.push(...halfCycle.rows);
    hasCharge = hasCharge || halfCycle.kind === "charge";
    hasDischarge = hasDischarge || halfCycle.kind === "discharge";
    if (hasCharge && hasDischarge) {
      cycles.push([cycles.length + 1, currentRows]);
      currentRows = [];
      hasCharge = false;
      hasDischarge = false;
    }
  });

  return cycles.length ? cycles : halfCycles.map((group, index) => [index + 1, group.rows]);
}

function electrochemicalStepGroups(rows, headers) {
  const typeColumn = findColumn(headers, ["Step Type", "Step Name", "State"]);
  const capacityCol = capacityColumn(headers);
  const voltageCol = voltageColumn(headers);
  if (!typeColumn || !capacityCol || !voltageCol) return [];
  const groups = [];
  let current = [];
  let currentKind = "";
  rows.forEach((row) => {
    const kind = stepTypeKind(row[typeColumn]);
    const voltage = readNumber(row[voltageCol]);
    const capacity = readNumber(row[capacityCol]);
    if (!kind || !Number.isFinite(voltage) || !Number.isFinite(capacity)) {
      if (current.length >= 8) groups.push([groups.length + 1, current]);
      current = [];
      currentKind = "";
      return;
    }
    if (currentKind && kind !== currentKind) {
      if (current.length >= 8) groups.push([groups.length + 1, current]);
      current = [];
    }
    current.push(row);
    currentKind = kind;
  });
  if (current.length >= 8) groups.push([groups.length + 1, current]);
  return groups.filter(([, groupRows]) => {
    const capacity = segmentCapacityMAh(groupRows, capacityCol);
    return Number.isFinite(capacity) && capacity > 1e-6;
  });
}

function rateTotalTimeSeries(dataset, cycleTable, cycleColumn) {
  const cycles = numericSeries(cycleTable.rows, cycleColumn);
  const fromSteps = cycleEndHoursFromSteps(dataset?.sheets?.step, cycles);
  if (fromSteps.some(Number.isFinite)) return { values: fromSteps, title: "Total time [h]" };

  let cumulative = 0;
  const chgTime = findColumn(cycleTable.headers, ["Chg. Time", "Charge Time"]);
  const dchgTime = findColumn(cycleTable.headers, ["DChg. Time", "Discharge Time"]);
  const values = cycleTable.rows.map((row) => {
    cumulative += durationLikeToHours(row[chgTime]) + durationLikeToHours(row[dchgTime]);
    return cumulative;
  });
  return { values, title: "Total time [h]" };
}

function cycleEndHoursFromSteps(stepTable, cycles) {
  if (!stepTable?.rows?.length) return [];
  const cycleColumn = findColumn(stepTable.headers, ["Cycle Index", "Cycle", "Cycle number"]);
  const startColumn = findColumn(stepTable.headers, ["Oneset Date", "Onset Date", "Start Date", "Start Time"]);
  const endColumn = findColumn(stepTable.headers, ["End Date", "End Time"]);
  if (!cycleColumn || !startColumn || !endColumn) return [];

  let testStart = Infinity;
  const endByCycle = new Map();
  stepTable.rows.forEach((row) => {
    const cycle = readNumber(row[cycleColumn]);
    const start = dateValueToMs(row[startColumn]);
    const end = dateValueToMs(row[endColumn]);
    if (Number.isFinite(start)) testStart = Math.min(testStart, start);
    if (!Number.isFinite(cycle) || !Number.isFinite(end)) return;
    endByCycle.set(cycle, Math.max(endByCycle.get(cycle) || -Infinity, end));
  });
  if (!Number.isFinite(testStart)) return [];
  return cycles.map((cycle) => {
    const end = endByCycle.get(cycle);
    return Number.isFinite(end) ? (end - testStart) / 3600000 : NaN;
  });
}

function durationLikeToHours(value) {
  const duration = durationTextToHours(String(value ?? "").trim());
  if (Number.isFinite(duration)) return duration;
  const numeric = readNumber(value);
  return Number.isFinite(numeric) ? timeToHours(numeric, "Time") : 0;
}

function dateValueToMs(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return excelEpoch + value * 86400000;
  }
  const text = String(value ?? "").trim();
  if (!text) return NaN;
  const parsed = new Date(text.replace(" ", "T")).getTime();
  return Number.isFinite(parsed) ? parsed : NaN;
}

function durationTextToHours(text) {
  const match = text.match(/^(-)?(?:(\d+)\s+d\s+)?(\d{1,5}):(\d{2})(?::(\d{2}(?:[.,]\d+)?))?$/i);
  if (!match) return NaN;
  const sign = match[1] ? -1 : 1;
  const days = Number(match[2] || 0);
  const hours = Number(match[3] || 0);
  const minutes = Number(match[4] || 0);
  const seconds = readNumber(match[5] || 0);
  return sign * (days * 24 + hours + minutes / 60 + seconds / 3600);
}

function plotActiveMassMg() {
  return readNumber(el.plotActiveMassInput.value);
}

function plotTitle(dataset) {
  const name = el.plotBatteryNameInput.value.trim() || dataset.name;
  return `${name} - ${plotMethodLabel()}`;
}

function plotMethodLabel() {
  return PLOT_METHODS[state.plotMethod]?.label || PLOT_METHODS[state.plotMethod]?.short || "Plot";
}

function plotMethodHint() {
  return PLOT_METHODS[state.plotMethod]?.hint || "";
}

function plotHintText(method, massMg) {
  const sheet = state.selectedSheet ? `Using ${state.selectedSheet}. ` : "";
  if ((method === "cv" || method === "cd" || method === "rate" || method === "dqdv") && !massMg) {
    return `${sheet}Enter active mass to switch to specific values.`;
  }
  return `${sheet}${plotMethodLabel()} preset applied.`;
}

function exactColumn(headers, candidates) {
  const normalized = headers.map((header) => normalizeColumnName(header));
  for (const candidate of candidates) {
    const exactIndex = normalized.indexOf(normalizeColumnName(candidate));
    if (exactIndex >= 0) return headers[exactIndex];
  }
  return "";
}

function findColumn(headers, candidates) {
  const normalized = headers.map((header) => normalizeColumnName(header));
  for (const candidate of candidates) {
    const exactIndex = normalized.indexOf(normalizeColumnName(candidate));
    if (exactIndex >= 0) return headers[exactIndex];
  }
  for (const candidate of candidates) {
    const candidateName = normalizeColumnName(candidate);
    const matchIndex = normalized.findIndex((header) => header.includes(candidateName) || candidateName.includes(header));
    if (matchIndex >= 0) return headers[matchIndex];
  }
  return "";
}

function normalizeColumnName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function plotTraceStyle(index, options = {}) {
  const color = options.color || (state.plotAutoColor ? plotMethodColors()[index % plotMethodColors().length] : state.plotColor);
  return {
    line: { color, width: state.plotLineWidth },
    marker: {
      color,
      size: options.markerSize || state.plotMarkerSize,
      line: { color: "#111111", width: state.plotTheme === "light" ? 0.4 : 0 },
    },
  };
}

function plotMethodColors() {
  return PLOT_METHODS[state.plotMethod]?.colors || plasmaColors();
}

function gradientColors(name, count) {
  const stops = gradientStops(name);
  if (count <= 1) return [stops[0]];
  return Array.from({ length: count }, (_, index) => interpolatePalette(stops, index / (count - 1)));
}

function gradientStops(name) {
  const palettes = {
    plasma: ["#0d0887", "#7e03a8", "#cc4778", "#f89540", "#f0f921"],
    viridis: ["#440154", "#31688e", "#35b779", "#fde725"],
    inferno: ["#000004", "#57106e", "#bc3754", "#f98e09", "#fcffa4"],
    "blue-red": ["#2563eb", "#7e03a8", "#ef4444"],
  };
  return palettes[name] || palettes.plasma;
}

function renderGradientPreview() {
  if (!el.plotGradientPreview) return;
  const stops = gradientStops(state.plotGradient);
  el.plotGradientPreview.style.background = `linear-gradient(90deg, ${stops.join(", ")})`;
}

function interpolatePalette(stops, t) {
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const local = scaled - index;
  return mixHex(stops[index], stops[index + 1], local);
}

function mixHex(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const mixed = ca.map((value, index) => Math.round(value + (cb[index] - value) * t));
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [0, 2, 4].map((offset) => parseInt(clean.slice(offset, offset + 2), 16));
}

function savitzkyGolaySmooth(values, windowSize, polynomialOrder) {
  if (values.length < 3 || windowSize < 3) return values.slice();
  const size = Math.min(oddNumberInRange(windowSize, 3, values.length % 2 ? values.length : values.length - 1), values.length);
  if (size < 3 || size <= polynomialOrder) return values.slice();
  const half = Math.floor(size / 2);
  return values.map((_, index) => {
    const start = Math.max(0, Math.min(index - half, values.length - size));
    const windowValues = values.slice(start, start + size);
    const center = index - start;
    return localPolynomialValue(windowValues, center, polynomialOrder);
  });
}

function localPolynomialValue(values, center, order) {
  const matrixSize = order + 1;
  const normal = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(0));
  const rhs = Array(matrixSize).fill(0);

  values.forEach((value, index) => {
    const x = index - center;
    const powers = Array.from({ length: matrixSize * 2 - 1 }, (_, power) => x ** power);
    for (let row = 0; row < matrixSize; row += 1) {
      rhs[row] += value * powers[row];
      for (let column = 0; column < matrixSize; column += 1) {
        normal[row][column] += powers[row + column];
      }
    }
  });

  return solveLinearSystem(normal, rhs)?.[0] ?? values[center];
}

function solveLinearSystem(matrix, vector) {
  const n = vector.length;
  const a = matrix.map((row, index) => [...row, vector[index]]);
  for (let pivot = 0; pivot < n; pivot += 1) {
    let max = pivot;
    for (let row = pivot + 1; row < n; row += 1) {
      if (Math.abs(a[row][pivot]) > Math.abs(a[max][pivot])) max = row;
    }
    if (Math.abs(a[max][pivot]) < 1e-12) return null;
    [a[pivot], a[max]] = [a[max], a[pivot]];
    const divisor = a[pivot][pivot];
    for (let column = pivot; column <= n; column += 1) a[pivot][column] /= divisor;
    for (let row = 0; row < n; row += 1) {
      if (row === pivot) continue;
      const factor = a[row][pivot];
      for (let column = pivot; column <= n; column += 1) {
        a[row][column] -= factor * a[pivot][column];
      }
    }
  }
  return a.map((row) => row[n]);
}

function oddNumberInRange(value, min, max) {
  const bounded = Math.max(min, Math.min(max, Math.round(value)));
  return bounded % 2 ? bounded : Math.max(min, bounded - 1);
}

function oddOrZero(value, min, max) {
  const rounded = Math.round(value);
  if (rounded <= 0) return 0;
  return oddNumberInRange(rounded, Math.max(3, min), max);
}

function plasmaColors() {
  return ["#0d0887", "#5b02a3", "#9c179e", "#cc4778", "#ed7953", "#fdb42f", "#f0f921"];
}

function plotAxisLayout(title, theme) {
  return {
    title: { text: title, font: { size: 18, color: theme.text } },
    gridcolor: theme.grid,
    zerolinecolor: theme.zero,
    linecolor: theme.axis,
    mirror: true,
    showline: true,
    ticks: "outside",
    ticklen: 8,
    tickwidth: 2,
    tickcolor: theme.axis,
    tickfont: { size: 14, color: theme.text },
  };
}

function plot3dAxisLayout(title, theme) {
  return {
    title: { text: title, font: { size: 15, color: theme.text } },
    gridcolor: theme.grid,
    zerolinecolor: theme.zero,
    linecolor: theme.axis,
    tickfont: { size: 12, color: theme.text },
    backgroundcolor: theme.plot,
    showbackground: true,
    showspikes: false,
  };
}

function plotThemeTokens() {
  if (state.plotTheme === "dark") {
    return {
      paper: "#12091f",
      plot: "#1a1029",
      text: "#f5f0ff",
      muted: "#b8abc9",
      grid: "#3a2b4d",
      zero: "#6e4a7e",
      axis: "#f5f0ff",
      legend: "rgba(18, 9, 31, 0.88)",
    };
  }
  return {
    paper: "#ffffff",
    plot: "#ffffff",
    text: "#18151f",
    muted: "#6d6478",
    grid: "#e5dfeb",
    zero: "#c9bed8",
    axis: "#111111",
    legend: "rgba(255, 255, 255, 0.88)",
  };
}

function attachMiddleAutoscale(node) {
  if (!node || node.dataset.middleAutoscaleBound) return;
  node.dataset.middleAutoscaleBound = "true";

  node.addEventListener("mousedown", (event) => {
    if (event.button === 1) event.preventDefault();
  });

  node.addEventListener("auxclick", (event) => {
    if (event.button !== 1) return;
    event.preventDefault();
    autoscalePlot(node);
  });
}

function autoscalePlot(node) {
  if (!window.Plotly || !node?.data) return;
  const axisUpdate = {};
  Object.keys(node.layout || {}).forEach((key) => {
    if (/^[xy]axis\d*$/.test(key)) {
      axisUpdate[`${key}.autorange`] = true;
    }
  });

  if (!Object.keys(axisUpdate).length) {
    axisUpdate["xaxis.autorange"] = true;
    axisUpdate["yaxis.autorange"] = true;
  }

  Plotly.relayout(node, axisUpdate);
}

function renderStats(table, dataset, plotSpec = {}) {
  const parts = [
    plotSpec.hint || `${plotMethodLabel()} preset applied.`,
    `${table.rowCount.toLocaleString()} rows`,
    `${table.headers.length} columns`,
  ];
  el.datasetStats.innerHTML = parts.map((part) => `<span>${escapeHtml(part)}</span>`).join("");
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
    .join("") || `<div class="schema-item"><strong>${escapeHtml(dataset.name)}</strong><span>Metadata file</span></div>`;
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

function generateReport() {
  const dataSets = state.datasets.filter((dataset) => isDatasetEnabled(dataset) && Object.keys(dataset.sheets).length);
  const metaSets = state.datasets.filter((dataset) => dataset.kind === "metadata");
  if (!dataSets.length) {
    el.reportSheet.innerHTML = `
      <div class="report-empty">
        <strong>No plottable data loaded</strong>
        <span>Drop Neware or Squidstat files into BatBat Plot first.</span>
      </div>
    `;
    switchView("report");
    return;
  }

  const graphLimit = Number(el.reportGraphLimit.value) || 4;
  const chartSpecs = buildReportChartSpecs(dataSets).slice(0, graphLimit);
  const totalRows = dataSets.reduce((sum, dataset) => {
    return sum + Object.values(dataset.sheets).reduce((inner, table) => inner + table.rowCount, 0);
  }, 0);
  const sheetCount = dataSets.reduce((sum, dataset) => sum + Object.keys(dataset.sheets).length, 0);
  const metadata = summarizeMetadata(metaSets);
  const sample = el.reportSampleInput.value.trim() || "Battery sample report";
  const batch = el.reportBatchInput.value.trim() || "Batch not specified";
  const notes = el.reportNotesInput.value.trim() || metadata.notes || "No report notes entered.";

  el.reportSheet.innerHTML = `
    <header class="report-cover">
      <div>
        <p class="eyebrow">BatBat report</p>
        <h2>${escapeHtml(sample)}</h2>
      </div>
      <div class="report-meta">
        <div><span>Batch</span><strong>${escapeHtml(batch)}</strong></div>
        <div><span>Generated</span><strong>${escapeHtml(new Date().toLocaleString())}</strong></div>
        <div><span>Sources</span><strong>${dataSets.length} file(s)</strong></div>
      </div>
    </header>

    <section class="report-kpis">
      ${reportKpi("Rows", totalRows.toLocaleString())}
      ${reportKpi("Tables", sheetCount)}
      ${reportKpi("Graphs", chartSpecs.length)}
      ${reportKpi("Instrument", metadata.instrument || detectInstrumentLabel(dataSets))}
    </section>

    <section class="report-note">${escapeHtml(notes)}</section>

    <section class="report-charts">
      ${chartSpecs.map((spec, index) => reportChartCard(spec, index)).join("")}
    </section>

    <section class="report-data">
      <div class="report-section-title">Data summary</div>
      ${dataSets.map(reportDataRow).join("")}
    </section>
  `;

  switchView("report");
  window.setTimeout(() => renderReportCharts(chartSpecs), 60);
}

function reportKpi(label, value) {
  return `<div class="report-kpi"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function reportChartCard(spec, index) {
  return `
    <div class="report-chart-card">
      <div class="report-chart-title">
        <strong>${escapeHtml(spec.title)}</strong>
        <span>${escapeHtml(spec.dataset)}</span>
      </div>
      <div class="report-chart" id="reportChart${index}"></div>
    </div>
  `;
}

function reportDataRow(dataset) {
  const rows = Object.values(dataset.sheets).reduce((sum, table) => sum + table.rowCount, 0);
  const sheets = Object.keys(dataset.sheets).join(", ");
  return `
    <div class="report-data-row">
      <span>${escapeHtml(dataset.name)}</span>
      <strong>${rows.toLocaleString()} rows - ${escapeHtml(sheets)}</strong>
    </div>
  `;
}

function buildReportChartSpecs(dataSets) {
  return dataSets.flatMap((dataset) => {
    if (dataset.kind === "squidstat") return squidstatReportSpecs(dataset);
    if (dataset.kind === "neware") return newareReportSpecs(dataset);
    return genericReportSpecs(dataset);
  }).filter((spec) => spec.yColumns.length);
}

function squidstatReportSpecs(dataset) {
  const table = Object.values(dataset.sheets)[0];
  if (!table) return [];
  const specs = [];
  if (hasColumns(table, ["Working Electrode (V)", "Current (A)"])) {
    specs.push(chartSpec(dataset, "data", table, "Working Electrode (V)", ["Current (A)"], "CV current response"));
  }
  if (hasColumns(table, ["Elapsed Time (s)", "Working Electrode (V)"])) {
    specs.push(chartSpec(dataset, "data", table, "Elapsed Time (s)", ["Working Electrode (V)"], "Potential over time"));
  }
  if (hasColumns(table, ["Elapsed Time (s)", "Cumulative Charge (mAh)"])) {
    specs.push(chartSpec(dataset, "data", table, "Elapsed Time (s)", ["Cumulative Charge (mAh)"], "Cumulative charge"));
  }
  return specs;
}

function newareReportSpecs(dataset) {
  const specs = [];
  const cycle = dataset.sheets.cycle;
  const record = dataset.sheets.record;
  if (cycle && hasColumns(cycle, ["Cycle Index", "DChg. Cap.(Ah)"])) {
    specs.push(chartSpec(dataset, "cycle", cycle, "Cycle Index", ["Chg. Cap.(Ah)", "DChg. Cap.(Ah)"], "Capacity retention"));
  }
  if (cycle && hasColumns(cycle, ["Cycle Index", "Chg.-DChg. Eff(%)"])) {
    specs.push(chartSpec(dataset, "cycle", cycle, "Cycle Index", ["Chg.-DChg. Eff(%)"], "Coulombic efficiency"));
  }
  if (record && hasColumns(record, ["DataPoint", "Voltage(V)"])) {
    specs.push(chartSpec(dataset, "record", record, "DataPoint", ["Voltage(V)"], "Voltage trace"));
  }
  if (record && hasColumns(record, ["DataPoint", "Current(A)"])) {
    specs.push(chartSpec(dataset, "record", record, "DataPoint", ["Current(A)"], "Current trace"));
  }
  return specs;
}

function genericReportSpecs(dataset) {
  return Object.entries(dataset.sheets).flatMap(([sheetName, table]) => {
    const numeric = table.headers.filter((header) => table.rows.some((row) => typeof row[header] === "number"));
    if (numeric.length < 2) return [];
    return [chartSpec(dataset, sheetName, table, numeric[0], [numeric[1]], `${sheetName} overview`)];
  });
}

function chartSpec(dataset, sheetName, table, xColumn, yColumns, title) {
  return {
    dataset: dataset.name,
    sheetName,
    title,
    xColumn,
    yColumns: yColumns.filter((column) => table.headers.includes(column)),
    rows: downsampleRows(table.rows, 900),
  };
}

function renderReportCharts(chartSpecs) {
  if (!window.Plotly) return;
  const theme = plotThemeTokens();
  chartSpecs.forEach((spec, index) => {
    const node = document.querySelector(`#reportChart${index}`);
    if (!node) return;
    const traces = spec.yColumns.map((column) => ({
      x: spec.rows.map((row) => row[spec.xColumn]),
      y: spec.rows.map((row) => row[column]),
      type: "scatter",
      mode: spec.title.includes("CV") ? "lines" : "lines+markers",
      name: column,
      line: { width: 2 },
      marker: { size: 3 },
    }));
    Plotly.react(
      node,
      traces,
      {
        paper_bgcolor: theme.paper,
        plot_bgcolor: theme.plot,
        font: { color: theme.text },
        margin: { t: 8, r: 10, b: 42, l: 54 },
        xaxis: { title: spec.xColumn, gridcolor: theme.grid, zerolinecolor: theme.zero },
        yaxis: { title: spec.yColumns.join(", "), gridcolor: theme.grid, zerolinecolor: theme.zero },
        showlegend: spec.yColumns.length > 1,
        colorway: plasmaColors(),
      },
      { responsive: true, displayModeBar: false },
    );
    attachMiddleAutoscale(node);
  });
}

function downsampleRows(rows, maxRows) {
  if (rows.length <= maxRows) return rows;
  const step = Math.ceil(rows.length / maxRows);
  return rows.filter((_, index) => index % step === 0);
}

function hasColumns(table, columns) {
  return columns.every((column) => table.headers.includes(column));
}

function summarizeMetadata(metaSets) {
  const metadata = metaSets.map((dataset) => dataset.metadata);
  const first = metadata[0] || {};
  const application = first["Application Metadata"] || {};
  const userNotes = first["User Notes and Settings"] || {};
  return {
    instrument: application["Device Name"]
      ? `${application["Device Name"]} ch${application.Channel || ""}`.trim()
      : "",
    notes: userNotes.Notes || first.Notes || "",
  };
}

function detectInstrumentLabel(dataSets) {
  const kinds = new Set(dataSets.map((dataset) => dataset.kind));
  if (kinds.has("squidstat") && kinds.has("neware")) return "Mixed";
  if (kinds.has("squidstat")) return "Squidstat";
  if (kinds.has("neware")) return "Neware";
  return "Data";
}

function getSelectedDataset() {
  return state.datasets.find((dataset) => dataset.id === state.selectedDatasetId);
}

function getSelectedTable() {
  const dataset = getSelectedDataset();
  if (!dataset) return null;
  if (state.plotMethod !== "custom") {
    const sheetName = preferredSheetName(dataset, state.plotMethod);
    state.selectedSheet = sheetName;
    return dataset.sheets[sheetName];
  }
  return dataset.sheets[state.selectedSheet] || dataset.sheets[preferredSheetName(dataset)];
}

function tableForDatasetMethod(dataset, method) {
  const sheetName = preferredSheetName(dataset, method);
  return dataset?.sheets?.[sheetName] || null;
}

function preferredSheetName(dataset, method = state.plotMethod) {
  if (!dataset) return "";
  const names = Object.keys(dataset.sheets);
  const lower = (name) => name.toLowerCase();
  const byMethod = {
    rate: ["step", "record", "cycle", "summary"],
    "rate-time": ["step", "record", "cycle", "summary"],
    dqdv: ["record", "data", "cycle"],
    cd: ["record", "data", "cycle"],
    "cd-time": ["record", "data", "cycle"],
    "v-cycle": ["cycle", "record", "data"],
    cv: ["data", "record"],
    eis: ["data", "record"],
    gitt: ["data", "record"],
  }[method] || [];

  for (const preferred of byMethod) {
    const match = names.find((name) => lower(name).includes(preferred));
    if (match) return match;
  }

  return names.find((name) => lower(name) === "data")
    || names.find((name) => lower(name) === "cycle")
    || names.find((name) => lower(name) === "record")
    || names[0]
    || "";
}

function pickColumn(headers, preferred) {
  return preferred.find((name) => headers.includes(name));
}

function preferredPlotMethod(dataset) {
  if (!dataset) return "cv";
  const headers = Object.values(dataset.sheets).flatMap((table) => table.headers || []);
  if (hasVoltageColumn(headers) && hasCapacityColumn(headers)) return "cd";
  if (hasEisColumns(headers)) return "eis";
  if (hasVoltageColumn(headers) && hasCurrentColumn(headers)) return "cv";
  if (hasCycleSummaryColumns(headers)) return "rate";
  return "custom";
}

function preferredPlotFamily(dataset) {
  return datasetFamily(dataset);
}

function syncAdvancedPlotControls() {
  const canUse3d = ["cv", "dqdv"].includes(state.plotMethod);
  if (!canUse3d) state.plot3d = false;
  if (el.plot3dToggleBtn) {
    el.plot3dToggleBtn.hidden = !canUse3d;
    el.plot3dToggleBtn.classList.toggle("active", canUse3d && state.plot3d);
    el.plot3dToggleBtn.setAttribute("aria-pressed", String(canUse3d && state.plot3d));
  }
  if (el.advancedPlotControls) {
    el.advancedPlotControls.hidden = state.plotMethod !== "custom";
    el.advancedPlotControls.open = state.plotMethod === "custom";
  }
  if (el.dqdvControls) {
    el.dqdvControls.hidden = state.plotMethod !== "dqdv";
    el.dqdvControls.open = state.plotMethod === "dqdv";
  }
  if (el.cycleControls) {
    el.cycleControls.hidden = !["cd", "cd-time", "rate", "rate-time", "dqdv"].includes(state.plotMethod);
  }
}

function exportSelectedCsv() {
  const table = getSelectedTable();
  const dataset = getSelectedDataset();
  if (!table || !dataset) return;
  const spec = buildPlotSpec(table, dataset);
  if (!spec.traces.length) return;
  const traces = orderedTracesForExport(spec.traces);
  const headers = [spec.xTitle, ...traces.map((trace) => trace.name)];
  const rowCount = Math.max(...traces.map((trace) => trace.x.length));
  const rows = Array.from({ length: rowCount }, (_, index) => [
    traces[0].x[index],
    ...traces.map((trace) => trace.y[index]),
  ]);
  downloadText(`${plotExportBaseName(dataset, spec)}.csv`, toCsv([headers, ...rows]));
}

function orderedTracesForExport(traces) {
  return [...traces].sort((a, b) => traceExportRank(a.name) - traceExportRank(b.name));
}

function traceExportRank(name) {
  const normalized = normalizeColumnName(name || "");
  if (normalized === "ce" || normalized.includes("coulombic") || normalized.includes("eff")) return 30;
  if ((normalized.includes("charge") || normalized.includes("chg")) && !normalized.includes("discharge") && !normalized.includes("dchg")) return 10;
  if (normalized.includes("discharge") || normalized.includes("dchg")) return 20;
  return 100;
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
  const dataset = getSelectedDataset();
  const table = getSelectedTable();
  const spec = dataset && table ? buildPlotSpec(table, dataset) : null;
  Plotly.downloadImage(el.plotCanvas, {
    format: "png",
    filename: plotExportBaseName(dataset, spec),
    width: 1600,
    height: 960,
    scale: 2,
  });
}

function bindCalculator() {
  const decimalInputs = [
    el.grossMassInput,
    el.emptyMassInput,
    el.diameterInput,
    el.nominalInput,
    el.recipeAmInput,
    el.recipeCarbonInput,
    el.recipeBinderInput,
    el.recipeExtraInput,
  ];
  decimalInputs.forEach((input) => {
    bindDecimalInput(input);
    input.addEventListener("input", calculate);
  });
  [el.newMaterialCapacityInput, el.newFoilDiameterInput, el.newFoilMassInput].forEach(bindDecimalInput);
  el.batchMassesInput.addEventListener("input", calculate);
  el.toggleBatchBtn.addEventListener("click", () => {
    el.batchPanel.hidden = !el.batchPanel.hidden;
    el.toggleBatchBtn.classList.toggle("active", !el.batchPanel.hidden);
    calculate();
  });
  el.materialPresetSelect.addEventListener("change", applyMaterialPreset);
  el.foilPresetSelect.addEventListener("change", applyFoilPreset);
  el.calcOptionsBtn.addEventListener("click", openCalcOptions);
  el.closeCalcOptionsBtn.addEventListener("click", closeCalcOptions);
  el.saveCalcOptionsBtn.addEventListener("click", saveCalcOptionsFromDialog);
  el.addMaterialStandardBtn.addEventListener("click", addMaterialStandardRow);
  el.addFoilStandardBtn.addEventListener("click", addFoilStandardRow);
  el.materialStandardsList.addEventListener("click", handleStandardListClick);
  el.foilStandardsList.addEventListener("click", handleStandardListClick);
  el.copyCyclerLineBtn.addEventListener("click", async () => {
    const text = el.cyclerLineInput.value;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      el.cyclerLineInput.select();
    }
  });
  renderCalculatorPresetSelects();
  applyMaterialPreset(false);
  applyFoilPreset(false);
  hydrateCalcStandardsForm();
}

function bindDecimalInput(input) {
  if (!input) return;
  if (input.dataset.decimalBound === "true") return;
  input.dataset.decimalBound = "true";
  input.addEventListener("keydown", (event) => {
    if (event.key !== ",") return;
    event.preventDefault();
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.setRangeText(".", start, end, "end");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  input.addEventListener("input", () => {
    const normalized = input.value.replace(/,/g, ".");
    if (normalized !== input.value) input.value = normalized;
  });
}

function calculate() {
  const grossMass = readNumber(el.grossMassInput.value);
  const emptyMass = readNumber(el.emptyMassInput.value);
  const diameter = readNumber(el.diameterInput.value);
  const nominal = readNumber(el.nominalInput.value);
  const recipeAm = readNumber(el.recipeAmInput.value);
  const recipeCarbon = readNumber(el.recipeCarbonInput.value);
  const recipeBinder = readNumber(el.recipeBinderInput.value);
  const recipeExtra = readNumber(el.recipeExtraInput.value);
  const totalRecipe = recipeAm + recipeCarbon + recipeBinder + recipeExtra;
  const amFraction = totalRecipe > 0 ? recipeAm / totalRecipe : 0;
  const netMass = Math.max(grossMass - emptyMass, 0);
  const activeMass = netMass * amFraction;
  const area = diameter ? Math.PI * (diameter / 20) ** 2 : 0;
  const loading = area ? activeMass / area : 0;
  const oneC = (activeMass / 1000) * nominal;
  const rates = [
    ["C/20", 1 / 20],
    ["C/10", 1 / 10],
    ["C/5", 1 / 5],
    ["C/2", 1 / 2],
    ["1C", 1],
    ["2C", 2],
    ["5C", 5],
  ];

  el.calcResults.innerHTML = [
    ["AM fraction", `${formatPercent(amFraction)}`],
    ["Net coating", `${formatNumber(netMass)} mg`],
    ["AM mass", `${formatNumber(activeMass)} mg`],
    ["Loading", `${formatNumber(loading)} mg/cm2`],
    ["Area", `${formatNumber(area)} cm2`],
    ["1C current", `${formatNumber(oneC)} mA`],
  ]
    .map(([label, value]) => `<div class="result-card"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");

  el.rateTable.innerHTML = `
    <thead><tr><th>Rate</th><th>Current</th></tr></thead>
    <tbody>
      ${rates
        .map(([label, factor]) => `<tr><td>${label}</td><td>${formatNumber(oneC * factor)} mA</td></tr>`)
        .join("")}
    </tbody>
  `;
  el.cyclerLineInput.value = [
    `AM=${formatNumber(activeMass)} mg`,
    `loading=${formatNumber(loading)} mg/cm2`,
    `1C=${formatNumber(oneC)} mA`,
    `C/10=${formatNumber(oneC / 10)} mA`,
    `C/5=${formatNumber(oneC / 5)} mA`,
    `C/2=${formatNumber(oneC / 2)} mA`,
  ].join(" | ");
  renderBatchResults(emptyMass, amFraction, area, nominal);
}

function renderBatchResults(emptyMass, amFraction, area, nominal) {
  const masses = parseBatchMasses(el.batchMassesInput.value);
  if (!masses.length) {
    el.batchResults.innerHTML = "";
    return;
  }
  const rows = masses.map((grossMass, index) => {
    const activeMass = Math.max(grossMass - emptyMass, 0) * amFraction;
    const loading = area ? activeMass / area : 0;
    const oneC = (activeMass / 1000) * nominal;
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${formatNumber(grossMass)} mg</td>
        <td>${formatNumber(activeMass)} mg</td>
        <td>${formatNumber(loading)} mg/cm2</td>
        <td>${formatNumber(oneC)} mA</td>
      </tr>
    `;
  });
  el.batchResults.innerHTML = `
    <table>
      <thead><tr><th>#</th><th>Gross</th><th>AM</th><th>Loading</th><th>1C</th></tr></thead>
      <tbody>${rows.join("")}</tbody>
    </table>
  `;
}

function parseBatchMasses(value) {
  return (String(value || "").match(/-?\d+(?:[.,]\d+)?/g) || [])
    .map((item) => readNumber(item))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function applyMaterialPreset(shouldCalculate = true) {
  const preset = state.calcStandards.materials[el.materialPresetSelect.value];
  if (preset) el.nominalInput.value = formatInputNumber(preset.capacity);
  if (shouldCalculate !== false) calculate();
}

function applyFoilPreset(shouldCalculate = true) {
  const preset = state.calcStandards.foils[el.foilPresetSelect.value];
  if (preset) {
    el.emptyMassInput.value = formatInputNumber(preset.mass);
    if (Number.isFinite(preset.diameter)) el.diameterInput.value = formatInputNumber(preset.diameter);
  }
  if (shouldCalculate !== false) calculate();
}

function openCalcOptions() {
  hydrateCalcStandardsForm();
  if (typeof el.calcOptionsDialog.showModal === "function") {
    el.calcOptionsDialog.showModal();
  } else {
    el.calcOptionsDialog.setAttribute("open", "");
  }
}

function closeCalcOptions() {
  if (typeof el.calcOptionsDialog.close === "function") {
    el.calcOptionsDialog.close();
  } else {
    el.calcOptionsDialog.removeAttribute("open");
  }
}

function hydrateCalcStandardsForm() {
  renderStandardRows();
  el.newMaterialNameInput.value = "";
  el.newMaterialCapacityInput.value = "";
  el.newFoilNameInput.value = "";
  el.newFoilDiameterInput.value = "";
  el.newFoilMassInput.value = "";
}

function saveCalcOptionsFromDialog() {
  state.calcStandards = readCalcStandardsForm();
  saveCalcStandards();
  renderCalculatorPresetSelects();
  hydrateCalcStandardsForm();
  applyMaterialPreset(false);
  applyFoilPreset(false);
  calculate();
  closeCalcOptions();
}

function renderCalculatorPresetSelects() {
  const selectedMaterial = el.materialPresetSelect.value;
  const selectedFoil = el.foilPresetSelect.value;
  el.materialPresetSelect.innerHTML = Object.entries(state.calcStandards.materials)
    .map(([id, material]) => {
      return `<option value="${escapeHtml(id)}">${escapeHtml(material.label)}</option>`;
    })
    .join("");
  el.foilPresetSelect.innerHTML = Object.entries(state.calcStandards.foils)
    .map(([id, foil]) => {
      return `<option value="${escapeHtml(id)}">${escapeHtml(foilStandardLabel(foil))}</option>`;
    })
    .join("");
  el.materialPresetSelect.value = state.calcStandards.materials[selectedMaterial]
    ? selectedMaterial
    : Object.keys(state.calcStandards.materials)[0] || "";
  el.foilPresetSelect.value = state.calcStandards.foils[selectedFoil]
    ? selectedFoil
    : Object.keys(state.calcStandards.foils)[0] || "";
}

function renderStandardRows() {
  el.materialStandardsList.innerHTML = Object.entries(state.calcStandards.materials)
    .map(([id, material]) => {
      return `
        <div class="standard-row" data-standard-kind="material" data-standard-id="${escapeHtml(id)}">
          <input class="standard-label-input" value="${escapeHtml(material.label)}" aria-label="Material name" />
          <div class="input-combo">
            <input class="standard-capacity-input" inputmode="decimal" value="${formatInputNumber(material.capacity)}" aria-label="Specific capacity" />
            <span>mAh/g</span>
          </div>
          <button class="ghost-button danger-button" type="button" data-standard-action="remove" title="Remove material">Remove</button>
        </div>
      `;
    })
    .join("");
  el.foilStandardsList.innerHTML = Object.entries(state.calcStandards.foils)
    .map(([id, foil]) => {
      return `
        <div class="standard-row foil-standard-row" data-standard-kind="foil" data-standard-id="${escapeHtml(id)}">
          <input class="standard-label-input" value="${escapeHtml(foil.label)}" aria-label="Foil name" />
          <div class="input-combo">
            <input class="standard-diameter-input" inputmode="decimal" value="${formatInputNumber(foil.diameter)}" aria-label="Foil diameter" />
            <span>mm</span>
          </div>
          <div class="input-combo">
            <input class="standard-mass-input" inputmode="decimal" value="${formatInputNumber(foil.mass)}" aria-label="Foil mass" />
            <span>mg</span>
          </div>
          <button class="ghost-button danger-button" type="button" data-standard-action="remove" title="Remove foil">Remove</button>
        </div>
      `;
    })
    .join("");
  el.calcOptionsDialog.querySelectorAll('input[inputmode="decimal"]').forEach(bindDecimalInput);
}

function readCalcStandardsForm() {
  const materials = {};
  el.materialStandardsList.querySelectorAll(".standard-row").forEach((row) => {
    const id = row.dataset.standardId;
    const label = row.querySelector(".standard-label-input")?.value;
    const capacity = row.querySelector(".standard-capacity-input")?.value;
    const parsedCapacity = readPositiveStandard(capacity, NaN);
    if (!id || !Number.isFinite(parsedCapacity)) return;
    materials[id] = { label: cleanStandardLabel(label, "Material"), capacity: parsedCapacity };
  });
  const foils = {};
  el.foilStandardsList.querySelectorAll(".standard-row").forEach((row) => {
    const id = row.dataset.standardId;
    const label = row.querySelector(".standard-label-input")?.value;
    const diameter = readPositiveStandard(row.querySelector(".standard-diameter-input")?.value, NaN);
    const mass = readPositiveStandard(row.querySelector(".standard-mass-input")?.value, NaN);
    if (!id || !Number.isFinite(diameter) || !Number.isFinite(mass)) return;
    foils[id] = { label: cleanStandardLabel(label, "Foil"), diameter, mass };
  });
  const defaults = cloneCalcStandards();
  return {
    materials: Object.keys(materials).length ? materials : defaults.materials,
    foils: Object.keys(foils).length ? foils : defaults.foils,
  };
}

function addMaterialStandardRow() {
  const label = cleanStandardLabel(el.newMaterialNameInput.value, "New material");
  const capacity = readPositiveStandard(el.newMaterialCapacityInput.value, 372);
  state.calcStandards = readCalcStandardsForm();
  const id = standardId(label, state.calcStandards.materials);
  state.calcStandards.materials[id] = { label, capacity };
  hydrateCalcStandardsForm();
}

function addFoilStandardRow() {
  const label = cleanStandardLabel(el.newFoilNameInput.value, "New foil");
  const diameter = readPositiveStandard(el.newFoilDiameterInput.value, readNumber(el.diameterInput.value) || 15);
  const mass = readPositiveStandard(el.newFoilMassInput.value, readNumber(el.emptyMassInput.value) || 1);
  state.calcStandards = readCalcStandardsForm();
  const id = standardId(`${label}-${diameter}mm`, state.calcStandards.foils);
  state.calcStandards.foils[id] = { label, diameter, mass };
  hydrateCalcStandardsForm();
}

function handleStandardListClick(event) {
  const button = event.target.closest("[data-standard-action='remove']");
  if (!button) return;
  const row = button.closest(".standard-row");
  if (!row) return;
  if (row.dataset.standardKind === "material" && el.materialStandardsList.querySelectorAll(".standard-row").length <= 1) return;
  if (row.dataset.standardKind === "foil" && el.foilStandardsList.querySelectorAll(".standard-row").length <= 1) return;
  row.remove();
}

function foilStandardLabel(foil) {
  if (!Number.isFinite(foil.diameter)) return foil.label;
  if (new RegExp(`\\b${String(foil.diameter).replace(".", "\\.")}\\s*mm\\b`, "i").test(foil.label)) {
    return foil.label;
  }
  return `${foil.label} ${formatInputNumber(foil.diameter)} mm`;
}

function formatInputNumber(value) {
  return Number.isFinite(value) ? String(value) : "";
}

function updateSessionSummary() {
  const active = state.datasets.filter(isDatasetEnabled);
  const rows = active.reduce((sum, dataset) => {
    return sum + Object.values(dataset.sheets).reduce((inner, table) => inner + table.rowCount, 0);
  }, 0);
  el.sessionSummary.textContent = state.datasets.length
    ? `${active.length}/${state.datasets.length} file(s) active, ${rows.toLocaleString()} parsed rows`
    : "No files loaded";
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

function plotExportBaseName(dataset, spec = null) {
  const sample = el.plotBatteryNameInput?.value?.trim() || dataset?.name || "batbat";
  const plotPart = plotExportLabel(spec);
  return [safeName(sample), plotPart].filter(Boolean).join("_");
}

function plotExportLabel(spec = null) {
  const method = state.plotMethod;
  if (method === "rate") return "rate_capacity_ce_vs_cycle";
  if (method === "rate-time") return "rate_capacity_ce_vs_total_time";
  if (method === "cd") return "cd_voltage_vs_capacity";
  if (method === "cd-time") return "cd_voltage_vs_total_time";
  if (method === "v-cycle") return "voltage_vs_cycle_index";
  if (method === "cv") return state.plot3d ? "cv_3d_stack" : "cv_current_vs_voltage";
  if (method === "dqdv") return state.plot3d ? "dqdv_3d_stack" : "dqdv_derivative";
  if (method === "eis") return "eis_nyquist";
  if (method === "gitt") return "gitt_voltage_vs_time";
  if (method === "custom" && spec?.xTitle && spec?.yTitle) return `custom_${safeName(spec.yTitle)}_vs_${safeName(spec.xTitle)}`;
  return safeName(`${method}_plot`);
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

function formatFullDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function durationMinutes(start, end) {
  const started = new Date(start);
  const ended = new Date(end);
  if (Number.isNaN(started.getTime()) || Number.isNaN(ended.getTime())) return "";
  return Math.max(0, Math.round((ended - started) / 60000));
}

function formatDuration(start, end) {
  const minutes = durationMinutes(start, end);
  if (minutes === "") return "open time unknown";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 6,
    useGrouping: false,
  }).format(value);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "0%";
  return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 2 }).format(value);
}

function readNumber(value) {
  const text = String(value ?? "").trim();
  if (!text) return 0;
  const hasComma = text.includes(",");
  const hasDot = text.includes(".");
  let normalized = text;
  if (hasComma && hasDot) {
    const lastComma = text.lastIndexOf(",");
    const lastDot = text.lastIndexOf(".");
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    normalized = text.replaceAll(thousands, "").replace(decimal, ".");
  } else {
    normalized = text.replace(",", ".");
  }
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

boot();

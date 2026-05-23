const STORAGE_KEY = "batbat.reservations.v2";
const PROFILE_KEY = "batbat.profile.v1";
const MEMBER_KEY = "batbat.members.v1";
const VIEW_KEY = "batbat.activeView.v1";
const CHANNEL_COLUMNS = 8;
const CHANNEL_ROWS = 5;
const ACTIVE_CHANNELS = CHANNEL_COLUMNS * CHANNEL_ROWS;
const DEFAULT_TEAM_MEMBERS = [
  { id: "tom", name: "Tom", color: "#f0f921" },
  { id: "member-2", name: "Member 2", color: "#fdca26" },
  { id: "member-3", name: "Member 3", color: "#cc4778" },
  { id: "member-4", name: "Member 4", color: "#7e03a8" },
];

const state = {
  reservations: [],
  selectedChannels: new Set(),
  lastSelectedChannel: null,
  openChannel: null,
  menuChannel: null,
  clickTimer: null,
  teamMembers: [...DEFAULT_TEAM_MEMBERS],
  profile: {
    memberId: "tom",
    name: "Tom",
    color: "#f0f921",
  },
  datasets: [],
  selectedDatasetId: null,
  selectedSheet: null,
  plotMode: "lines",
  plotTheme: "light",
};

const el = {
  tabs: document.querySelectorAll(".nav-tab"),
  views: document.querySelectorAll(".view"),
  sessionSummary: document.querySelector("#sessionSummary"),
  channelGrid: document.querySelector("#channelGrid"),
  exportReservationsBtn: document.querySelector("#exportReservationsBtn"),
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
  sheetSelect: document.querySelector("#sheetSelect"),
  xColumnSelect: document.querySelector("#xColumnSelect"),
  yColumnSelect: document.querySelector("#yColumnSelect"),
  plotMode: document.querySelector("#plotMode"),
  plotTheme: document.querySelector("#plotTheme"),
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
  materialPresetSelect: document.querySelector("#materialPresetSelect"),
  grossMassInput: document.querySelector("#grossMassInput"),
  emptyMassInput: document.querySelector("#emptyMassInput"),
  diameterInput: document.querySelector("#diameterInput"),
  nominalInput: document.querySelector("#nominalInput"),
  recipeAmInput: document.querySelector("#recipeAmInput"),
  recipeCarbonInput: document.querySelector("#recipeCarbonInput"),
  recipeBinderInput: document.querySelector("#recipeBinderInput"),
  recipeExtraInput: document.querySelector("#recipeExtraInput"),
  calcResults: document.querySelector("#calcResults"),
  rateTable: document.querySelector("#rateTable"),
  cyclerLineInput: document.querySelector("#cyclerLineInput"),
  copyCyclerLineBtn: document.querySelector("#copyCyclerLineBtn"),
};

function boot() {
  state.reservations = loadReservations();
  state.teamMembers = loadTeamMembers();
  state.profile = loadProfile();
  bindNavigation();
  bindReservations();
  bindFiles();
  bindReports();
  bindCalculator();
  renderMemberList();
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
  return {
    id: member.id || crypto.randomUUID(),
    name: member.name.trim(),
    color: /^#[0-9a-f]{6}$/i.test(member.color) ? member.color : "#f0f921",
  };
}

function saveTeamMembers() {
  localStorage.setItem(MEMBER_KEY, JSON.stringify(state.teamMembers));
}

function loadProfile() {
  try {
    const saved = { ...state.profile, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") };
    return activeMember(saved.memberId) ? saved : state.profile;
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
  el.exportReservationsBtn.addEventListener("click", exportReservations);
  el.addMemberBtn.addEventListener("click", addTeamMember);
  el.memberNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addTeamMember();
  });
  el.memberList.addEventListener("input", handleMemberInput);
  el.memberList.addEventListener("change", handleMemberInput);
  el.memberList.addEventListener("click", handleMemberClick);
  el.clearSelectionBtn.addEventListener("click", () => {
    state.selectedChannels.clear();
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

  channels.forEach((currentChannel) => {
    if (toggleSelect && state.selectedChannels.has(currentChannel)) {
      state.selectedChannels.delete(currentChannel);
      return;
    }
    state.selectedChannels.add(currentChannel);
  });

  state.lastSelectedChannel = channelNumber;

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
    <button class="menu-button danger" data-action="free">Free channel${targetCount > 1 ? "s" : ""}</button>
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
    const selected = new Set(channels);
    state.reservations = state.reservations.filter((item) => !selected.has(item.channelNumber));
    channels.forEach((channel) => state.selectedChannels.delete(channel));
    saveReservations();
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
  const channels = targetChannels(channelNumber);
  reserveChannels(channels, member);
  channels.forEach((channel) => state.selectedChannels.add(channel));
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
  const selected = new Set(state.selectedChannels);
  if (!selected.size) return;
  state.reservations = state.reservations.filter((item) => !selected.has(item.channelNumber));
  state.selectedChannels.clear();
  el.batteryNameInput.value = "";
  el.activeMassInput.value = "";
  el.channelDetailsInput.value = "";
  saveReservations();
  renderReservations();
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
}

function sharedValue(items, key) {
  if (!items.length) return "";
  const first = items[0][key] || "";
  return items.every((item) => (item[key] || "") === first) ? first : "";
}

function findReservation(channelNumber) {
  return state.reservations.find((item) => item.channelNumber === channelNumber);
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
  const firstPlottable = parsed.find((dataset) => Object.keys(dataset.sheets).length) || parsed[0];
  state.selectedDatasetId = firstPlottable.id;
  state.selectedSheet = preferredSheetName(firstPlottable);
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
      metadata: parseNotes(text),
      sheets: {},
    };
  }
  if (extension === "csv" || extension === "tsv") {
    const text = await file.text();
    const delimiter = extension === "tsv" ? "\t" : detectDelimiter(text);
    const table = normalizeRows(parseDelimited(text, delimiter));
    return {
      id,
      name: file.name,
      kind: inferDatasetKind(file.name, { data: table }),
      sheets: {
        data: table,
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
  return { id, name: file.name, kind: inferDatasetKind(file.name, sheets), sheets };
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

function parseNotes(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { Notes: text.slice(0, 4000) };
  }
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
  const dataset = getSelectedDataset();
  const table = getSelectedTable();
  const headers = table?.headers || [];
  const options = headers.map((header) => `<option value="${escapeHtml(header)}">${escapeHtml(header)}</option>`);
  el.xColumnSelect.innerHTML = options.join("");
  el.yColumnSelect.innerHTML = options.join("");

  const xCandidates =
    dataset?.kind === "squidstat"
      ? ["Working Electrode (V)", "Elapsed Time (s)", "Cycle"]
      : ["Cycle Index", "Total Time", "Time", "Date", "DataPoint"];
  const yCandidates =
    dataset?.kind === "squidstat"
      ? ["Current (A)", "|Current| (A)", "Cumulative Charge (mAh)"]
      : ["Voltage(V)", "DChg. Cap.(Ah)", "Capacity(Ah)", "Current(A)"];
  const preferredX = pickColumn(headers, xCandidates) || headers[0];
  const preferredY = pickColumn(headers, yCandidates) || headers[1];
  el.xColumnSelect.value = preferredX || "";
  [...el.yColumnSelect.options].forEach((option) => {
    option.selected =
      option.value === preferredY ||
      option.value === "Current(A)" ||
      (dataset?.kind === "squidstat" && option.value === "Cumulative Charge (mAh)");
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
  const theme = plotThemeTokens();

  Plotly.react(el.plotCanvas, traces, {
    title: { text: `${dataset.name} - ${state.selectedSheet}`, x: 0.03 },
    paper_bgcolor: theme.paper,
    plot_bgcolor: theme.plot,
    font: { color: theme.text },
    margin: { t: 60, r: 26, b: 58, l: 64 },
    xaxis: { title: xColumn, gridcolor: theme.grid, zerolinecolor: theme.zero },
    yaxis: { title: yColumns.join(", "), gridcolor: theme.grid, zerolinecolor: theme.zero },
    legend: { orientation: "h", y: -0.22, font: { color: theme.text } },
    colorway: plasmaColors(),
  }, { responsive: true, displaylogo: false });

  attachMiddleAutoscale(el.plotCanvas);
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
  }
}

function plasmaColors() {
  return ["#0d0887", "#5b02a3", "#9c179e", "#cc4778", "#ed7953", "#fdb42f", "#f0f921"];
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
    };
  }
  return {
    paper: "#ffffff",
    plot: "#ffffff",
    text: "#18151f",
    muted: "#6d6478",
    grid: "#e5dfeb",
    zero: "#c9bed8",
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
  const dataSets = state.datasets.filter((dataset) => Object.keys(dataset.sheets).length);
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
    specs.push(chartSpec(dataset, "cycle", cycle, "Cycle Index", ["DChg. Cap.(Ah)", "Chg. Cap.(Ah)"], "Capacity retention"));
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
  [
    el.grossMassInput,
    el.emptyMassInput,
    el.diameterInput,
    el.nominalInput,
    el.recipeAmInput,
    el.recipeCarbonInput,
    el.recipeBinderInput,
    el.recipeExtraInput,
  ].forEach((input) => {
    input.addEventListener("input", calculate);
  });
  el.materialPresetSelect.addEventListener("change", applyMaterialPreset);
  el.copyCyclerLineBtn.addEventListener("click", async () => {
    const text = el.cyclerLineInput.value;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      el.cyclerLineInput.select();
    }
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
}

function applyMaterialPreset() {
  const presets = {
    graphite: { capacity: 372, collector: 43 },
    nmc: { capacity: 180, collector: 43 },
    lfp: { capacity: 160, collector: 43 },
    custom: null,
  };
  const preset = presets[el.materialPresetSelect.value];
  if (preset) {
    el.nominalInput.value = preset.capacity;
    el.emptyMassInput.value = preset.collector;
  }
  calculate();
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

function formatNumber(value) {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat(undefined, { maximumSignificantDigits: 5 }).format(value);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "0%";
  return new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 2 }).format(value);
}

function readNumber(value) {
  const number = Number(String(value ?? "").replace(",", "."));
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

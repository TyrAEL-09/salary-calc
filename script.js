const weekdayNames = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const weekdayShort = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const monthInput = document.getElementById("monthInput");
const calendarTitle = document.getElementById("calendarTitle");
const weekdaysEl = document.getElementById("weekdays");
const calendarGrid = document.getElementById("calendarGrid");
const defaultsList = document.getElementById("defaultsList");
const selectedDateLabel = document.getElementById("selectedDateLabel");
const selectedDayEmpty = document.getElementById("selectedDayEmpty");
const dayForm = document.getElementById("dayForm");
const workedToggle = document.getElementById("workedToggle");
const customToggle = document.getElementById("customToggle");
const hourlyRateInput = document.getElementById("hourlyRateInput");
const hoursWorkedInput = document.getElementById("hoursWorkedInput");
const daySummary = document.getElementById("daySummary");
const totalSalary = document.getElementById("totalSalary");
const workedDaysCount = document.getElementById("workedDaysCount");
const summaryDetails = document.getElementById("summaryDetails");

const state = {
  currentMonth: "",
  selectedDate: null,
  defaults: Array.from({ length: 7 }, () => ({
    hourlyRate: 0,
    hoursWorked: 0,
  })),
  entries: {},
};

const moneyFormatter = new Intl.NumberFormat("es-PY", {
  style: "currency",
  currency: "PYG",
  maximumFractionDigits: 0,
});

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthDateRange(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  return {
    firstDay: new Date(year, month - 1, 1),
    lastDay: new Date(year, month, 0),
  };
}

function getEntry(dateKey) {
  return state.entries[dateKey] ?? {
    worked: false,
    custom: false,
    hourlyRate: null,
    hoursWorked: null,
  };
}

function getComputedValues(dateKey) {
  const entry = getEntry(dateKey);
  const weekdayIndex = new Date(dateKey + "T00:00:00").getDay();
  const defaults = state.defaults[weekdayIndex];
  const hourlyRate = entry.custom && entry.hourlyRate !== null ? entry.hourlyRate : defaults.hourlyRate;
  const hoursWorked = entry.custom && entry.hoursWorked !== null ? entry.hoursWorked : defaults.hoursWorked;
  return {
    entry,
    weekdayIndex,
    hourlyRate,
    hoursWorked,
    subtotal: entry.worked ? hourlyRate * hoursWorked : 0,
  };
}

function setDefaultMonth() {
  const now = new Date();
  const monthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  state.currentMonth = monthValue;
  monthInput.value = monthValue;
}

function renderWeekdays() {
  weekdaysEl.innerHTML = "";
  weekdayShort.forEach((label) => {
    const el = document.createElement("span");
    el.textContent = label;
    weekdaysEl.appendChild(el);
  });
}

function renderDefaults() {
  defaultsList.innerHTML = "";

  weekdayNames.forEach((weekday, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "default-card";
    wrapper.innerHTML = `
      <header>
        <strong>${weekday}</strong>
        <span>${moneyFormatter.format(state.defaults[index].hourlyRate)} x ${state.defaults[index].hoursWorked} h</span>
      </header>
      <div class="form-grid">
        <label>
          Sueldo por hora
          <input type="number" min="0" step="0.01" data-weekday="${index}" data-field="hourlyRate" value="${state.defaults[index].hourlyRate}">
        </label>
        <label>
          Horas por defecto
          <input type="number" min="0" step="0.25" data-weekday="${index}" data-field="hoursWorked" value="${state.defaults[index].hoursWorked}">
        </label>
      </div>
    `;

    defaultsList.appendChild(wrapper);
  });
}

function renderCalendar() {
  const { firstDay, lastDay } = getMonthDateRange(state.currentMonth);
  calendarTitle.textContent = formatMonthLabel(firstDay);
  calendarGrid.innerHTML = "";

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    const spacer = document.createElement("div");
    spacer.className = "day-cell muted";
    calendarGrid.appendChild(spacer);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), day);
    const dateKey = formatDateKey(date);
    const { entry, subtotal } = getComputedValues(dateKey);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-cell";
    if (entry.worked) {
      button.classList.add("worked");
    }
    if (entry.custom) {
      button.classList.add("custom");
    }
    if (state.selectedDate === dateKey) {
      button.classList.add("selected");
    }

    button.dataset.date = dateKey;
    button.innerHTML = `
      <div class="day-number">${day}</div>
      <div class="day-pill">${entry.worked ? moneyFormatter.format(subtotal) : "Sin marcar"}</div>
    `;
    calendarGrid.appendChild(button);
  }
}

function renderSelectedDay() {
  if (!state.selectedDate) {
    selectedDateLabel.textContent = "Elige una fecha";
    selectedDayEmpty.classList.remove("hidden");
    dayForm.classList.add("hidden");
    return;
  }

  const date = new Date(state.selectedDate + "T00:00:00");
  const { entry, hourlyRate, hoursWorked, subtotal } = getComputedValues(state.selectedDate);
  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  selectedDateLabel.textContent = formattedDate;
  selectedDayEmpty.classList.add("hidden");
  dayForm.classList.remove("hidden");

  workedToggle.checked = entry.worked;
  customToggle.checked = entry.custom;
  hourlyRateInput.value = entry.custom && entry.hourlyRate !== null ? entry.hourlyRate : hourlyRate;
  hoursWorkedInput.value = entry.custom && entry.hoursWorked !== null ? entry.hoursWorked : hoursWorked;
  hourlyRateInput.disabled = !entry.custom;
  hoursWorkedInput.disabled = !entry.custom;

  const description = entry.worked
    ? `Este día suma ${moneyFormatter.format(subtotal)} (${hourlyRate} por hora x ${hoursWorked} horas).`
    : `Este día no se está contando todavía.`;
  daySummary.textContent = description;
}

function renderSummary() {
  const { firstDay, lastDay } = getMonthDateRange(state.currentMonth);
  let total = 0;
  let daysWorked = 0;
  let customDays = 0;
  let totalHours = 0;

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), day);
    const dateKey = formatDateKey(date);
    const { entry, subtotal, hoursWorked } = getComputedValues(dateKey);

    if (entry.worked) {
      total += subtotal;
      totalHours += hoursWorked;
      daysWorked += 1;
      if (entry.custom) {
        customDays += 1;
      }
    }
  }

  totalSalary.textContent = moneyFormatter.format(total);
  workedDaysCount.textContent = `${daysWorked} día${daysWorked === 1 ? "" : "s"} trabajados`;
  summaryDetails.innerHTML = `
    <div class="summary-row">
      <strong>${totalHours} horas acumuladas</strong>
      Horas sumadas entre todos los días marcados.
    </div>
    <div class="summary-row">
      <strong>${customDays} ajustes manuales</strong>
      Días donde elegiste horas o tarifa específicas para esa fecha.
    </div>
  `;
}

function renderAll() {
  renderDefaults();
  renderCalendar();
  renderSelectedDay();
  renderSummary();
}

function refreshCalculatedViews() {
  renderCalendar();
  renderSelectedDay();
  renderSummary();
}

function ensureEntry(dateKey) {
  if (!state.entries[dateKey]) {
    state.entries[dateKey] = {
      worked: true,
      custom: false,
      hourlyRate: null,
      hoursWorked: null,
    };
  }
  return state.entries[dateKey];
}

defaultsList.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  const weekdayIndex = Number(target.dataset.weekday);
  const field = target.dataset.field;
  if (Number.isNaN(weekdayIndex) || !field) {
    return;
  }

  state.defaults[weekdayIndex][field] = Number(target.value) || 0;
  refreshCalculatedViews();
});

monthInput.addEventListener("input", () => {
  if (!monthInput.value) {
    return;
  }
  state.currentMonth = monthInput.value;
  state.selectedDate = null;
  renderAll();
});

calendarGrid.addEventListener("click", (event) => {
  const target = event.target.closest(".day-cell");
  if (!target || !target.dataset.date) {
    return;
  }

  const dateKey = target.dataset.date;
  const entry = ensureEntry(dateKey);
  entry.worked = !entry.worked;
  state.selectedDate = dateKey;
  renderAll();
});

workedToggle.addEventListener("change", () => {
  if (!state.selectedDate) {
    return;
  }

  const entry = ensureEntry(state.selectedDate);
  entry.worked = workedToggle.checked;
  refreshCalculatedViews();
});

customToggle.addEventListener("change", () => {
  if (!state.selectedDate) {
    return;
  }

  const entry = ensureEntry(state.selectedDate);
  entry.custom = customToggle.checked;
  if (!entry.custom) {
    entry.hourlyRate = null;
    entry.hoursWorked = null;
  } else {
    const { hourlyRate, hoursWorked } = getComputedValues(state.selectedDate);
    entry.hourlyRate = hourlyRate;
    entry.hoursWorked = hoursWorked;
  }
  refreshCalculatedViews();
});

hourlyRateInput.addEventListener("input", () => {
  if (!state.selectedDate) {
    return;
  }

  const entry = ensureEntry(state.selectedDate);
  entry.custom = true;
  customToggle.checked = true;
  entry.hourlyRate = Number(hourlyRateInput.value) || 0;
  refreshCalculatedViews();
});

hoursWorkedInput.addEventListener("input", () => {
  if (!state.selectedDate) {
    return;
  }

  const entry = ensureEntry(state.selectedDate);
  entry.custom = true;
  customToggle.checked = true;
  entry.hoursWorked = Number(hoursWorkedInput.value) || 0;
  refreshCalculatedViews();
});

setDefaultMonth();
renderWeekdays();
renderAll();

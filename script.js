const STORAGE_KEY = "usto-l2-electromecanique-notes";

const semesters = {
  s3: {
    label: "Semestre 3",
    modules: [
      ["UEF 2.1.1", "Mathématiques 3", 6, 3, "40/60"],
      ["UEF 2.1.1", "Ondes et vibrations", 4, 2, "40/60"],
      ["UEF 2.1.2", "Electronique fondamentale 1", 4, 2, "40/60"],
      ["UEF 2.1.2", "Electrotechnique fondamentale 1", 4, 2, "40/60"],
      ["UEM 2.1", "Probabilités et statistiques", 4, 2, "40/60"],
      ["UEM 2.1", "Informatique 3", 2, 1, "100"],
      ["UEM 2.1", "TP d’Electronique et d’électrotechnique", 2, 1, "100"],
      ["UEM 2.1", "TP Ondes et vibrations", 1, 1, "100"],
      ["UED 2.1", "Etat de l'art du Génie électrique", 1, 1, "100"],
      ["UED 2.1", "Energies et Environnement", 1, 1, "100"],
      ["UET 2.1", "Anglais technique", 1, 1, "100"],
    ],
  },
  s4: {
    label: "Semestre 4",
    modules: [
      ["UEF 2.2.1", "Hydraulique et pneumatique", 6, 3, "40/60"],
      ["UEF 2.2.1", "Logique combinatoire et séquentielle", 4, 2, "40/60"],
      ["UEF 2.2.2", "Méthodes numériques", 4, 2, "40/60"],
      ["UEF 2.2.2", "Résistance des matériaux", 4, 2, "40/60"],
      ["UEM 2.2", "TP Mesures électriques et électroniques", 2, 1, "100"],
      ["UEM 2.2", "TP Logique", 1, 1, "100"],
      ["UEM 2.2", "TP Hydraulique et pneumatique", 2, 1, "100"],
      ["UEM 2.2", "TP Méthodes numériques", 2, 1, "100"],
      ["UEM 2.2", "Dessin Technique", 2, 1, "100"],
      ["UED 2.2", "Systèmes de conversion de l'énergie", 1, 1, "100"],
      ["UED 2.2", "Notions de Mesures électriques et électroniques", 1, 1, "100"],
      ["UET 2.2", "Techniques d'expression et de communication", 1, 1, "100"],
    ],
  },
};

const state = {
  active: "s3",
  ignoreMissing: false,
  notes: loadNotes(),
};

const rows = document.querySelector("#module-rows");
const semesterLabel = document.querySelector("#semester-label");
const semesterCredits = document.querySelector("#semester-credits");
const semesterCoefficients = document.querySelector("#semester-coefficients");
const semesterAverage = document.querySelector("#semester-average");
const semesterPoints = document.querySelector("#semester-points");
const semesterHelp = document.querySelector("#semester-help");
const s3Average = document.querySelector("#s3-average");
const s4Average = document.querySelector("#s4-average");
const yearAverage = document.querySelector("#year-average");
const yearCoefficients = document.querySelector("#year-coefficients");
const decision = document.querySelector("#decision");
const decisionDetail = document.querySelector("#decision-detail");

function loadNotes() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
}

function moduleKey(semester, index, field) {
  return `${semester}-${index}-${field}`;
}

function toNumber(value) {
  if (typeof value !== "string") return Number.isFinite(value) ? value : null;
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function fmt(value) {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function clampInput(input) {
  const value = toNumber(input.value);
  const invalid = value !== null && (value < 0 || value > 20);
  input.classList.toggle("invalid", invalid);
  return invalid ? null : value;
}

function getModuleNote(semesterKey, index, mode) {
  const cc = toNumber(state.notes[moduleKey(semesterKey, index, "cc")]);
  const exam = toNumber(state.notes[moduleKey(semesterKey, index, "exam")]);
  if (mode === "100") return cc;
  if (cc === null && exam === null) return null;
  if (cc === null || exam === null) return null;
  return cc * 0.4 + exam * 0.6;
}

function calculateSemester(semesterKey) {
  const semester = semesters[semesterKey];
  let points = 0;
  let coefficients = 0;
  let completed = 0;

  semester.modules.forEach((module, index) => {
    const coefficient = module[3];
    const note = getModuleNote(semesterKey, index, module[4]);
    if (note !== null) completed += 1;
    if (state.ignoreMissing && note === null) return;
    coefficients += coefficient;
    points += (note ?? 0) * coefficient;
  });

  return {
    average: coefficients > 0 ? points / coefficients : 0,
    points,
    coefficients,
    credits: semester.modules.reduce((sum, module) => sum + module[2], 0),
    completed,
    total: semester.modules.length,
  };
}

function renderRows() {
  const semester = semesters[state.active];
  rows.innerHTML = "";

  semester.modules.forEach(([ue, name, credit, coefficient, mode], index) => {
    const tr = document.createElement("tr");
    const ccKey = moduleKey(state.active, index, "cc");
    const examKey = moduleKey(state.active, index, "exam");

    tr.innerHTML = `
      <td data-label="Module">${name}</td>
      <td data-label="Crédit">${credit}</td>
      <td data-label="Coeff.">${coefficient}</td>
      <td data-label="TD / TP"><input inputmode="decimal" type="number" min="0" max="20" step="0.01" data-key="${ccKey}" value="${state.notes[ccKey] ?? ""}" aria-label="TD ou TP ${name}"></td>
      <td data-label="Examen"><input inputmode="decimal" type="number" min="0" max="20" step="0.01" data-key="${examKey}" value="${state.notes[examKey] ?? ""}" ${mode === "100" ? "disabled" : ""} aria-label="Examen ${name}"></td>
      <td data-label="Note retenue" data-retained="${index}">0,00</td>
      <td data-label="Points" data-points="${index}">0,00</td>
    `;
    rows.appendChild(tr);
  });

  rows.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      const value = clampInput(input);
      if (input.value.trim() === "") {
        delete state.notes[input.dataset.key];
      } else if (value !== null) {
        state.notes[input.dataset.key] = input.value;
      }
      saveNotes();
      update();
    });
  });
}

function updateActiveSemesterCells() {
  const semester = semesters[state.active];
  semester.modules.forEach((module, index) => {
    const note = getModuleNote(state.active, index, module[4]);
    const retained = document.querySelector(`[data-retained="${index}"]`);
    const points = document.querySelector(`[data-points="${index}"]`);
    retained.textContent = note === null ? "—" : fmt(note);
    points.textContent = note === null ? "—" : fmt(note * module[3]);
  });
}

function update() {
  updateActiveSemesterCells();

  const activeStats = calculateSemester(state.active);
  semesterLabel.textContent = `Total ${semesters[state.active].label}`;
  semesterCredits.textContent = String(activeStats.credits);
  semesterCoefficients.textContent = String(activeStats.coefficients);
  semesterAverage.textContent = fmt(activeStats.average);
  semesterPoints.textContent = fmt(activeStats.points);
  semesterHelp.textContent = `Saisis TD/TP et Examen du ${semesters[state.active].label}. ${activeStats.completed}/${activeStats.total} modules remplis.`;

  const s3 = calculateSemester("s3");
  const s4 = calculateSemester("s4");
  const totalCoefficients = s3.coefficients + s4.coefficients;
  const annual = totalCoefficients > 0 ? (s3.points + s4.points) / totalCoefficients : 0;

  s3Average.textContent = `${fmt(s3.average)} /20`;
  s4Average.textContent = `${fmt(s4.average)} /20`;
  yearAverage.textContent = fmt(annual);
  yearCoefficients.textContent = String(totalCoefficients);

  const filled = s3.completed + s4.completed;
  const allModules = s3.total + s4.total;
  if (filled === 0) {
    decision.textContent = "À compléter";
    decision.style.color = "var(--amber)";
    decisionDetail.textContent = "Entre les notes pour obtenir une estimation.";
  } else if (annual >= 10) {
    decision.textContent = "ADMIS(E)";
    decision.style.color = "var(--green)";
    decisionDetail.textContent = filled < allModules ? "Estimation favorable avec des notes manquantes." : "Moyenne annuelle supérieure ou égale à 10/20.";
  } else {
    decision.textContent = "NON ADMIS(E)";
    decision.style.color = "var(--red)";
    decisionDetail.textContent = filled < allModules ? "Estimation provisoire avec des notes manquantes." : "Moyenne annuelle inférieure à 10/20.";
  }
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    state.active = tab.dataset.semester;
    document.querySelectorAll(".tab").forEach((item) => {
      const selected = item === tab;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", String(selected));
    });
    renderRows();
    update();
  });
});

document.querySelector("#show-missing").addEventListener("change", (event) => {
  state.ignoreMissing = event.target.checked;
  update();
});

document.querySelector("#reset").addEventListener("click", () => {
  state.notes = {};
  saveNotes();
  renderRows();
  update();
});

renderRows();
update();

(function () {
  "use strict";

  /* ============================================================
     FIREBASE CONFIGURATION
     Paste your config from the Firebase Console here:
  ============================================================ */
  var firebaseConfig = {
    apiKey: "AIzaSyC5gWvr4ExNrNSKNJMrUAdO7XT6HeA6o70",
  authDomain: "project-redemption-5c9bf.firebaseapp.com",
  databaseURL: "https://project-redemption-5c9bf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "project-redemption-5c9bf",
  storageBucket: "project-redemption-5c9bf.firebasestorage.app",
  messagingSenderId: "625257583514",
  appId: "1:625257583514:web:79e368e9144f67222f6023",
  measurementId: "G-5VZQS74XY2"
  };

  firebase.initializeApp(firebaseConfig);
  var db = firebase.database();
  var appRef = db.ref("tracker_data");

  /* ============================================================
     DEFAULTS & HELPERS
  ============================================================ */
  var DEFAULT_EXAMS = [
    { name: "Engineering Services Exam", date: "2027-01-31", locked: true, done: false },
    { name: "Civil Services Prelims", date: "2027-05-23", locked: true, done: false }
  ];

  var state = {
    exams: DEFAULT_EXAMS,
    distractions: [],
    noise: [],
    c1: {},
    opt: {},
    slots:{}
  };

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function slug(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  // Push updates to Firebase
  function syncToCloud() {
    appRef.set(state);
  }

  /* ============================================================
     QUOTES
  ============================================================ */
  var quotes = [
    { t: "The will to prepare is more important than the will to win.", a: "attr. sports coaching wisdom" },
    { t: "Small, honest hours beat rare, heroic ones.", a: "prep-room proverb" },
    { t: "You are not behind. You are exactly as far as your effort has taken you - so far.", a: "" },
    { t: "Discipline is choosing between what you want now and what you want most.", a: "" },
    { t: "A test attempted badly still teaches more than a test avoided.", a: "" },
    { t: "Arise, awake, and stop not till the goal is reached.", a: "Swami Vivekananda" },
    { t: "Dream is not that which you see while sleeping, it is something that does not let you sleep.", a: "A P J Abdul Kalam" },
    { t: "Difficulties mastered are opportunities won.", a: "Winston Churchill" },
    { t: "It always seems impossible until it's done.", a: "Nelson Mandela" },
    { t: "The exam does not test what you know. It tests what you do with what you know, under pressure, on that one day.", a: "" },
    { t: "Consistency is a quieter form of talent.", a: "" },
    { t: "One more sectional test. One more day. That is the whole plan.", a: "" }
  ];
  function dayOfYear(d) {
    var start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  }
  function renderQuote() {
    var idx = dayOfYear(new Date()) % quotes.length;
    var q = quotes[idx];
    document.getElementById("quoteText").textContent = q.t;
    document.getElementById("quoteAuthor").textContent = q.a ? "- " + q.a : "";
  }

  /* ============================================================
     EXAMS
  ============================================================ */
  function daysUntil(dateStr) {
    var target = new Date(dateStr + "T00:00:00");
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((target - now) / 86400000);
  }

  function renderExams() {
    var ul = document.getElementById("examList");
    ul.innerHTML = "";
    (state.exams || []).forEach(function (ex, idx) {
      var d = daysUntil(ex.date);
      var label = d > 0 ? d + " days left" : (d === 0 ? "today" : (-d) + " days ago");
      var li = document.createElement("li");
      li.className = ex.done ? "struck" : "";
      li.innerHTML =
        '<input type="checkbox" class="tick-chk" data-idx="' + idx + '"' + (ex.done ? " checked" : "") + '>' +
        '<span class="exam-name">' + escapeHtml(ex.name) + '</span>' +
        '<span class="exam-date">' + ex.date + '</span>' +
        '<span class="exam-days">' + label + '</span>';
      ul.appendChild(li);
    });
    Array.prototype.forEach.call(ul.querySelectorAll(".tick-chk"), function (el) {
      el.addEventListener("change", function () {
        state.exams[parseInt(el.dataset.idx, 10)].done = el.checked;
        syncToCloud();
      });
    });
  }

  document.getElementById("addExamForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("examName").value.trim();
    var date = document.getElementById("examDate").value;
    if (!name || !date) return;
    if (!state.exams) state.exams = [];
    state.exams.push({ name: name, date: date, locked: false, done: false });
    syncToCloud();
    document.getElementById("examName").value = "";
    document.getElementById("examDate").value = "";
  });

  /* ============================================================
     DISTRACTIONS & NOISE
  ============================================================ */
  function renderSimpleList(type, listElId) {
    var items = state[type] || [];
    var ul = document.getElementById(listElId);
    ul.innerHTML = "";
    items.forEach(function (it, idx) {
      var li = document.createElement("li");
      li.className = it.done ? "struck" : "";
      li.innerHTML =
        '<input type="checkbox" class="tick-chk" data-idx="' + idx + '"' + (it.done ? " checked" : "") + '>' +
        '<span>' + escapeHtml(it.text) + '</span>' +
        '<span class="rm" data-idx="' + idx + '">[remove]</span>';
      ul.appendChild(li);
    });
    Array.prototype.forEach.call(ul.querySelectorAll(".tick-chk"), function (el) {
      el.addEventListener("change", function () {
        state[type][parseInt(el.dataset.idx, 10)].done = el.checked;
        syncToCloud();
      });
    });
    Array.prototype.forEach.call(ul.querySelectorAll(".rm"), function (el) {
      el.addEventListener("click", function () {
        state[type].splice(parseInt(el.dataset.idx, 10), 1);
        syncToCloud();
      });
    });
  }

  document.getElementById("addDistractionForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var input = document.getElementById("distractionInput");
    var val = input.value.trim();
    if (!val) return;
    if (!state.distractions) state.distractions = [];
    state.distractions.push({ text: val, done: false });
    syncToCloud();
    input.value = "";
  });

  document.getElementById("addNoiseForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var input = document.getElementById("noiseInput");
    var val = input.value.trim();
    if (!val) return;
    if (!state.noise) state.noise = [];
    state.noise.push({ text: val, done: false });
    syncToCloud();
    input.value = "";
  });

  /* ============================================================
     TOP-LEVEL TABS
  ============================================================ */
  var topTabs = [
    { id: "gs", label: "GS Mains", sectionId: "gsSection" },
    { id: "opt", label: "Optional (ME)", sectionId: "optSection" }
  ];
  var activeTop = "gs";
  function renderTopTabs() {
    var el = document.getElementById("topTabs");
    el.innerHTML = "";
    topTabs.forEach(function (t) {
      var btn = document.createElement("button");
      btn.className = "top-tab-btn" + (t.id === activeTop ? " active" : "");
      btn.textContent = t.label;
      btn.addEventListener("click", function () {
        activeTop = t.id;
        topTabs.forEach(function (tt) {
          document.getElementById(tt.sectionId).classList.toggle("hidden", tt.id !== activeTop);
        });
        Array.prototype.forEach.call(el.children, function (b, i) {
          b.classList.toggle("active", topTabs[i].id === activeTop);
        });
      });
      el.appendChild(btn);
    });
  }

  /* ============================================================
     GS MAINS - CYCLE 1
  ============================================================ */
  var subjects = {
    1: "Polity", 2: "Polity", 3: "Polity",
    4: "Economy", 5: "Economy",
    6: "Modern History", 7: "Geography", 8: "Art & Culture",
    9: "Governance", 10: "Society & Social Issues",
    11: "International Relations", 12: "Economy", 13: "Agriculture",
    14: "Science & Technology", 15: "Environment", 16: "Security",
    17: "Ethics", 18: "Ethics", 19: "Ethics", 20: "Ethics",
    21: "World History", 22: "Indian Society", 23: "Geography",
    24: "Polity", 25: "Polity (Executive & Legislature)",
    26: "Polity (Const. & Non-Const. Bodies)", 27: "Polity (Governance)",
    28: "Social Justice (Polity)", 29: "Polity (Social Justice)",
    30: "International Relations"
  };

  var priorityOrder = [
    20, 19, 18, 17,
    1, 2, 3, 9, 11, 24, 25, 26, 27, 28, 29, 30,
    4, 5, 12, 13, 14, 15, 16,
    6, 7, 10, 21, 22, 23, 8
  ];

  function ensureC1(day) {
    if (!state.c1) state.c1 = {};
    if (!state.c1[day]) {
      state.c1[day] = { date: "", status: "Not Started", pdf: "", cp: "", remarks: "" };
    }
    return state.c1[day];
  }
  function defaultPdfPath(day, subj) {
    var dd = day < 10 ? "0" + day : "" + day;
    return "pdfs/c1/day" + dd + "-" + slug(subj) + ".pdf";
  }

  function renderC1() {
    var body = document.getElementById("c1Body");
    body.innerHTML = "";
    var done = 0;

    priorityOrder.forEach(function (testNo, i) {
      var day = i + 1;
      var subj = subjects[testNo];
      var row = ensureC1(day);
      if (!row.pdf) row.pdf = defaultPdfPath(day, subj);
      if (row.status === "Done") done++;

      var tr = document.createElement("tr");
      tr.className = row.status === "Done" ? "done" : "";

      tr.appendChild(td(day, "day-num"));
      var testTd = td("Test " + testNo);
      testTd.style.color = "#828282";
      tr.appendChild(testTd);
      tr.appendChild(td(subj, "col-subject"));

      var tdDate = document.createElement("td");
      var inDate = input("date", row.date, "date-input");
      inDate.addEventListener("change", function (e) {
        ensureC1(day).date = e.target.value;
        syncToCloud();
      });
      tdDate.appendChild(inDate);
      tr.appendChild(tdDate);

      var tdStatus = document.createElement("td");
      var sel = statusSelect(row.status, function (val) {
        ensureC1(day).status = val;
        syncToCloud();
      });
      tdStatus.appendChild(sel);
      tr.appendChild(tdStatus);

      var tdPdf = document.createElement("td");
      tdPdf.className = "col-pdf";
      var inPdf = input("text", row.pdf, "pdf-input");
      inPdf.addEventListener("change", function (e) {
        ensureC1(day).pdf = e.target.value;
        syncToCloud();
      });
      tdPdf.appendChild(inPdf);
      tdPdf.appendChild(openLink(row.pdf));
      tr.appendChild(tdPdf);

      var tdCp = document.createElement("td");
      tdCp.className = "col-remarks";
      var inCp = input("text", row.cp, "remark-input");
      inCp.addEventListener("change", function (e) {
        ensureC1(day).cp = e.target.value;
        syncToCloud();
      });
      tdCp.appendChild(inCp);
      tr.appendChild(tdCp);

      var tdRem = document.createElement("td");
      tdRem.className = "col-remarks";
      var inRem = input("text", row.remarks, "remark-input");
      inRem.addEventListener("change", function (e) {
        ensureC1(day).remarks = e.target.value;
        syncToCloud();
      });
      tdRem.appendChild(inRem);
      tr.appendChild(tdRem);

      body.appendChild(tr);
    });

    var pct = Math.round((done / 30) * 100);
    document.getElementById("progressFill").style.width = pct + "%";
    document.getElementById("progressLabel").textContent = done + " / 30 done (" + pct + "%)";
    renderPulse(pct);
  }

  function renderPulse(pct) {
    var msg;
    if (pct === 0) msg = "Every rank holder started at zero. Day 1 counts the same as day 30.";
    else if (pct < 25) msg = "Early days - the goal right now is just showing up daily.";
    else if (pct < 50) msg = "Momentum is building. Keep the cycle unbroken.";
    else if (pct < 90) msg = "Past the halfway mark. This is where consistency pays off.";
    else if (pct < 100) msg = "Almost through the cycle - finish it clean.";
    else msg = "Cycle 1 complete. Plan Cycle 2 while it's fresh.";
    document.getElementById("pulseLine").textContent = "Cycle 1 progress: " + msg;
  }

  /* ============================================================
     OPTIONAL (ME)
  ============================================================ */
  var optPaper1 = [
    { topic: "Mechanics", ref: "Beer & Johnston", approach: "Solve problems", days: 10 },
    { topic: "Engineering Materials", ref: "Callister", approach: "Read & remember", days: 10 },
    { topic: "Theory of Machines", ref: "S S Rattan", approach: "Conceptual", days: 10 },
    { topic: "Manufacturing Science", ref: "P N Rao", approach: "Formulas + solve + intuition", days: 10 },
    { topic: "Manufacturing Management", ref: "confirm reference", approach: "Factual, problems + theory", days: 10 }
  ];
  var optPaper2 = [
    { topic: "Thermodynamics, Gas Dynamics, Turbines", ref: "Cengel", approach: "Solve + concept", days: "" },
    { topic: "Heat Transfer", ref: "Cengel", approach: "Solve + concept", days: "" },
    { topic: "I.C. Engines", ref: "Cengel + confirm extra source", approach: "Fact + solve", days: "" },
    { topic: "Steam Engineering", ref: "Cengel - Fluid Mechanics/Dynamics", approach: "Concept + solve", days: "" },
    { topic: "Refrigeration & Air Conditioning", ref: "Cengel", approach: "Intuition + solve", days: "" }
  ];

  function ensureOpt(paperKey, idx) {
    if (!state.opt) state.opt = {};
    if (!state.opt[paperKey]) state.opt[paperKey] = {};
    if (!state.opt[paperKey][idx]) {
      state.opt[paperKey][idx] = { date: "", status: "Not Started", note: "", remarks: "" };
    }
    return state.opt[paperKey][idx];
  }
  function defaultOptPath(paperKey, idx, topic) {
    return "pdfs/optional/" + paperKey + "/" + (idx + 1) + "-" + slug(topic) + ".pdf";
  }

  function renderOptTable(paperKey, list, bodyId) {
    var body = document.getElementById(bodyId);
    body.innerHTML = "";
    list.forEach(function (item, idx) {
      var row = ensureOpt(paperKey, idx);
      if (!row.note) row.note = defaultOptPath(paperKey, idx, item.topic);

      var tr = document.createElement("tr");
      tr.className = row.status === "Done" ? "done" : "";

      tr.appendChild(td(item.topic, "col-subject"));
      tr.appendChild(td(item.ref, "col-subject"));
      tr.appendChild(td(item.approach));
      tr.appendChild(td(item.days));

      var tdDate = document.createElement("td");
      var inDate = input("date", row.date, "date-input");
      inDate.addEventListener("change", function (e) {
        ensureOpt(paperKey, idx).date = e.target.value;
        syncToCloud();
      });
      tdDate.appendChild(inDate);
      tr.appendChild(tdDate);

      var tdStatus = document.createElement("td");
      var sel = statusSelect(row.status, function (val) {
        ensureOpt(paperKey, idx).status = val;
        syncToCloud();
      });
      tdStatus.appendChild(sel);
      tr.appendChild(tdStatus);

      var tdNote = document.createElement("td");
      tdNote.className = "col-pdf";
      var inNote = input("text", row.note, "pdf-input");
      inNote.addEventListener("change", function (e) {
        ensureOpt(paperKey, idx).note = e.target.value;
        syncToCloud();
      });
      tdNote.appendChild(inNote);
      tdNote.appendChild(openLink(row.note));
      tr.appendChild(tdNote);

      var tdRem = document.createElement("td");
      tdRem.className = "col-remarks";
      var inRem = input("text", row.remarks, "remark-input");
      inRem.addEventListener("change", function (e) {
        ensureOpt(paperKey, idx).remarks = e.target.value;
        syncToCloud();
      });
      tdRem.appendChild(inRem);
      tr.appendChild(tdRem);

      body.appendChild(tr);
    });
  }

  /* ============================================================
     DOM HELPERS
  ============================================================ */
  function td(text, cls) {
    var el = document.createElement("td");
    el.textContent = text;
    if (cls) el.className = cls;
    return el;
  }
  function input(type, val, cls) {
    var el = document.createElement("input");
    el.type = type;
    el.className = cls;
    el.value = val || "";
    return el;
  }
  function statusSelect(current, onChange) {
    var sel = document.createElement("select");
    sel.className = "status-sel";
    ["Not Started", "In Progress", "Done", "Skipped"].forEach(function (opt) {
      var o = document.createElement("option");
      o.value = opt; o.textContent = opt;
      if (opt === current) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function (e) { onChange(e.target.value); });
    return sel;
  }
  function openLink(href) {
    var a = document.createElement("a");
    a.className = "pdf-open";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "open";
    return a;
  }

  /* ============================================================
     MINIMAL CONSISTENCY CALENDAR
  ============================================================ */
  var DAILY_SLOTS = [
    { id: 0, label: "5:30 GS Writing" },
    { id: 1, label: "8:30 AI/ML" },
    { id: 2, label: "2:00 Optional (ME)" },
    { id: 3, label: "6:00 CSAT / DSA" },
    { id: 4, label: "9:30 Project" }
  ];

  var calViewDate = new Date();
  var selectedDateStr = null;

  function toDateKey(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function renderCalendar() {
    var grid = document.getElementById("calGrid");
    if (!grid) return;
    grid.innerHTML = "";

    var year = calViewDate.getFullYear();
    var month = calViewDate.getMonth();
    var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    document.getElementById("calMonthLabel").textContent = monthNames[month] + " " + year;

    // Day headers (Mon - Sun)
    var dayHeaders = ["M", "T", "W", "T", "F", "S", "S"];
    dayHeaders.forEach(function (dh) {
      var h = document.createElement("div");
      h.className = "cal-day-header";
      h.textContent = dh;
      grid.appendChild(h);
    });

    var firstDayIdx = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    var totalDays = new Date(year, month + 1, 0).getDate();
    var todayKey = toDateKey(new Date());

    // Empty lead cells
    for (var e = 0; e < firstDayIdx; e++) {
      var emptyCell = document.createElement("div");
      emptyCell.className = "cal-cell empty";
      grid.appendChild(emptyCell);
    }

    if (!state.slots) state.slots = {};

    for (var d = 1; d <= totalDays; d++) {
      var currentCellDate = new Date(year, month, d);
      var key = toDateKey(currentCellDate);
      var slotData = state.slots[key] || [0, 0, 0, 0, 0];
      var doneCount = slotData.reduce(function (a, b) { return a + (b ? 1 : 0); }, 0);

      var cell = document.createElement("div");
      cell.className = "cal-cell heat-" + doneCount + (key === todayKey ? " today" : "");
      cell.dataset.date = key;

      var numSpan = document.createElement("span");
      numSpan.className = "cal-num";
      numSpan.textContent = d;
      cell.appendChild(numSpan);

      // Micro dots for 5 slots
      var dotsDiv = document.createElement("div");
      dotsDiv.className = "cal-dots";
      for (var s = 0; s < 5; s++) {
        var dot = document.createElement("span");
        dot.className = "cal-dot" + (slotData[s] ? " active" : "");
        dotsDiv.appendChild(dot);
      }
      cell.appendChild(dotsDiv);

      cell.addEventListener("click", function (evt) {
        openSlotLogger(this.dataset.date);
      });

      grid.appendChild(cell);
    }

    calculateStreak();
  }

  function openSlotLogger(dateStr) {
    selectedDateStr = dateStr;
    var logger = document.getElementById("slotLogger");
    var label = document.getElementById("loggerDateLabel");
    var container = document.getElementById("slotPillsContainer");

    logger.classList.remove("hidden");
    label.textContent = "Slots completed on: " + dateStr;
    container.innerHTML = "";

    var slotData = (state.slots && state.slots[dateStr]) ? state.slots[dateStr] : [0, 0, 0, 0, 0];

    DAILY_SLOTS.forEach(function (slot, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-pill" + (slotData[i] ? " done" : "");
      btn.textContent = (slotData[i] ? "✓ " : "+ ") + slot.label;

      btn.addEventListener("click", function () {
        if (!state.slots) state.slots = {};
        if (!state.slots[dateStr]) state.slots[dateStr] = [0, 0, 0, 0, 0];
        state.slots[dateStr][i] = state.slots[dateStr][i] ? 0 : 1;
        syncToCloud();
        openSlotLogger(dateStr);
      });
      container.appendChild(btn);
    });
  }

  function calculateStreak() {
    var streak = 0;
    var checkDate = new Date();
    
    // If today has at least 1 slot logged, start checking from today, else yesterday
    var todayKey = toDateKey(checkDate);
    var todaySlots = (state.slots && state.slots[todayKey]) ? state.slots[todayKey] : [];
    var todayDone = todaySlots.some(function (v) { return v === 1; });

    if (!todayDone) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      var k = toDateKey(checkDate);
      var slots = (state.slots && state.slots[k]) ? state.slots[k] : [];
      var hasDone = slots.some(function (v) { return v === 1; });
      if (hasDone) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    document.getElementById("streakBadge").textContent = "🔥 " + streak + "-day streak";
  }

  // Calendar Navigation Listeners
  document.getElementById("prevMonthBtn").addEventListener("click", function () {
    calViewDate.setMonth(calViewDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById("nextMonthBtn").addEventListener("click", function () {
    calViewDate.setMonth(calViewDate.getMonth() + 1);
    renderCalendar();
  });
  document.getElementById("closeLoggerBtn").addEventListener("click", function () {
    document.getElementById("slotLogger").classList.add("hidden");
  });
  function renderAll() {
    renderQuote();
    renderExams();
    renderSimpleList("distractions", "distractionList");
    renderSimpleList("noise", "noiseList");
    renderTopTabs();
    renderC1();
    renderOptTable("paper1", optPaper1, "optP1Body");
    renderOptTable("paper2", optPaper2, "optP2Body");
    renderCalendar();
  }

  /* ============================================================
     REALTIME SYNC LISTENER & LOCAL STORAGE MIGRATION
  ============================================================ */
  appRef.on("value", function (snapshot) {
    var val = snapshot.val();
    if (val) {
      state = val;
      renderAll();
    } else {
      // First run: migrate existing laptop localStorage into Firebase
      try {
        var oldExams = localStorage.getItem("upsc_tracker_exams_v2");
        var oldC1 = localStorage.getItem("upsc_tracker_c1_v2");
        var oldOpt = localStorage.getItem("upsc_tracker_opt_v2");
        var oldDist = localStorage.getItem("upsc_tracker_distractions_v1");
        var oldNoise = localStorage.getItem("upsc_tracker_noise_v1");

        if (oldExams) state.exams = JSON.parse(oldExams);
        if (oldC1) state.c1 = JSON.parse(oldC1);
        if (oldOpt) state.opt = JSON.parse(oldOpt);
        if (oldDist) state.distractions = JSON.parse(oldDist);
        if (oldNoise) state.noise = JSON.parse(oldNoise);
      } catch (err) {}

      syncToCloud();
      renderAll();
    }
  });

  setInterval(renderExams, 60 * 1000);
})();
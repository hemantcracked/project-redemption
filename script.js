(function () {
  "use strict";

  var EXAM_KEY = "upsc_tracker_exams_v2";
  var C1_KEY = "upsc_tracker_c1_v2";
  var OPT_KEY = "upsc_tracker_opt_v2";
  var DIST_KEY = "upsc_tracker_distractions_v1";
  var NOISE_KEY = "upsc_tracker_noise_v1";

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function slug(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  /* ============================================================
     QUOTES - short, publicly well-known lines, own words / brief
     attributed aphorisms. Rotates once per day.
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
     EXAMS - fixed defaults (ESE, Civil Services) cannot be
     removed. Anything the user adds also cannot be removed -
     only ticked as done (strikethrough).
  ============================================================ */
  var DEFAULT_EXAMS = [
    { name: "Engineering Services Exam", date: "2027-01-31", locked: true, done: false },
    { name: "Civil Services Prelims", date: "2027-05-23", locked: true, done: false }
  ];
  var exams = load(EXAM_KEY, DEFAULT_EXAMS);
  // guard: if an old save is missing the locked defaults, re-add them
  ["Engineering Services Exam", "Civil Services Prelims"].forEach(function (nm, i) {
    if (!exams.some(function (e) { return e.name === DEFAULT_EXAMS[i].name; })) {
      exams.unshift(DEFAULT_EXAMS[i]);
    }
  });

  function daysUntil(dateStr) {
    var target = new Date(dateStr + "T00:00:00");
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((target - now) / 86400000);
  }

  function renderExams() {
    var ul = document.getElementById("examList");
    ul.innerHTML = "";
    exams.forEach(function (ex, idx) {
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
        exams[parseInt(el.dataset.idx, 10)].done = el.checked;
        save(EXAM_KEY, exams);
        renderExams();
      });
    });
  }

  document.getElementById("addExamForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("examName").value.trim();
    var date = document.getElementById("examDate").value;
    if (!name || !date) return;
    exams.push({ name: name, date: date, locked: false, done: false });
    save(EXAM_KEY, exams);
    document.getElementById("examName").value = "";
    document.getElementById("examDate").value = "";
    renderExams();
  });

  /* ============================================================
     DISTRACTIONS & NOISE - freely add / tick / remove
  ============================================================ */
  function makeSimpleList(storageKey, listElId, formId, inputId) {
    var items = load(storageKey, []);
    var ul = document.getElementById(listElId);

    function render() {
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
          items[parseInt(el.dataset.idx, 10)].done = el.checked;
          save(storageKey, items);
          render();
        });
      });
      Array.prototype.forEach.call(ul.querySelectorAll(".rm"), function (el) {
        el.addEventListener("click", function () {
          items.splice(parseInt(el.dataset.idx, 10), 1);
          save(storageKey, items);
          render();
        });
      });
    }

    document.getElementById(formId).addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById(inputId);
      var val = input.value.trim();
      if (!val) return;
      items.push({ text: val, done: false });
      save(storageKey, items);
      input.value = "";
      render();
    });

    render();
  }

  /* ============================================================
     TOP-LEVEL TABS: GS Mains / Optional
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
     GS MAINS - Cycle 1 sectional tests
  ============================================================ */
  var subjects = {
    1: "Polity", 2: "Polity", 3: "Polity",
    4: "Economy", 5: "Economy",
    6: "Modern History",
    7: "Geography",
    8: "Art & Culture",
    9: "Governance",
    10: "Society & Social Issues",
    11: "International Relations",
    12: "Economy",
    13: "Agriculture",
    14: "Science & Technology",
    15: "Environment",
    16: "Security",
    17: "Ethics", 18: "Ethics", 19: "Ethics", 20: "Ethics",
    21: "World History",
    22: "Indian Society",
    23: "Geography",
    24: "Polity",
    25: "Polity (Executive & Legislature)",
    26: "Polity (Const. & Non-Const. Bodies)",
    27: "Polity (Governance)",
    28: "Social Justice (Polity)",
    29: "Polity (Social Justice)",
    30: "International Relations"
  };
  var priorityOrder = [
    20, 19, 18, 17,           // Ethics
    1,2,3,9,11,24,25,26,27,28,29,30,
    4,5,12,13,14,15,16  // Security -> IR
    6,7,10,21,22,23,8   // Society -> Economy           // Geography, Indian Society, World History
  ];

  var c1data = load(C1_KEY, {});
  function ensureC1(day) {
    if (!c1data[day]) {
      c1data[day] = { date: "", status: "Not Started", pdf: "", cp: "", remarks: "" };
    }
    return c1data[day];
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
      inDate.addEventListener("change", function (e) { ensureC1(day).date = e.target.value; save(C1_KEY, c1data); });
      tdDate.appendChild(inDate);
      tr.appendChild(tdDate);

      var tdStatus = document.createElement("td");
      var sel = statusSelect(row.status, function (val) {
        ensureC1(day).status = val; save(C1_KEY, c1data); renderC1();
      });
      tdStatus.appendChild(sel);
      tr.appendChild(tdStatus);

      var tdPdf = document.createElement("td");
      tdPdf.className = "col-pdf";
      var inPdf = input("text", row.pdf, "pdf-input");
      inPdf.addEventListener("change", function (e) { ensureC1(day).pdf = e.target.value; save(C1_KEY, c1data); });
      tdPdf.appendChild(inPdf);
      tdPdf.appendChild(openLink(row.pdf));
      tr.appendChild(tdPdf);

      var tdCp = document.createElement("td");
      tdCp.className = "col-remarks";
      var inCp = input("text", row.cp, "remark-input");
      inCp.addEventListener("change", function (e) { ensureC1(day).cp = e.target.value; save(C1_KEY, c1data); });
      tdCp.appendChild(inCp);
      tr.appendChild(tdCp);

      var tdRem = document.createElement("td");
      tdRem.className = "col-remarks";
      var inRem = input("text", row.remarks, "remark-input");
      inRem.addEventListener("change", function (e) { ensureC1(day).remarks = e.target.value; save(C1_KEY, c1data); });
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
     OPTIONAL - Mechanical Engineering
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

  var optData = load(OPT_KEY, {});
  function ensureOpt(paperKey, idx) {
    if (!optData[paperKey]) optData[paperKey] = {};
    if (!optData[paperKey][idx]) {
      optData[paperKey][idx] = { date: "", status: "Not Started", note: "", remarks: "" };
    }
    return optData[paperKey][idx];
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
      inDate.addEventListener("change", function (e) { ensureOpt(paperKey, idx).date = e.target.value; save(OPT_KEY, optData); });
      tdDate.appendChild(inDate);
      tr.appendChild(tdDate);

      var tdStatus = document.createElement("td");
      var sel = statusSelect(row.status, function (val) {
        ensureOpt(paperKey, idx).status = val; save(OPT_KEY, optData); renderOptTable(paperKey, list, bodyId);
      });
      tdStatus.appendChild(sel);
      tr.appendChild(tdStatus);

      var tdNote = document.createElement("td");
      tdNote.className = "col-pdf";
      var inNote = input("text", row.note, "pdf-input");
      inNote.addEventListener("change", function (e) { ensureOpt(paperKey, idx).note = e.target.value; save(OPT_KEY, optData); });
      tdNote.appendChild(inNote);
      tdNote.appendChild(openLink(row.note));
      tr.appendChild(tdNote);

      var tdRem = document.createElement("td");
      tdRem.className = "col-remarks";
      var inRem = input("text", row.remarks, "remark-input");
      inRem.addEventListener("change", function (e) { ensureOpt(paperKey, idx).remarks = e.target.value; save(OPT_KEY, optData); });
      tdRem.appendChild(inRem);
      tr.appendChild(tdRem);

      body.appendChild(tr);
    });
  }

  /* ============================================================
     small DOM helpers
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
     init
  ============================================================ */
  renderQuote();
  renderExams();
  makeSimpleList(DIST_KEY, "distractionList", "addDistractionForm", "distractionInput");
  makeSimpleList(NOISE_KEY, "noiseList", "addNoiseForm", "noiseInput");
  renderTopTabs();
  renderC1();
  renderOptTable("paper1", optPaper1, "optP1Body");
  renderOptTable("paper2", optPaper2, "optP2Body");

  setInterval(renderExams, 60 * 1000);
})();

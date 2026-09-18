(function () {
  "use strict";

  var EXAM_KEY = "upsc_tracker_exams_v1";
  var DATA_KEY = "upsc_tracker_progress_v1";

  /* ---------------- Subjects (from source notes, test 1-30) ---------------- */
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
    29: "TBD - confirm topic",
    30: "International Relations"
  };

  /* Priority order: start at Ethics (test 20 -> 17), work upward to test 1
     ("all the way to the top" of the original list), then wrap through the
     remaining tests 30 -> 21 to complete all 30 sectional tests once. */
  var priorityOrder = [
    20, 19, 18, 17,           // Ethics
    16, 15, 14, 13, 12, 11,   // Security -> IR
    10, 9, 8, 7, 6, 5, 4,     // Society -> Economy
    3, 2, 1,                  // Polity (top of the list)
    30, 29, 28, 27, 26, 25, 24, // wrap: IR -> Polity
    23, 22, 21                 // Geography, Indian Society, World History
  ];

  function slug(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  var cycles = [
    { id: "c1", label: "Cycle 1", title: "Sectional Tests - Pass 1 (ForumIAS + Peeyush Kumar)" },
    { id: "c2", label: "Cycle 2", title: "Sectional Tests - Pass 2 (Retest + Evaluation)" },
    { id: "c3", label: "Cycle 3", title: "Sectional Tests - Pass 3 (PYQ + Model Answers)" }
  ];

  var activeCycle = "c1";

  /* ---------------- storage ---------------- */
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  var progress = load(DATA_KEY, {});
  function ensureRow(cid, day) {
    if (!progress[cid]) progress[cid] = {};
    if (!progress[cid][day]) {
      progress[cid][day] = { status: "Not Started", pdf: "", remarks: "" };
    }
    return progress[cid][day];
  }

  var DEFAULT_EXAMS = [
    { name: "Engineering Services Exam", date: "2027-01-31" },
    { name: "Civil Services Prelims", date: "2027-05-23" }
  ];
  var exams = load(EXAM_KEY, DEFAULT_EXAMS);

  /* ---------------- countdown ---------------- */
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
      var li = document.createElement("li");
      var label = d > 0 ? d + " days left" : (d === 0 ? "today" : (-d) + " days ago");
      li.innerHTML =
        '<span><span class="exam-name">' + escapeHtml(ex.name) + '</span>' +
        '<span class="exam-date"> - ' + ex.date + '</span></span>' +
        '<span><span class="exam-days">' + label + '</span>' +
        '<span class="rm" data-idx="' + idx + '">[remove]</span></span>';
      ul.appendChild(li);
    });
    Array.prototype.forEach.call(ul.querySelectorAll(".rm"), function (el) {
      el.addEventListener("click", function () {
        exams.splice(parseInt(el.dataset.idx, 10), 1);
        save(EXAM_KEY, exams);
        renderExams();
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  document.getElementById("addExamForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("examName").value.trim();
    var date = document.getElementById("examDate").value;
    if (!name || !date) return;
    exams.push({ name: name, date: date });
    save(EXAM_KEY, exams);
    document.getElementById("examName").value = "";
    document.getElementById("examDate").value = "";
    renderExams();
  });

  /* ---------------- tabs ---------------- */
  var tabsEl = document.getElementById("cycleTabs");
  cycles.forEach(function (c) {
    var btn = document.createElement("button");
    btn.className = "tab-btn" + (c.id === activeCycle ? " active" : "");
    btn.textContent = c.label;
    btn.dataset.cid = c.id;
    btn.addEventListener("click", function () {
      activeCycle = c.id;
      Array.prototype.forEach.call(tabsEl.children, function (b) {
        b.classList.toggle("active", b.dataset.cid === activeCycle);
      });
      renderTable();
    });
    tabsEl.appendChild(btn);
  });

  /* ---------------- table ---------------- */
  function defaultPdfPath(cid, day, subj) {
    var dd = day < 10 ? "0" + day : "" + day;
    return "pdfs/" + cid + "/day" + dd + "-" + slug(subj) + ".pdf";
  }

  function renderTable() {
    var cycle = cycles.filter(function (c) { return c.id === activeCycle; })[0];
    document.getElementById("cycleTitle").textContent = cycle.title;

    var body = document.getElementById("tblBody");
    body.innerHTML = "";
    var done = 0;

    priorityOrder.forEach(function (testNo, i) {
      var day = i + 1;
      var subj = subjects[testNo];
      var row = ensureRow(activeCycle, day);
      if (!row.pdf) row.pdf = defaultPdfPath(activeCycle, day, subj);
      if (row.status === "Done") done++;

      var tr = document.createElement("tr");
      tr.className = row.status === "Done" ? "done" : "";

      var tdDay = document.createElement("td");
      tdDay.className = "day-num";
      tdDay.textContent = day;
      tr.appendChild(tdDay);

      var tdTest = document.createElement("td");
      tdTest.textContent = "Test " + testNo;
      tdTest.style.color = "#828282";
      tr.appendChild(tdTest);

      var tdSubj = document.createElement("td");
      tdSubj.textContent = subj;
      tr.appendChild(tdSubj);

      var tdStatus = document.createElement("td");
      var sel = document.createElement("select");
      sel.className = "status-sel";
      ["Not Started", "In Progress", "Done", "Skipped"].forEach(function (opt) {
        var o = document.createElement("option");
        o.value = opt; o.textContent = opt;
        if (opt === row.status) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener("change", function (e) {
        ensureRow(activeCycle, day).status = e.target.value;
        save(DATA_KEY, progress);
        renderTable();
      });
      tdStatus.appendChild(sel);
      tr.appendChild(tdStatus);

      var tdPdf = document.createElement("td");
      var inPdf = document.createElement("input");
      inPdf.type = "text";
      inPdf.className = "pdf-input";
      inPdf.value = row.pdf;
      inPdf.title = "Relative path to the PDF in this repo, e.g. pdfs/c1/day01-ethics.pdf";
      inPdf.addEventListener("change", function (e) {
        ensureRow(activeCycle, day).pdf = e.target.value;
        save(DATA_KEY, progress);
      });
      tdPdf.appendChild(inPdf);
      var openA = document.createElement("a");
      openA.className = "pdf-open";
      openA.href = row.pdf;
      openA.target = "_blank";
      openA.rel = "noopener noreferrer";
      openA.textContent = "open";
      tdPdf.appendChild(openA);
      tr.appendChild(tdPdf);

      var tdRem = document.createElement("td");
      var inRem = document.createElement("input");
      inRem.type = "text";
      inRem.className = "remark-input";
      inRem.value = row.remarks;
      inRem.addEventListener("change", function (e) {
        ensureRow(activeCycle, day).remarks = e.target.value;
        save(DATA_KEY, progress);
      });
      tdRem.appendChild(inRem);
      tr.appendChild(tdRem);

      body.appendChild(tr);
    });

    var pct = Math.round((done / 30) * 100);
    document.getElementById("progressFill").style.width = pct + "%";
    document.getElementById("progressLabel").textContent = done + " / 30 done (" + pct + "%)";
  }

  renderExams();
  renderTable();

  /* refresh the "days left" counters at local midnight without a reload */
  setInterval(renderExams, 60 * 1000);
})();

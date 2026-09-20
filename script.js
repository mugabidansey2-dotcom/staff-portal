(function () {
  "use strict";

  var STORAGE_KEY = "staffPortal.employees.v1";

  function loadEmployees() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Could not read employee data:", e);
      return [];
    }
  }

  function saveEmployees(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error("Could not save employee data:", e);
      return false;
    }
  }

  var employees = loadEmployees();

  // ---------- Tabs ----------
  var tabButtons = document.querySelectorAll("nav.tabs button");
  var panels = document.querySelectorAll(".panel");
  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabButtons.forEach(function (b) { b.classList.remove("active"); });
      panels.forEach(function (p) { p.classList.remove("active"); });
      btn.classList.add("active");
      document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
      if (btn.dataset.tab === "search") renderResults();
    });
  });

  function updateStat() {
    document.getElementById("statCount").textContent = employees.length;
  }
  updateStat();

  // ---------- Registration ----------
  var regForm = document.getElementById("regForm");
  var regBanner = document.getElementById("regBanner");

  function showBanner(el, type, msg) {
    el.textContent = msg;
    el.className = "banner show " + type;
  }
  function clearFieldErrors(form) {
    form.querySelectorAll(".error-text").forEach(function (e) { e.textContent = ""; });
  }
  function setFieldError(name, msg) {
    var el = regForm.querySelector('[data-error-for="' + name + '"]');
    if (el) el.textContent = msg;
  }

  regForm.addEventListener("submit", function (ev) {
    ev.preventDefault();
    clearFieldErrors(regForm);
    regBanner.className = "banner";

    var data = {
      id: regForm.regId.value.trim(),
      name: regForm.regName.value.trim(),
      email: regForm.regEmail.value.trim(),
      phone: regForm.regPhone.value.trim(),
      department: regForm.regDept.value,
      position: regForm.regPosition.value.trim(),
      joinDate: regForm.regJoin.value,
      salary: regForm.regSalary.value,
      bank: regForm.regBank.value.trim(),
      username: regForm.regUsername.value.trim(),
      password: regForm.regPassword.value
    };

    var valid = true;
    function fail(field, msg) { setFieldError(field, msg); valid = false; }

    if (!data.id) fail("regId", "Employee ID is required.");
    else if (employees.some(function (e) { return e.id.toLowerCase() === data.id.toLowerCase(); }))
      fail("regId", "This employee ID is already registered.");

    if (!data.name) fail("regName", "Full name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) fail("regEmail", "Enter a valid email address.");
    if (!data.phone) fail("regPhone", "Phone number is required.");
    if (!data.department) fail("regDept", "Select a department.");
    if (!data.position) fail("regPosition", "Position is required.");
    if (!data.joinDate) fail("regJoin", "Date of joining is required.");
    if (!data.salary || Number(data.salary) <= 0) fail("regSalary", "Enter a valid salary amount.");
    if (!data.bank) fail("regBank", "Bank account number is required.");
    if (!data.username) fail("regUsername", "Username is required.");
    else if (employees.some(function (e) { return e.username.toLowerCase() === data.username.toLowerCase(); }))
      fail("regUsername", "This username is taken.");
    if (!data.password || data.password.length < 6) fail("regPassword", "Password needs at least 6 characters.");

    if (!valid) {
      showBanner(regBanner, "bad", "Please fix the highlighted fields before submitting.");
      return;
    }

    employees.push(data);
    var saved = saveEmployees(employees);
    updateStat();
    regForm.reset();
    showBanner(regBanner, "ok", saved
      ? "Employee \"" + data.name + "\" was registered successfully."
      : "Employee registered for this session, but it could not be saved to storage.");
  });

  // ---------- Login ----------
  var loginForm = document.getElementById("loginForm");
  var loginBanner = document.getElementById("loginBanner");
  var welcomeCard = document.getElementById("welcomeCard");
  var togglePw = document.getElementById("togglePw");
  var loginPass = document.getElementById("loginPass");

  togglePw.addEventListener("click", function () {
    var isPw = loginPass.type === "password";
    loginPass.type = isPw ? "text" : "password";
    togglePw.textContent = isPw ? "Hide" : "Show";
  });

  loginForm.addEventListener("submit", function (ev) {
    ev.preventDefault();
    loginBanner.className = "banner";
    welcomeCard.classList.remove("show");

    var user = loginForm.loginUser.value.trim();
    var pass = loginForm.loginPass.value;

    var match = employees.find(function (e) {
      return e.username.toLowerCase() === user.toLowerCase() && e.password === pass;
    });

    if (!match) {
      showBanner(loginBanner, "bad", "Incorrect username or password. Register an employee first if you haven't.");
      return;
    }

    document.getElementById("welcomeName").textContent = "Welcome, " + match.name;
    document.getElementById("welcomeMeta").textContent = match.position + " · Employee ID " + match.id;
    document.getElementById("welcomeDept").textContent = match.department;
    welcomeCard.classList.add("show");
    showBanner(loginBanner, "ok", "Signed in successfully.");
  });

  // ---------- Search ----------
  var searchInput = document.getElementById("searchInput");
  var searchDept = document.getElementById("searchDept");
  var resultsBody = document.getElementById("resultsBody");
  var emptyState = document.getElementById("emptyState");

  function renderResults() {
    var q = searchInput.value.trim().toLowerCase();
    var dept = searchDept.value;

    var filtered = employees.filter(function (e) {
      var matchesQuery = !q ||
        e.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q);
      var matchesDept = !dept || e.department === dept;
      return matchesQuery && matchesDept;
    });

    resultsBody.innerHTML = "";
    if (filtered.length === 0) {
      emptyState.style.display = "block";
      emptyState.querySelector("div:last-child").textContent = employees.length === 0
        ? "No employees registered yet — add one from the Register panel."
        : "No employees match your search.";
    } else {
      emptyState.style.display = "none";
      filtered.forEach(function (e) {
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" + escapeHtml(e.id) + "</td>" +
          "<td>" + escapeHtml(e.name) + "</td>" +
          "<td><span class='pill'>" + escapeHtml(e.department) + "</span></td>" +
          "<td>" + escapeHtml(e.position) + "</td>" +
          "<td>" + escapeHtml(e.joinDate || "—") + "</td>";
        resultsBody.appendChild(tr);
      });
    }
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  searchInput.addEventListener("input", renderResults);
  searchDept.addEventListener("change", renderResults);

  renderResults();
})();
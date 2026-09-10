/* =========================================================
   JOBTRAK — Application Logic
   Local-first. No backend, no network calls, no build step.
   ========================================================= */
(function () {
  "use strict";

  var D = window.JOBTRAK_DATA;

  /* ================= STORE ================= */
  var DB = null;

  function loadDB() {
    var raw = null;
    try { raw = localStorage.getItem(D.STORAGE_KEY); } catch (e) { raw = null; }
    if (!raw && D.LEGACY_STORAGE_KEY) {
      try { raw = localStorage.getItem(D.LEGACY_STORAGE_KEY); } catch (e) { raw = null; }
      if (raw) {
        try { localStorage.setItem(D.STORAGE_KEY, raw); } catch (e) { console.warn("JOBTRAK: could not migrate localStorage key", e); }
      }
    }
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { /* fall through to seed */ }
    }
    var seed = D.buildSeedData();
    saveDBRaw(seed);
    return seed;
  }
  function saveDBRaw(db) {
    try { localStorage.setItem(D.STORAGE_KEY, JSON.stringify(db)); } catch (e) { console.warn("JOBTRAK: could not persist to localStorage", e); }
  }
  function saveDB() { saveDBRaw(DB); }

  /* ================= UTILS ================= */
  function uid(p) { return D.uid(p); }
  function todayISO() { return D.isoDaysFromNow(0); }
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function fmtDate(iso) {
    if (!iso) return "—";
    var parts = iso.split("-");
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  function fmtDateShort(iso) {
    if (!iso) return "—";
    var parts = iso.split("-");
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  function daysDiff(iso) {
    if (!iso) return null;
    var parts = iso.split("-");
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setHours(0, 0, 0, 0);
    var t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((d - t) / 86400000);
  }
  function dueLabel(iso) {
    var n = daysDiff(iso);
    if (n === null) return { text: "—", cls: "" };
    if (n < 0) return { text: (n === -1 ? "1 day overdue" : (-n) + " days overdue"), cls: "overdue" };
    if (n === 0) return { text: "Due today", cls: "today" };
    if (n === 1) return { text: "Due tomorrow", cls: "" };
    return { text: "Due in " + n + " days", cls: "" };
  }
  function relTime(iso) {
    var n = daysDiff(iso);
    if (n === null) return "—";
    if (n === 0) return "today";
    if (n === -1) return "yesterday";
    if (n < 0) return (-n) + "d ago";
    if (n === 1) return "tomorrow";
    return "in " + n + "d";
  }
  function toast(msg) {
    var stack = document.getElementById("toast-stack");
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    stack.appendChild(el);
    setTimeout(function () {
      el.style.transition = "opacity .25s ease";
      el.style.opacity = "0";
      setTimeout(function () { el.remove(); }, 260);
    }, 2400);
  }
  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function computeScore(scores) {
    if (!scores) return null;
    var keys = D.EVAL_DIMENSIONS.map(function (d) { return d.key; });
    var sum = 0, n = 0;
    keys.forEach(function (k) {
      if (typeof scores[k] === "number" && scores[k] > 0) { sum += scores[k]; n++; }
    });
    if (n === 0) return null;
    return Math.round((sum / n) * 10) / 10;
  }

  /* ================= LOOKUPS ================= */
  function getCompany(id) { return DB.companies.find(function (c) { return c.id === id; }); }
  function getContact(id) { return DB.contacts.find(function (c) { return c.id === id; }); }
  function getOpportunity(id) { return DB.opportunities.find(function (o) { return o.id === id; }); }
  function companyName(id) { var c = getCompany(id); return c ? c.name : "—"; }
  function contactName(id) { var c = getContact(id); return c ? c.name : "—"; }
  function oppsForCompany(id) { return DB.opportunities.filter(function (o) { return o.companyId === id; }); }
  function oppsForContact(id) { return DB.opportunities.filter(function (o) { return o.contactId === id; }); }
  function contactsForCompany(id) { return DB.contacts.filter(function (c) { return c.companyId === id; }); }
  function activitiesFor(oppId) { return DB.activities.filter(function (a) { return a.opportunityId === oppId; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }); }
  function lastActivityDate(oppId) {
    var acts = activitiesFor(oppId);
    return acts.length ? acts[0].date : null;
  }

  /* ================= STATUS / PRIORITY HELPERS ================= */
  function statusVar(status) {
    var map = {
      "Researching": "--st-researching", "Interested": "--st-interested", "Contacted": "--st-contacted",
      "Applied": "--st-applied", "Conversation": "--st-conversation", "Interview": "--st-interview",
      "Negotiating": "--st-negotiating", "Offer": "--st-offer", "Accepted": "--st-accepted",
      "Rejected": "--st-rejected", "Withdrawn": "--st-withdrawn", "On Hold": "--st-onhold", "Archived": "--st-archived"
    };
    return "var(" + (map[status] || "--muted") + ")";
  }
  function priorityVar(p) {
    var map = { "High": "--priority-high", "Medium": "--priority-medium", "Low": "--priority-low" };
    return "var(" + (map[p] || "--muted") + ")";
  }
  function statusTag(status) {
    return '<span class="status-tag"><span class="status-dot" style="background:' + statusVar(status) + '"></span>' + escapeHtml(status) + "</span>";
  }
  function priorityTag(p) {
    if (!p) return "—";
    return '<span class="priority-tag" style="color:' + priorityVar(p) + '"><span class="priority-dot" style="background:' + priorityVar(p) + '"></span>' + escapeHtml(p) + "</span>";
  }

  /* ================= APPLICATION STATE ================= */
  var state = {
    view: "dashboard",
    oppView: "list", // list | kanban
    search: "",
    filters: { status: [], type: [], category: [], source: [], priority: [] },
    savedView: null,
    drawerTab: "basic",
    companyFilter: "",
    contactFilter: "",
    taskFilter: "open" // open | all | done
  };

  /* ================= FILTERING ================= */
  function matchesSearch(text, q) {
    return text && text.toLowerCase().indexOf(q) !== -1;
  }
  function opportunityMatchesSearch(o, q) {
    if (!q) return true;
    q = q.toLowerCase();
    var hay = [o.title, companyName(o.companyId), o.notes, o.appNotes, o.location, o.source, o.applicationStatus]
      .filter(Boolean).join(" ").toLowerCase();
    return hay.indexOf(q) !== -1;
  }
  function getFilteredOpportunities() {
    var f = state.filters, q = state.search.trim().toLowerCase();
    return DB.opportunities.filter(function (o) {
      if (f.status.length && f.status.indexOf(o.status) === -1) return false;
      if (f.type.length && !f.type.some(function (t) { return (o.types || []).indexOf(t) !== -1; })) return false;
      if (f.category.length && !f.category.some(function (c) { return (o.categories || []).indexOf(c) !== -1; })) return false;
      if (f.source.length && f.source.indexOf(o.source) === -1) return false;
      if (f.priority.length && f.priority.indexOf(o.priority) === -1) return false;
      if (q && !opportunityMatchesSearch(o, q)) return false;
      return true;
    });
  }
  function clearFilters() {
    state.filters = { status: [], type: [], category: [], source: [], priority: [] };
    state.savedView = null;
  }
  function applySavedView(name) {
    clearFilters();
    state.savedView = name;
    if (name === "active") state.filters.status = D.STATUSES.slice();
    else if (name === "followup") { /* handled specially below */ }
    else if (name === "consulting") state.filters.type = ["Consulting", "Freelance", "Fractional", "Direct Client"];
    else if (name === "microsoft") state.filters.source = ["Microsoft Ecosystem"];
    else if (name === "impact") state.filters.source = ["B Corp", "Climatebase", "Tech Jobs for Good", "Idealist"];
    else if (name === "startups") { /* handled specially below via company type */ }
    else if (name === "applied") state.filters.status = ["Applied", "Conversation", "Interview", "Negotiating", "Offer", "Accepted"];
    else if (name === "highpriority") state.filters.priority = ["High"];
    renderView();
  }
  function opportunityPassesSavedView(o, name) {
    if (name === "followup") return !!o.nextFollowUp;
    if (name === "startups") { var c = getCompany(o.companyId); return c && c.type === "Startup"; }
    return true;
  }

  /* ================= NEEDS ATTENTION ================= */
  function getAttentionItems() {
    var items = [];
    DB.opportunities.forEach(function (o) {
      if (isClosed(o.status)) return;
      var n = daysDiff(o.nextFollowUp);
      if (o.nextFollowUp && n < 0) items.push({ kind: "urgent", opp: o, text: "Follow-up overdue: " + o.title, meta: companyName(o.companyId) + " · " + (-n) + "d overdue" });
      else if (o.nextFollowUp && n === 0) items.push({ kind: "warn", opp: o, text: "Follow-up due today: " + o.title, meta: companyName(o.companyId) });
      if (o.status === "Applied") {
        var last = lastActivityDate(o.id);
        var ldays = last ? -daysDiff(last) : null;
        if (ldays !== null && ldays >= 7) items.push({ kind: "warn", opp: o, text: "Applied with no follow-up: " + o.title, meta: companyName(o.companyId) + " · applied " + ldays + "d ago" });
      }
      if (o.status === "Interview") {
        var fn = daysDiff(o.nextFollowUp);
        if (o.nextFollowUp && fn >= 0 && fn <= 4) items.push({ kind: "info", opp: o, text: "Upcoming interview: " + o.title, meta: companyName(o.companyId) + " · " + dueLabel(o.nextFollowUp).text });
      }
      var last2 = lastActivityDate(o.id) || o.dateAdded;
      var idleDays = last2 ? -daysDiff(last2) : 0;
      if (idleDays >= 14 && ["Researching", "Interested", "Contacted", "Conversation", "Negotiating"].indexOf(o.status) !== -1) {
        items.push({ kind: "warn", opp: o, text: "No activity in " + idleDays + " days: " + o.title, meta: companyName(o.companyId) });
      }
    });
    DB.contacts.forEach(function (c) {
      var n = daysDiff(c.nextFollowUp);
      if (c.nextFollowUp && n < 0) items.push({ kind: "info", contact: c, text: "Reconnect with " + c.name, meta: (c.companyId ? companyName(c.companyId) + " · " : "") + (-n) + "d overdue" });
    });
    // sort: urgent first
    var order = { urgent: 0, warn: 1, info: 2 };
    items.sort(function (a, b) { return order[a.kind] - order[b.kind]; });
    return items;
  }
  function isClosed(status) { return ["Rejected", "Withdrawn", "Archived", "Accepted"].indexOf(status) !== -1; }

  /* ================= RENDER: SHELL ================= */
  function setView(view) {
    state.view = view;
    document.querySelectorAll(".nav-item, .mnav-item").forEach(function (el) {
      el.classList.toggle("is-active", el.getAttribute("data-view") === view);
    });
    renderView();
    window.scrollTo(0, 0);
  }

  function renderView() {
    var main = document.getElementById("main");
    if (state.view === "dashboard") main.innerHTML = renderDashboard();
    else if (state.view === "opportunities") main.innerHTML = renderOpportunitiesView();
    else if (state.view === "companies") main.innerHTML = renderCompaniesView();
    else if (state.view === "contacts") main.innerHTML = renderContactsView();
    else if (state.view === "tasks") main.innerHTML = renderTasksView();
    else if (state.view === "settings") main.innerHTML = renderSettingsView();
    updateTasksBadge();
    if (state.view === "opportunities" && state.oppView === "kanban") wireKanbanDnd();
  }

  function updateTasksBadge() {
    var openTasks = DB.tasks.filter(function (t) { return !t.completed && daysDiff(t.dueDate) !== null && daysDiff(t.dueDate) <= 0; });
    var badge = document.getElementById("tasks-nav-badge");
    if (openTasks.length > 0) { badge.hidden = false; badge.textContent = openTasks.length; }
    else { badge.hidden = true; }
  }

  /* ================= DASHBOARD ================= */
  function renderDashboard() {
    var opps = DB.opportunities;
    if (opps.length === 0) return renderEmptyDashboard();

    var active = opps.filter(function (o) { return !isClosed(o.status) && o.status !== "Rejected"; }).length;
    var applied = opps.filter(function (o) { return D.STATUS_ORDER[o.status] >= D.STATUS_ORDER["Applied"] && D.STATUS_ORDER[o.status] < D.STATUS_ORDER["Rejected"]; }).length;
    var followUpsDue = opps.filter(function (o) { var n = daysDiff(o.nextFollowUp); return o.nextFollowUp && n <= 0 && !isClosed(o.status); }).length;
    var conversations = opps.filter(function (o) { return ["Conversation", "Interview"].indexOf(o.status) !== -1; }).length;
    var offers = opps.filter(function (o) { return o.status === "Offer"; }).length;
    var closed = opps.filter(function (o) { return ["Rejected", "Withdrawn", "Archived"].indexOf(o.status) !== -1; }).length;
    var consultingProspects = opps.filter(function (o) { return (o.types || []).some(function (t) { return ["Consulting", "Fractional", "Direct Client"].indexOf(t) !== -1; }); }).length;

    var metrics = [
      ["Active", active, "active"], ["Applied", applied, "applied"], ["Follow-ups due", followUpsDue, "followup"],
      ["Conversations", conversations, "conversation"], ["Offers", offers, "offer"], ["Closed", closed, "closed"],
      ["Consulting", consultingProspects, "consulting"]
    ];

    var attn = getAttentionItems().slice(0, 8);
    var attnHtml = attn.length ? attn.map(function (a) {
      var id = a.opp ? a.opp.id : "";
      var kind = a.contact ? "contact:" + a.contact.id : "opp:" + id;
      return '<div class="attn-item" data-action="attn-click" data-target="' + kind + '">' +
        '<span class="attn-flag ' + a.kind + '"></span>' +
        '<div class="attn-text"><div class="attn-title">' + escapeHtml(a.text) + '</div><div class="attn-meta">' + escapeHtml(a.meta) + '</div></div>' +
        '</div>';
    }).join("") : '<div class="attn-empty">Nothing needs attention right now — nicely done.</div>';

    var recent = DB.activities.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 10);
    var feedHtml = recent.length ? recent.map(function (a) {
      var o = getOpportunity(a.opportunityId);
      return '<div class="feed-item">' +
        '<div class="feed-text"><b>' + escapeHtml(a.type) + '</b> — ' + escapeHtml(o ? o.title : "") + (o ? ' <span class="text-muted">(' + escapeHtml(companyName(o.companyId)) + ')</span>' : '') + '</div>' +
        (a.note ? '<div class="feed-text text-muted">' + escapeHtml(a.note) + '</div>' : '') +
        '<div class="feed-meta">' + fmtDate(a.date) + '</div>' +
        '</div>';
    }).join("") : '<div class="attn-empty">No activity yet.</div>';

    var pipelineHtml = renderPipelineMini();

    return (
      '<div class="view-header"><div><h1 class="view-title">Dashboard</h1><div class="view-subtitle">' + opps.length + ' opportunities tracked · updated locally in this browser</div></div></div>' +
      '<div class="metrics-row">' + metrics.map(function (m) {
        return '<div class="metric-card" data-action="metric-click" data-metric="' + m[2] + '"><div class="metric-value">' + m[1] + '</div><div class="metric-label">' + m[0] + '</div></div>';
      }).join("") + '</div>' +
      '<div class="section"><div class="section-head"><div class="section-title">Pipeline</div><button class="btn btn-sm btn-ghost" data-action="nav" data-view="opportunities">Open Opportunities →</button></div>' + pipelineHtml + '</div>' +
      '<div class="dashboard-grid">' +
      '<div class="section"><div class="section-head"><div class="section-title">Needs Attention <span class="count">' + getAttentionItems().length + '</span></div></div><div class="attn-list">' + attnHtml + '</div></div>' +
      '<div class="section"><div class="section-head"><div class="section-title">Recent Activity</div></div><div class="feed">' + feedHtml + '</div></div>' +
      '</div>'
    );
  }

  function renderPipelineMini() {
    var cols = D.STATUSES;
    return '<div class="kanban">' + cols.map(function (s) {
      var items = DB.opportunities.filter(function (o) { return o.status === s; });
      return '<div class="kanban-col"><div class="kanban-col-head"><span>' + escapeHtml(s) + '</span><span class="count">' + items.length + '</span></div>' +
        '<div class="kanban-col-body">' + items.slice(0, 4).map(function (o) {
          var fu = o.nextFollowUp ? dueLabel(o.nextFollowUp) : null;
          return '<div class="kcard" data-action="open-opp" data-id="' + o.id + '">' +
            '<div class="kcard-title">' + escapeHtml(o.title) + '</div>' +
            '<div class="kcard-company">' + escapeHtml(companyName(o.companyId)) + '</div>' +
            '<div class="kcard-meta">' + priorityTag(o.priority) + (fu ? '<span class="' + fu.cls + '" style="font-size:11px;">' + fu.text + '</span>' : '<span></span>') + '</div>' +
            '</div>';
        }).join("") + (items.length > 4 ? '<div class="text-muted" style="font-size:11px;padding:2px 2px;">+' + (items.length - 4) + ' more</div>' : '') + '</div></div>';
    }).join("") + '</div>';
  }

  function renderEmptyDashboard() {
    return (
      '<div class="view-header"><div><h1 class="view-title">Dashboard</h1></div></div>' +
      '<div class="empty-state">' +
      '<h3>Your dashboard is empty</h3>' +
      '<p>Start by adding an opportunity you\'re researching, applying to, or pitching. Everything is saved locally in this browser — nothing leaves your machine.</p>' +
      '<div class="empty-actions">' +
      '<button class="btn btn-primary" data-action="open-quick-add">+ Add your first opportunity</button>' +
      '<button class="btn btn-ghost" data-action="load-sample">Load sample data</button>' +
      '</div></div>'
    );
  }

  /* ================= OPPORTUNITIES VIEW ================= */
  function renderOpportunitiesView() {
    var opps = getFilteredOpportunities();
    if (state.savedView) opps = opps.filter(function (o) { return opportunityPassesSavedView(o, state.savedView); });

    var savedViews = [
      ["active", "All Active"], ["followup", "Follow Up"], ["consulting", "Consulting"],
      ["microsoft", "Microsoft Ecosystem"], ["impact", "Impact"], ["startups", "Startups"],
      ["applied", "Applied"], ["highpriority", "High Priority"]
    ];

    var html = '<div class="view-header"><div><h1 class="view-title">Opportunities</h1><div class="view-subtitle">Every lead, application and conversation in one place</div></div></div>';

    html += '<div class="saved-views">' + savedViews.map(function (v) {
      return '<button class="chip ' + (state.savedView === v[0] ? "is-active" : "") + '" data-action="saved-view" data-name="' + v[0] + '">' + v[1] + '</button>';
    }).join("") + (state.savedView || hasActiveFilters() ? '<button class="clear-filters" data-action="clear-filters">Clear filters</button>' : '') + '</div>';

    html += '<div class="toolbar">' +
      renderFilterPop("status", "Status", D.ALL_STATUSES) +
      renderFilterPop("type", "Type", D.TYPES) +
      renderFilterPop("category", "Category", D.CATEGORIES) +
      renderFilterPop("source", "Source", D.SOURCES) +
      renderFilterPop("priority", "Priority", D.PRIORITIES) +
      '<span class="results-count">' + opps.length + ' result' + (opps.length === 1 ? "" : "s") + '</span>' +
      '<div class="view-toggle"><button class="' + (state.oppView === "list" ? "is-active" : "") + '" data-action="opp-view" data-mode="list">List</button><button class="' + (state.oppView === "kanban" ? "is-active" : "") + '" data-action="opp-view" data-mode="kanban">Kanban</button></div>' +
      '</div>';

    if (opps.length === 0) {
      html += '<div class="empty-state"><h3>No opportunities match</h3><p>Try clearing filters or your search, or add a new opportunity.</p><div class="empty-actions"><button class="btn btn-ghost" data-action="clear-filters">Clear filters</button><button class="btn btn-primary" data-action="open-quick-add">+ Add Opportunity</button></div></div>';
      return html;
    }

    if (state.oppView === "kanban") {
      html += renderKanbanFull(opps);
    } else {
      html += renderOpportunityTable(opps);
    }
    return html;
  }

  function hasActiveFilters() {
    var f = state.filters;
    return f.status.length || f.type.length || f.category.length || f.source.length || f.priority.length;
  }

  function renderFilterPop(key, label, options) {
    var active = state.filters[key];
    var count = active.length;
    return '<div class="filter-pop-btn" data-filter-group="' + key + '">' +
      '<button class="filter-select" data-action="toggle-filter-pop" data-key="' + key + '">' + label + (count ? " (" + count + ")" : "") + ' ▾</button>' +
      '<div class="filter-pop hidden" data-pop="' + key + '">' + options.map(function (o) {
        return '<label><input type="checkbox" data-action="filter-check" data-key="' + key + '" value="' + escapeHtml(o) + '" ' + (active.indexOf(o) !== -1 ? "checked" : "") + '/> ' + escapeHtml(o) + '</label>';
      }).join("") + '</div></div>';
  }

  function renderOpportunityTable(opps) {
    opps = opps.slice().sort(function (a, b) {
      var na = a.nextFollowUp ? daysDiff(a.nextFollowUp) : 9999;
      var nb = b.nextFollowUp ? daysDiff(b.nextFollowUp) : 9999;
      return na - nb;
    });
    var rows = opps.map(function (o) {
      var last = lastActivityDate(o.id) || o.dateAdded;
      var fu = o.nextFollowUp ? dueLabel(o.nextFollowUp) : { text: "—", cls: "" };
      return '<tr data-action="open-opp" data-id="' + o.id + '">' +
        '<td><div class="cell-company">' + escapeHtml(companyName(o.companyId)) + '</div></td>' +
        '<td><div>' + escapeHtml(o.title) + '</div><div class="cell-sub">' + (o.types || []).slice(0, 2).join(", ") + '</div></td>' +
        '<td class="td-nowrap">' + statusTag(o.status) + '</td>' +
        '<td>' + escapeHtml(o.source || "—") + '</td>' +
        '<td>' + escapeHtml(o.location || "—") + '</td>' +
        '<td>' + escapeHtml(o.compensation || "—") + '</td>' +
        '<td class="td-nowrap">' + priorityTag(o.priority) + '</td>' +
        '<td>' + escapeHtml(o.nextAction || "—") + '</td>' +
        '<td class="td-nowrap ' + fu.cls + '">' + (o.nextFollowUp ? fmtDateShort(o.nextFollowUp) : "—") + (fu.cls ? ' <span style="font-size:10px;">(' + fu.text + ')</span>' : '') + '</td>' +
        '<td class="td-nowrap">' + relTime(last) + '</td>' +
        '<td class="td-nowrap">' + fmtDateShort(o.dateAdded) + '</td>' +
        '</tr>';
    }).join("");

    var cards = opps.map(function (o) {
      var fu = o.nextFollowUp ? dueLabel(o.nextFollowUp) : null;
      return '<div class="entity-card" data-action="open-opp" data-id="' + o.id + '">' +
        '<div class="flex-between"><div class="entity-card-title">' + escapeHtml(o.title) + '</div>' + priorityTag(o.priority) + '</div>' +
        '<div class="entity-card-sub">' + escapeHtml(companyName(o.companyId)) + ' · ' + escapeHtml(o.location || "") + '</div>' +
        '<div class="entity-card-body">' + statusTag(o.status) + (fu ? ' <span class="' + fu.cls + '" style="margin-left:8px;">' + fu.text + '</span>' : '') + '</div>' +
        '<div class="entity-card-foot">' + (o.types || []).map(function (t) { return '<span class="tag">' + escapeHtml(t) + '</span>'; }).join("") + '</div>' +
        '</div>';
    }).join("");

    return '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      '<th>Company</th><th>Opportunity</th><th>Status</th><th>Source</th><th>Location</th><th>Compensation</th><th>Priority</th><th>Next Action</th><th>Follow-up</th><th>Last Activity</th><th>Added</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="mobile-cards">' + cards + '</div>';
  }

  function renderKanbanFull(opps) {
    var main = D.STATUSES;
    var html = '<div class="kanban">' + main.map(function (s) {
      var items = opps.filter(function (o) { return o.status === s; });
      return '<div class="kanban-col" data-status-col="' + s + '"><div class="kanban-col-head"><span>' + escapeHtml(s) + '</span><span class="count">' + items.length + '</span></div>' +
        '<div class="kanban-col-body" data-status-drop="' + s + '">' + items.map(kcard).join("") + '</div></div>';
    }).join("") + '</div>';

    var side = D.SIDELINE_STATUSES;
    html += '<div class="kanban-more"><div class="section-title" style="margin-bottom:8px;">Inactive</div><div class="kanban">' + side.map(function (s) {
      var items = opps.filter(function (o) { return o.status === s; });
      return '<div class="kanban-col" data-status-col="' + s + '"><div class="kanban-col-head"><span>' + escapeHtml(s) + '</span><span class="count">' + items.length + '</span></div>' +
        '<div class="kanban-col-body" data-status-drop="' + s + '">' + items.map(kcard).join("") + '</div></div>';
    }).join("") + '</div></div>';
    return html;
  }
  function kcard(o) {
    var fu = o.nextFollowUp ? dueLabel(o.nextFollowUp) : null;
    return '<div class="kcard" draggable="true" data-opp-id="' + o.id + '" data-action="open-opp" data-id="' + o.id + '">' +
      '<div class="kcard-title">' + escapeHtml(o.title) + '</div>' +
      '<div class="kcard-company">' + escapeHtml(companyName(o.companyId)) + '</div>' +
      '<div class="kcard-meta">' + priorityTag(o.priority) + (fu ? '<span class="' + fu.cls + '" style="font-size:10.5px;">' + fu.text + '</span>' : '<span></span>') + '</div>' +
      '</div>';
  }

  function wireKanbanDnd() {
    var cards = document.querySelectorAll(".kcard[draggable=true]");
    cards.forEach(function (c) {
      c.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", c.getAttribute("data-opp-id"));
        e.dataTransfer.effectAllowed = "move";
      });
    });
    var drops = document.querySelectorAll("[data-status-drop]");
    drops.forEach(function (z) {
      z.addEventListener("dragover", function (e) { e.preventDefault(); z.classList.add("is-dragover"); });
      z.addEventListener("dragleave", function () { z.classList.remove("is-dragover"); });
      z.addEventListener("drop", function (e) {
        e.preventDefault();
        z.classList.remove("is-dragover");
        var id = e.dataTransfer.getData("text/plain");
        var o = getOpportunity(id);
        if (o) {
          var newStatus = z.getAttribute("data-status-drop");
          if (o.status !== newStatus) {
            o.status = newStatus;
            logActivity(o.id, "Note", "Status changed to " + newStatus + ".");
            saveDB();
            toast("Moved to " + newStatus);
            renderView();
          }
        }
      });
    });
  }

  function logActivity(oppId, type, note) {
    DB.activities.push({ id: uid("act"), opportunityId: oppId, type: type, note: note || "", date: todayISO() });
  }

  /* ================= OPPORTUNITY DRAWER ================= */
  function openOpportunityDrawer(id) {
    var o = getOpportunity(id);
    if (!o) return;
    state.drawerTab = "basic";
    renderDrawer(o);
    showDrawer();
  }

  function renderDrawer(o) {
    var content = document.getElementById("drawer-content");
    content.innerHTML = buildOpportunityDrawerHtml(o);
    wireDrawerTabs();
    wireEvalSliders(o);
  }

  function buildOpportunityDrawerHtml(o) {
    var score = computeScore(o.scores);
    var contactOptions = ['<option value="">— None —</option>'].concat(DB.contacts.map(function (c) {
      return '<option value="' + c.id + '" ' + (o.contactId === c.id ? "selected" : "") + '>' + escapeHtml(c.name) + '</option>';
    })).join("");
    var companyOptions = DB.companies.map(function (c) {
      return '<option value="' + c.id + '" ' + (o.companyId === c.id ? "selected" : "") + '>' + escapeHtml(c.name) + '</option>';
    }).join("");

    return (
      '<div class="drawer-head">' +
        '<input class="drawer-title-input" data-field="title" value="' + escapeHtml(o.title) + '" placeholder="Opportunity title" />' +
        '<button class="icon-btn drawer-close" data-action="close-drawer">✕</button>' +
      '</div>' +
      '<div class="drawer-sub">' + statusTag(o.status) + priorityTag(o.priority) +
        (score !== null ? '<span class="score-badge">' + score + '<small>/5 score</small></span>' : '') +
        '<span class="text-muted">Added ' + fmtDate(o.dateAdded) + '</span></div>' +

      '<div class="drawer-tabs">' +
        tabBtn("basic", "Basic Info") + tabBtn("type", "Type &amp; Source") + tabBtn("application", "Application") +
        tabBtn("eval", "Evaluation") + tabBtn("timeline", "Timeline") + tabBtn("notes", "Notes") +
      '</div>' +

      '<div class="drawer-panel" data-panel="basic">' +
        '<div class="field-grid">' +
          field("select", "Company", "companyId", "", companyOptions) +
          field("select", "Contact", "contactId", "", contactOptions) +
          field("text", "URL", "url", o.url) +
          field("text", "Job Posting URL", "jobUrl", o.jobUrl) +
          field("text", "Location", "location", o.location) +
          field("text", "Timezone", "timezone", o.timezone) +
          field("text", "Compensation", "compensation", o.compensation) +
          field("date", "Date Discovered", "dateDiscovered", o.dateDiscovered) +
          field("date", "Application Deadline", "applicationDeadline", o.applicationDeadline) +
          field("date", "Next Follow-up", "nextFollowUp", o.nextFollowUp) +
          field("select", "Status", "status", o.status, D.ALL_STATUSES.map(function (s) { return '<option ' + (o.status === s ? "selected" : "") + '>' + s + '</option>'; }).join("")) +
          field("select", "Priority", "priority", o.priority, D.PRIORITIES.map(function (p) { return '<option ' + (o.priority === p ? "selected" : "") + '>' + p + '</option>'; }).join("")) +
          fieldSpan2("text", "Next Action", "nextAction", o.nextAction) +
        '</div>' +
      '</div>' +

      '<div class="drawer-panel" data-panel="type">' +
        '<div class="field-hint" style="margin-bottom:6px;">Opportunity type (select all that apply)</div>' +
        checkboxGrid("types", D.TYPES, o.types) +
        '<div class="divider"></div>' +
        '<div class="field-hint" style="margin-bottom:6px;">Role category (select all that apply)</div>' +
        checkboxGrid("categories", D.CATEGORIES, o.categories) +
        '<div class="divider"></div>' +
        '<div class="field-grid">' +
          field("select", "Source", "source", o.source, D.SOURCES.map(function (s) { return '<option ' + (o.source === s ? "selected" : "") + '>' + s + '</option>'; }).join("")) +
          field("text", "Custom source (if Other)", "sourceOther", o.sourceOther) +
        '</div>' +
      '</div>' +

      '<div class="drawer-panel" data-panel="application">' +
        '<div class="field-grid">' +
          field("text", "Resume Version", "resumeVersion", o.resumeVersion) +
          field("text", "Portfolio Version", "portfolioVersion", o.portfolioVersion) +
          field("text", "Cover Letter / Intro Used", "coverLetter", o.coverLetter) +
          field("date", "Date Applied", "dateApplied", o.dateApplied) +
          field("text", "Application URL", "applicationUrl", o.applicationUrl) +
          field("text", "Application Status", "applicationStatus", o.applicationStatus) +
          field("text", "Recruiter", "recruiter", o.recruiter) +
          field("text", "Hiring Manager", "hiringManager", o.hiringManager) +
          field("text", "Referral", "referral", o.referral) +
          fieldSpan2("textarea", "Application Notes", "appNotes", o.appNotes) +
        '</div>' +
      '</div>' +

      '<div class="drawer-panel" data-panel="eval">' +
        '<div class="field-hint" style="margin-bottom:10px;">Rate this opportunity 1–5 across the dimensions that matter most. This is a compass, not a spreadsheet.</div>' +
        '<div class="eval-grid">' + D.EVAL_DIMENSIONS.map(function (d) {
          var v = (o.scores && o.scores[d.key]) || 0;
          return '<div class="eval-row"><label>' + d.label + '</label><input type="range" min="0" max="5" step="1" data-eval="' + d.key + '" value="' + v + '"/><div class="eval-val" data-eval-val="' + d.key + '">' + (v || "—") + '</div></div>';
        }).join("") + '</div>' +
        '<div class="score-summary"><div><div class="score-big" id="drawer-score-big">' + (score !== null ? score : "—") + '</div><div class="score-label">Opportunity Score</div></div>' +
        '<div class="text-muted" style="font-size:11.5px;">Average of rated dimensions, out of 5.</div></div>' +
      '</div>' +

      '<div class="drawer-panel" data-panel="timeline">' +
        '<div class="timeline-add">' +
          '<select id="new-act-type">' + D.ACTIVITY_TYPES.map(function (t) { return '<option>' + t + '</option>'; }).join("") + '</select>' +
          '<input id="new-act-note" type="text" placeholder="What happened? (optional note)" />' +
          '<button class="btn btn-sm btn-primary" data-action="add-activity">Add</button>' +
        '</div>' +
        '<div class="timeline">' + renderTimelineItems(o.id) + '</div>' +
      '</div>' +

      '<div class="drawer-panel" data-panel="notes">' +
        '<div class="field span-2"><label>General Notes</label><textarea data-field="notes" rows="8">' + escapeHtml(o.notes) + '</textarea></div>' +
      '</div>' +

      '<div class="divider"></div>' +
      '<div class="flex-between"><button class="btn btn-sm" data-action="add-task-for-opp" data-id="' + o.id + '">+ Add Task</button>' +
      '<button class="btn btn-sm btn-danger" data-action="delete-opp" data-id="' + o.id + '">Delete Opportunity</button></div>'
    );

    function tabBtn(key, label) {
      return '<button class="drawer-tab ' + (state.drawerTab === key ? "is-active" : "") + '" data-tab="' + key + '">' + label + '</button>';
    }
    function field(type, label, key, value, optionsHtml) {
      if (type === "select") return '<div class="field"><label>' + label + '</label><select data-field="' + key + '">' + optionsHtml + '</select></div>';
      return '<div class="field"><label>' + label + '</label><input type="' + type + '" data-field="' + key + '" value="' + escapeHtml(value || "") + '"/></div>';
    }
    function fieldSpan2(type, label, key, value) {
      if (type === "textarea") return '<div class="field span-2"><label>' + label + '</label><textarea data-field="' + key + '">' + escapeHtml(value || "") + '</textarea></div>';
      return '<div class="field span-2"><label>' + label + '</label><input type="text" data-field="' + key + '" value="' + escapeHtml(value || "") + '"/></div>';
    }
    function checkboxGrid(field, options, selected) {
      selected = selected || [];
      return '<div class="checkbox-grid">' + options.map(function (opt) {
        return '<label class="checkbox-item"><input type="checkbox" data-multi="' + field + '" value="' + escapeHtml(opt) + '" ' + (selected.indexOf(opt) !== -1 ? "checked" : "") + '/> ' + escapeHtml(opt) + '</label>';
      }).join("") + '</div>';
    }
  }

  function renderTimelineItems(oppId) {
    var acts = activitiesFor(oppId);
    if (!acts.length) return '<div class="attn-empty">No activity yet.</div>';
    return acts.map(function (a) {
      return '<div class="tl-item"><div class="tl-dot"></div><div class="tl-body"><div class="tl-type">' + escapeHtml(a.type) + '</div>' +
        (a.note ? '<div class="tl-note">' + escapeHtml(a.note) + '</div>' : '') +
        '<div class="tl-date">' + fmtDate(a.date) + '</div></div></div>';
    }).join("");
  }

  function wireDrawerTabs() {
    document.querySelectorAll(".drawer-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.drawerTab = btn.getAttribute("data-tab");
        document.querySelectorAll(".drawer-tab").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
        document.querySelectorAll(".drawer-panel").forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-panel") === state.drawerTab); });
      });
    });
    document.querySelectorAll(".drawer-panel").forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-panel") === state.drawerTab); });
  }

  function wireEvalSliders(o) {
    document.querySelectorAll("[data-eval]").forEach(function (input) {
      input.addEventListener("input", function () {
        var key = input.getAttribute("data-eval");
        var val = Number(input.value);
        o.scores = o.scores || {};
        o.scores[key] = val;
        document.querySelector('[data-eval-val="' + key + '"]').textContent = val || "—";
        var score = computeScore(o.scores);
        document.getElementById("drawer-score-big").textContent = score !== null ? score : "—";
        saveDB();
      });
    });
  }

  function currentDrawerOpp() {
    var input = document.querySelector('.drawer-title-input');
    return null;
  }

  /* ================= COMPANY / CONTACT DRAWERS ================= */
  function openCompanyDrawer(id) {
    var c = getCompany(id);
    if (!c) return;
    var content = document.getElementById("drawer-content");
    var relatedOpps = oppsForCompany(id);
    var relatedContacts = contactsForCompany(id);
    content.innerHTML =
      '<div class="drawer-head"><input class="drawer-title-input" data-cfield="name" value="' + escapeHtml(c.name) + '"/><button class="icon-btn drawer-close" data-action="close-drawer">✕</button></div>' +
      '<div class="drawer-sub"><span class="tag">' + escapeHtml(c.type) + '</span>' + (c.bCorp ? '<span class="tag tag-accent">B Corp</span>' : '') + '<span class="text-muted">' + escapeHtml(c.location || "") + '</span></div>' +
      '<div class="field-grid">' +
        cfield("text", "Website", "website", c.website) +
        cfield("text", "Industry", "industry", c.industry) +
        cselect("Size", "size", c.size, D.COMPANY_SIZES) +
        cfield("text", "Location", "location", c.location) +
        cselect("Company Type", "type", c.type, D.COMPANY_TYPES) +
        cselect("Impact Area", "impactArea", c.impactArea, D.IMPACT_AREAS) +
        '<div class="field"><label>B Corp?</label><select data-cfield="bCorp"><option value="false" ' + (!c.bCorp ? "selected" : "") + '>No</option><option value="true" ' + (c.bCorp ? "selected" : "") + '>Yes</option></select></div>' +
      '</div>' +
      '<div class="field span-2" style="margin-top:12px;"><label>Mission / Values</label><textarea data-cfield="mission" rows="2">' + escapeHtml(c.mission || "") + '</textarea></div>' +
      '<div class="field span-2" style="margin-top:12px;"><label>Notes</label><textarea data-cfield="notes" rows="3">' + escapeHtml(c.notes || "") + '</textarea></div>' +
      '<div class="divider"></div>' +
      '<div class="section-title" style="margin-bottom:8px;">Opportunities <span class="count">' + relatedOpps.length + '</span></div>' +
      (relatedOpps.length ? '<div class="related-list">' + relatedOpps.map(function (o) {
        return '<div class="related-item" data-action="open-opp" data-id="' + o.id + '"><span>' + escapeHtml(o.title) + '</span>' + statusTag(o.status) + '</div>';
      }).join("") + '</div>' : '<div class="text-muted" style="font-size:12px;">No opportunities yet for this company.</div>') +
      '<div class="section-title" style="margin:16px 0 8px;">Contacts <span class="count">' + relatedContacts.length + '</span></div>' +
      (relatedContacts.length ? '<div class="related-list">' + relatedContacts.map(function (p) {
        return '<div class="related-item" data-action="open-contact" data-id="' + p.id + '"><span>' + escapeHtml(p.name) + '</span><span class="text-muted">' + escapeHtml(p.relationshipType) + '</span></div>';
      }).join("") + '</div>' : '<div class="text-muted" style="font-size:12px;">No contacts yet for this company.</div>') +
      '<div class="divider"></div>' +
      '<div class="flex-between"><span></span><button class="btn btn-sm btn-danger" data-action="delete-company" data-id="' + c.id + '">Delete Company</button></div>';
    showDrawer();

    function cfield(type, label, key, value) {
      return '<div class="field"><label>' + label + '</label><input type="' + type + '" data-cfield="' + key + '" value="' + escapeHtml(value || "") + '"/></div>';
    }
    function cselect(label, key, value, options) {
      return '<div class="field"><label>' + label + '</label><select data-cfield="' + key + '">' + options.map(function (o) { return '<option ' + (value === o ? "selected" : "") + '>' + o + '</option>'; }).join("") + '</select></div>';
    }
  }

  function openContactDrawer(id) {
    var p = getContact(id);
    if (!p) return;
    var content = document.getElementById("drawer-content");
    var relatedOpps = oppsForContact(id);
    var companyOptions = ['<option value="">— None —</option>'].concat(DB.companies.map(function (c) {
      return '<option value="' + c.id + '" ' + (p.companyId === c.id ? "selected" : "") + '>' + escapeHtml(c.name) + '</option>';
    })).join("");
    content.innerHTML =
      '<div class="drawer-head"><input class="drawer-title-input" data-pfield="name" value="' + escapeHtml(p.name) + '"/><button class="icon-btn drawer-close" data-action="close-drawer">✕</button></div>' +
      '<div class="drawer-sub"><span class="tag">' + escapeHtml(p.relationshipType) + '</span>' + (p.companyId ? '<span class="text-muted">' + escapeHtml(companyName(p.companyId)) + '</span>' : '') + '</div>' +
      '<div class="field-grid">' +
        '<div class="field"><label>Role</label><input type="text" data-pfield="role" value="' + escapeHtml(p.role || "") + '"/></div>' +
        '<div class="field"><label>Company</label><select data-pfield="companyId">' + companyOptions + '</select></div>' +
        '<div class="field"><label>Relationship Type</label><select data-pfield="relationshipType">' + D.RELATIONSHIP_TYPES.map(function (r) { return '<option ' + (p.relationshipType === r ? "selected" : "") + '>' + r + '</option>'; }).join("") + '</select></div>' +
        '<div class="field"><label>Location</label><input type="text" data-pfield="location" value="' + escapeHtml(p.location || "") + '"/></div>' +
        '<div class="field"><label>Email</label><input type="text" data-pfield="email" value="' + escapeHtml(p.email || "") + '"/></div>' +
        '<div class="field"><label>LinkedIn</label><input type="text" data-pfield="linkedin" value="' + escapeHtml(p.linkedin || "") + '"/></div>' +
        '<div class="field"><label>Last Contact</label><input type="date" data-pfield="lastContact" value="' + escapeHtml(p.lastContact || "") + '"/></div>' +
        '<div class="field"><label>Next Follow-up</label><input type="date" data-pfield="nextFollowUp" value="' + escapeHtml(p.nextFollowUp || "") + '"/></div>' +
      '</div>' +
      '<div class="field span-2" style="margin-top:12px;"><label>Notes</label><textarea data-pfield="notes" rows="4">' + escapeHtml(p.notes || "") + '</textarea></div>' +
      '<div class="divider"></div>' +
      '<div class="section-title" style="margin-bottom:8px;">Related Opportunities <span class="count">' + relatedOpps.length + '</span></div>' +
      (relatedOpps.length ? '<div class="related-list">' + relatedOpps.map(function (o) {
        return '<div class="related-item" data-action="open-opp" data-id="' + o.id + '"><span>' + escapeHtml(o.title) + '</span>' + statusTag(o.status) + '</div>';
      }).join("") + '</div>' : '<div class="text-muted" style="font-size:12px;">No related opportunities yet.</div>') +
      '<div class="divider"></div>' +
      '<div class="flex-between"><button class="btn btn-sm" data-action="mark-contacted" data-id="' + p.id + '">Mark contacted today</button>' +
      '<button class="btn btn-sm btn-danger" data-action="delete-contact" data-id="' + p.id + '">Delete Contact</button></div>';
    showDrawer();
  }

  /* ================= DRAWER SHOW/HIDE ================= */
  function showDrawer() {
    document.getElementById("scrim").hidden = false;
    var drawer = document.getElementById("drawer");
    drawer.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
  }
  function closeDrawer() {
    document.getElementById("scrim").hidden = true;
    var drawer = document.getElementById("drawer");
    drawer.hidden = true;
    drawer.setAttribute("aria-hidden", "true");
    document.getElementById("drawer-content").innerHTML = "";
    renderView();
  }

  /* ================= COMPANIES VIEW ================= */
  function renderCompaniesView() {
    var q = state.companyFilter.trim().toLowerCase();
    var companies = DB.companies.filter(function (c) {
      if (!q) return true;
      return (c.name + " " + c.industry + " " + c.type).toLowerCase().indexOf(q) !== -1;
    });
    var html = '<div class="view-header"><div><h1 class="view-title">Companies</h1><div class="view-subtitle">' + DB.companies.length + ' companies in your network</div></div>' +
      '<div class="view-header-actions"><button class="btn btn-primary" data-action="open-add-company">+ Add Company</button></div></div>';
    html += '<div class="toolbar"><input class="filter-select" style="min-width:220px;" id="company-search" placeholder="Filter companies…" value="' + escapeHtml(state.companyFilter) + '"/></div>';
    if (!companies.length) {
      html += '<div class="empty-state"><h3>No companies yet</h3><p>Companies are created automatically when you add an opportunity, or you can add one directly.</p><div class="empty-actions"><button class="btn btn-primary" data-action="open-add-company">+ Add Company</button></div></div>';
      return html;
    }
    html += '<div class="card-grid">' + companies.map(function (c) {
      var opps = oppsForCompany(c.id);
      return '<div class="entity-card" data-action="open-company" data-id="' + c.id + '">' +
        '<div class="entity-card-title">' + escapeHtml(c.name) + '</div>' +
        '<div class="entity-card-sub">' + escapeHtml(c.industry || "") + ' · ' + escapeHtml(c.location || "") + '</div>' +
        '<div class="entity-card-body">' + opps.length + ' opportunit' + (opps.length === 1 ? "y" : "ies") + ' · ' + contactsForCompany(c.id).length + ' contact' + (contactsForCompany(c.id).length === 1 ? "" : "s") + '</div>' +
        '<div class="entity-card-foot"><span class="tag">' + escapeHtml(c.type) + '</span>' + (c.bCorp ? '<span class="tag tag-accent">B Corp</span>' : '') + (c.impactArea && c.impactArea !== "Other" ? '<span class="tag">' + escapeHtml(c.impactArea) + '</span>' : '') + '</div>' +
        '</div>';
    }).join("") + '</div>';
    return html;
  }

  /* ================= CONTACTS VIEW ================= */
  function renderContactsView() {
    var q = state.contactFilter.trim().toLowerCase();
    var contacts = DB.contacts.filter(function (c) {
      if (!q) return true;
      return (c.name + " " + (c.role || "") + " " + companyName(c.companyId)).toLowerCase().indexOf(q) !== -1;
    }).slice().sort(function (a, b) {
      var da = a.lastContact ? -daysDiff(a.lastContact) : 9999;
      var db = b.lastContact ? -daysDiff(b.lastContact) : 9999;
      return db - da;
    });
    var html = '<div class="view-header"><div><h1 class="view-title">Contacts</h1><div class="view-subtitle">' + DB.contacts.length + ' people in your professional network</div></div>' +
      '<div class="view-header-actions"><button class="btn btn-primary" data-action="open-add-contact">+ Add Contact</button></div></div>';
    html += '<div class="toolbar"><input class="filter-select" style="min-width:220px;" id="contact-search" placeholder="Filter contacts…" value="' + escapeHtml(state.contactFilter) + '"/></div>';
    if (!contacts.length) {
      html += '<div class="empty-state"><h3>No contacts yet</h3><p>Add recruiters, hiring managers, founders and network connections as you meet them.</p><div class="empty-actions"><button class="btn btn-primary" data-action="open-add-contact">+ Add Contact</button></div></div>';
      return html;
    }
    var rows = contacts.map(function (p) {
      var stale = p.lastContact ? -daysDiff(p.lastContact) >= 21 : true;
      return '<tr data-action="open-contact" data-id="' + p.id + '">' +
        '<td><div class="cell-company">' + escapeHtml(p.name) + '</div><div class="cell-sub">' + escapeHtml(p.role || "") + '</div></td>' +
        '<td>' + escapeHtml(p.companyId ? companyName(p.companyId) : "—") + '</td>' +
        '<td>' + escapeHtml(p.relationshipType) + '</td>' +
        '<td>' + escapeHtml(p.location || "—") + '</td>' +
        '<td class="' + (stale ? "needs-follow" : "") + '">' + (p.lastContact ? fmtDateShort(p.lastContact) : "Never") + (stale ? " ⚠" : "") + '</td>' +
        '<td>' + (p.nextFollowUp ? fmtDateShort(p.nextFollowUp) : "—") + '</td>' +
        '</tr>';
    }).join("");
    var cards = contacts.map(function (p) {
      var stale = p.lastContact ? -daysDiff(p.lastContact) >= 21 : true;
      return '<div class="entity-card" data-action="open-contact" data-id="' + p.id + '">' +
        '<div class="entity-card-title">' + escapeHtml(p.name) + '</div>' +
        '<div class="entity-card-sub">' + escapeHtml(p.role || "") + (p.companyId ? " · " + escapeHtml(companyName(p.companyId)) : "") + '</div>' +
        '<div class="entity-card-body ' + (stale ? "needs-follow" : "") + '">Last contact: ' + (p.lastContact ? fmtDateShort(p.lastContact) : "Never") + (stale ? " — needs follow-up" : "") + '</div>' +
        '</div>';
    }).join("");
    html += '<div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Company</th><th>Relationship</th><th>Location</th><th>Last Contact</th><th>Next Follow-up</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="mobile-cards">' + cards + '</div>';
    return html;
  }

  /* ================= TASKS VIEW ================= */
  function renderTasksView() {
    var tasks = DB.tasks.slice();
    var html = '<div class="view-header"><div><h1 class="view-title">Tasks</h1><div class="view-subtitle">Follow-ups, prep and next actions</div></div>' +
      '<div class="view-header-actions"><button class="btn btn-primary" data-action="open-add-task">+ Add Task</button></div></div>';
    html += '<div class="toolbar">' +
      ["open", "all", "done"].map(function (f) {
        return '<button class="chip ' + (state.taskFilter === f ? "is-active" : "") + '" data-action="task-filter" data-filter="' + f + '">' + (f === "open" ? "Open" : f === "all" ? "All" : "Completed") + '</button>';
      }).join("") + '</div>';

    var filtered = tasks.filter(function (t) {
      if (state.taskFilter === "open") return !t.completed;
      if (state.taskFilter === "done") return t.completed;
      return true;
    });

    if (!filtered.length) {
      html += '<div class="empty-state"><h3>Nothing here</h3><p>You\'re all caught up, or no tasks match this filter yet.</p><div class="empty-actions"><button class="btn btn-primary" data-action="open-add-task">+ Add Task</button></div></div>';
      return html;
    }

    var overdue = filtered.filter(function (t) { return !t.completed && daysDiff(t.dueDate) !== null && daysDiff(t.dueDate) < 0; });
    var today = filtered.filter(function (t) { return !t.completed && daysDiff(t.dueDate) === 0; });
    var upcoming = filtered.filter(function (t) { return !t.completed && daysDiff(t.dueDate) !== null && daysDiff(t.dueDate) > 0; });
    var noDate = filtered.filter(function (t) { return !t.completed && !t.dueDate; });
    var done = filtered.filter(function (t) { return t.completed; });

    function group(title, list) {
      if (!list.length) return "";
      list = list.slice().sort(function (a, b) { return (a.dueDate || "9999") < (b.dueDate || "9999") ? -1 : 1; });
      return '<div class="task-group"><div class="section-title" style="margin-bottom:8px;">' + title + ' <span class="count">' + list.length + '</span></div>' +
        list.map(taskRow).join("") + '</div>';
    }

    html += group("Overdue", overdue) + group("Due Today", today) + group("Upcoming", upcoming) + group("No Due Date", noDate) + group("Completed", done);
    return html;
  }

  function taskRow(t) {
    var due = t.dueDate ? dueLabel(t.dueDate) : null;
    var opp = t.opportunityId ? getOpportunity(t.opportunityId) : null;
    var contact = t.contactId ? getContact(t.contactId) : null;
    return '<div class="task-row ' + (t.completed ? "is-done" : "") + '">' +
      '<button class="task-check ' + (t.completed ? "is-done" : "") + '" data-action="toggle-task" data-id="' + t.id + '"></button>' +
      '<div class="task-main">' +
        '<div class="task-title">' + escapeHtml(t.task) + '</div>' +
        '<div class="task-meta">' +
          (t.dueDate ? '<span class="task-due ' + due.cls + '">' + fmtDateShort(t.dueDate) + ' · ' + due.text + '</span>' : '<span>No due date</span>') +
          priorityTag(t.priority) +
          (opp ? '<a class="task-link" data-action="open-opp" data-id="' + opp.id + '">' + escapeHtml(opp.title) + '</a>' : '') +
          (contact ? '<a class="task-link" data-action="open-contact" data-id="' + contact.id + '">' + escapeHtml(contact.name) + '</a>' : '') +
        '</div>' +
      '</div>' +
      '<button class="icon-btn" data-action="delete-task" data-id="' + t.id + '" title="Delete task">✕</button>' +
      '</div>';
  }

  /* ================= SETTINGS VIEW ================= */
  function renderSettingsView() {
    return (
      '<div class="view-header"><div><h1 class="view-title">Settings</h1><div class="view-subtitle">Data lives only in this browser</div></div></div>' +
      '<div class="backup-note">Your data is stored locally in this browser. Export a backup periodically.</div>' +
      '<div class="settings-block" style="margin-top:16px;">' +
        '<h3>Export</h3><p>Download everything as a JSON backup (recommended), or export opportunities as a CSV spreadsheet.</p>' +
        '<div class="settings-actions"><button class="btn btn-primary" data-action="export-json">Export JSON Backup</button><button class="btn" data-action="export-csv">Export Opportunities (CSV)</button></div>' +
      '</div>' +
      '<div class="settings-block">' +
        '<h3>Import</h3><p>Restore from a previously exported JSON backup. Importing can replace or merge with your current data — you\'ll be asked to confirm before anything changes.</p>' +
        '<div class="settings-actions"><label class="btn" style="cursor:pointer;">Choose File<input type="file" id="import-file" accept="application/json" style="display:none;"/></label></div>' +
      '</div>' +
      '<div class="settings-block">' +
        '<h3>Sample &amp; Reset</h3><p>Reload the example dataset, or clear everything and start from a blank slate.</p>' +
        '<div class="settings-actions"><button class="btn" data-action="load-sample">Load Sample Data</button><button class="btn btn-danger" data-action="reset-all">Erase All Data</button></div>' +
      '</div>' +
      '<div class="settings-block">' +
        '<h3>About</h3><p>JOBTRAK is a local-first opportunity dashboard — it works entirely in your browser with no account, server or network connection required after this page has loaded. Nothing you enter is ever sent anywhere.</p>' +
      '</div>'
    );
  }

  /* ================= QUICK ADD MODAL ================= */
  function openQuickAdd() {
    var m = document.getElementById("modal-content");
    var companyOptions = '<input list="company-datalist" data-field="companyName" placeholder="Type or select a company" autocomplete="off"/><datalist id="company-datalist">' +
      DB.companies.map(function (c) { return '<option value="' + escapeHtml(c.name) + '">'; }).join("") + '</datalist>';
    m.innerHTML =
      '<div class="modal-head"><h2 class="modal-title">Add Opportunity</h2><button class="icon-btn" data-action="close-modal">✕</button></div>' +
      '<form id="quick-add-form">' +
      '<div class="field-grid">' +
        '<div class="field span-2"><label>Company</label>' + companyOptions + '</div>' +
        '<div class="field span-2"><label>Opportunity</label><input type="text" data-field="title" required placeholder="e.g. Senior Product Designer"/></div>' +
        '<div class="field"><label>URL</label><input type="text" data-field="url" placeholder="company.com"/></div>' +
        '<div class="field"><label>Type</label><select data-field="type">' + D.TYPES.map(function (t) { return '<option>' + t + '</option>'; }).join("") + '</select></div>' +
        '<div class="field"><label>Category</label><select data-field="category">' + D.CATEGORIES.map(function (c) { return '<option>' + c + '</option>'; }).join("") + '</select></div>' +
        '<div class="field"><label>Source</label><select data-field="source">' + D.SOURCES.map(function (s) { return '<option>' + s + '</option>'; }).join("") + '</select></div>' +
        '<div class="field"><label>Status</label><select data-field="status">' + D.ALL_STATUSES.map(function (s) { return '<option>' + s + '</option>'; }).join("") + '</select></div>' +
        '<div class="field"><label>Priority</label><select data-field="priority"><option>Medium</option><option>High</option><option>Low</option></select></div>' +
        '<div class="field span-2"><label>Next Action</label><input type="text" data-field="nextAction" placeholder="e.g. Send intro email"/></div>' +
        '<div class="field"><label>Follow-up Date</label><input type="date" data-field="nextFollowUp"/></div>' +
        '<div class="field span-2"><label>Notes</label><textarea data-field="notes" rows="2"></textarea></div>' +
      '</div>' +
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button type="submit" class="btn btn-primary">Save Opportunity</button></div>' +
      '</form>';
    showModal();
    document.getElementById("quick-add-form").addEventListener("submit", function (e) {
      e.preventDefault();
      saveQuickAdd(m);
    });
    m.querySelector('[data-field="title"]').focus();
  }

  function saveQuickAdd(m) {
    var val = function (k) { var el = m.querySelector('[data-field="' + k + '"]'); return el ? el.value.trim() : ""; };
    var companyNameVal = val("companyName");
    if (!companyNameVal || !val("title")) { toast("Company and opportunity title are required"); return; }
    var company = DB.companies.find(function (c) { return c.name.toLowerCase() === companyNameVal.toLowerCase(); });
    if (!company) {
      company = { id: uid("c"), name: companyNameVal, website: "", industry: "", size: "", location: "", type: "Other", mission: "", bCorp: false, impactArea: "Other", notes: "" };
      DB.companies.push(company);
    }
    var opp = {
      id: uid("o"), title: val("title"), companyId: company.id, url: val("url"), jobUrl: "",
      contactId: null, location: "", timezone: "", compensation: "",
      dateDiscovered: todayISO(), applicationDeadline: "",
      types: [val("type")], source: val("source"), sourceOther: "",
      categories: [val("category")],
      resumeVersion: "", portfolioVersion: "", coverLetter: "", dateApplied: "", applicationUrl: "", applicationStatus: "",
      recruiter: "", hiringManager: "", referral: "", appNotes: "",
      status: val("status"), priority: val("priority"), nextAction: val("nextAction"), nextFollowUp: val("nextFollowUp"),
      notes: val("notes"), scores: {}, dateAdded: todayISO()
    };
    DB.opportunities.push(opp);
    logActivity(opp.id, "Added", "Added via quick add.");
    saveDB();
    closeModal();
    toast("Opportunity added");
    renderView();
  }

  /* ================= ADD COMPANY / CONTACT / TASK MODALS ================= */
  function openAddCompanyModal() {
    var m = document.getElementById("modal-content");
    m.innerHTML =
      '<div class="modal-head"><h2 class="modal-title">Add Company</h2><button class="icon-btn" data-action="close-modal">✕</button></div>' +
      '<form id="add-company-form"><div class="field-grid">' +
      '<div class="field span-2"><label>Company Name</label><input type="text" data-field="name" required/></div>' +
      '<div class="field"><label>Website</label><input type="text" data-field="website"/></div>' +
      '<div class="field"><label>Industry</label><input type="text" data-field="industry"/></div>' +
      '<div class="field"><label>Size</label><select data-field="size">' + D.COMPANY_SIZES.map(function (s) { return '<option>' + s + '</option>'; }).join("") + '</select></div>' +
      '<div class="field"><label>Location</label><input type="text" data-field="location"/></div>' +
      '<div class="field"><label>Company Type</label><select data-field="type">' + D.COMPANY_TYPES.map(function (t) { return '<option>' + t + '</option>'; }).join("") + '</select></div>' +
      '<div class="field"><label>Impact Area</label><select data-field="impactArea">' + D.IMPACT_AREAS.map(function (a) { return '<option>' + a + '</option>'; }).join("") + '</select></div>' +
      '<div class="field span-2"><label>Notes</label><textarea data-field="notes" rows="2"></textarea></div>' +
      '</div><div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button type="submit" class="btn btn-primary">Save Company</button></div></form>';
    showModal();
    document.getElementById("add-company-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var val = function (k) { return m.querySelector('[data-field="' + k + '"]').value.trim(); };
      if (!val("name")) { toast("Company name is required"); return; }
      DB.companies.push({ id: uid("c"), name: val("name"), website: val("website"), industry: val("industry"), size: val("size"), location: val("location"), type: val("type"), mission: "", bCorp: false, impactArea: val("impactArea"), notes: val("notes") });
      saveDB(); closeModal(); toast("Company added"); renderView();
    });
  }

  function openAddContactModal() {
    var m = document.getElementById("modal-content");
    var companyOptions = '<option value="">— None —</option>' + DB.companies.map(function (c) { return '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>'; }).join("");
    m.innerHTML =
      '<div class="modal-head"><h2 class="modal-title">Add Contact</h2><button class="icon-btn" data-action="close-modal">✕</button></div>' +
      '<form id="add-contact-form"><div class="field-grid">' +
      '<div class="field span-2"><label>Name</label><input type="text" data-field="name" required/></div>' +
      '<div class="field"><label>Role</label><input type="text" data-field="role"/></div>' +
      '<div class="field"><label>Company</label><select data-field="companyId">' + companyOptions + '</select></div>' +
      '<div class="field"><label>Relationship Type</label><select data-field="relationshipType">' + D.RELATIONSHIP_TYPES.map(function (r) { return '<option>' + r + '</option>'; }).join("") + '</select></div>' +
      '<div class="field"><label>Email</label><input type="text" data-field="email"/></div>' +
      '<div class="field"><label>LinkedIn</label><input type="text" data-field="linkedin"/></div>' +
      '<div class="field"><label>Location</label><input type="text" data-field="location"/></div>' +
      '<div class="field"><label>Next Follow-up</label><input type="date" data-field="nextFollowUp"/></div>' +
      '<div class="field span-2"><label>Notes</label><textarea data-field="notes" rows="2"></textarea></div>' +
      '</div><div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button type="submit" class="btn btn-primary">Save Contact</button></div></form>';
    showModal();
    document.getElementById("add-contact-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var val = function (k) { return m.querySelector('[data-field="' + k + '"]').value.trim(); };
      if (!val("name")) { toast("Name is required"); return; }
      DB.contacts.push({ id: uid("p"), name: val("name"), role: val("role"), companyId: val("companyId") || null, relationshipType: val("relationshipType"), email: val("email"), linkedin: val("linkedin"), location: val("location"), lastContact: "", nextFollowUp: val("nextFollowUp"), notes: val("notes") });
      saveDB(); closeModal(); toast("Contact added"); renderView();
    });
  }

  function openAddTaskModal(prefill) {
    prefill = prefill || {};
    var m = document.getElementById("modal-content");
    var oppOptions = '<option value="">— None —</option>' + DB.opportunities.map(function (o) { return '<option value="' + o.id + '" ' + (prefill.opportunityId === o.id ? "selected" : "") + '>' + escapeHtml(o.title) + '</option>'; }).join("");
    var contactOptions = '<option value="">— None —</option>' + DB.contacts.map(function (c) { return '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>'; }).join("");
    m.innerHTML =
      '<div class="modal-head"><h2 class="modal-title">Add Task</h2><button class="icon-btn" data-action="close-modal">✕</button></div>' +
      '<form id="add-task-form"><div class="field-grid">' +
      '<div class="field span-2"><label>Task</label><input type="text" data-field="task" required placeholder="e.g. Follow up with recruiter"/></div>' +
      '<div class="field"><label>Due Date</label><input type="date" data-field="dueDate" value="' + todayISO() + '"/></div>' +
      '<div class="field"><label>Priority</label><select data-field="priority"><option>Medium</option><option>High</option><option>Low</option></select></div>' +
      '<div class="field"><label>Opportunity</label><select data-field="opportunityId">' + oppOptions + '</select></div>' +
      '<div class="field"><label>Contact</label><select data-field="contactId">' + contactOptions + '</select></div>' +
      '</div><div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button type="submit" class="btn btn-primary">Save Task</button></div></form>';
    showModal();
    document.getElementById("add-task-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var val = function (k) { var el = m.querySelector('[data-field="' + k + '"]'); return el ? el.value : ""; };
      if (!val("task").trim()) { toast("Task description is required"); return; }
      DB.tasks.push({ id: uid("t"), task: val("task").trim(), dueDate: val("dueDate"), priority: val("priority"), opportunityId: val("opportunityId") || null, contactId: val("contactId") || null, completed: false });
      saveDB(); closeModal(); toast("Task added"); renderView();
    });
  }

  /* ================= IMPORT / EXPORT ================= */
  function exportJSON() {
    var blob = new Blob([JSON.stringify(DB, null, 2)], { type: "application/json" });
    downloadBlob(blob, "jobtrak-backup-" + todayISO() + ".json");
    toast("Backup exported");
  }
  function exportCSV() {
    var cols = ["title", "companyName", "status", "priority", "types", "categories", "source", "location", "timezone", "compensation", "nextAction", "nextFollowUp", "dateApplied", "dateAdded", "notes"];
    var rows = [cols.join(",")];
    DB.opportunities.forEach(function (o) {
      var row = {
        title: o.title, companyName: companyName(o.companyId), status: o.status, priority: o.priority,
        types: (o.types || []).join("; "), categories: (o.categories || []).join("; "), source: o.source,
        location: o.location, timezone: o.timezone, compensation: o.compensation, nextAction: o.nextAction,
        nextFollowUp: o.nextFollowUp, dateApplied: o.dateApplied, dateAdded: o.dateAdded, notes: o.notes
      };
      rows.push(cols.map(function (c) { return csvEscape(row[c]); }).join(","));
    });
    var blob = new Blob([rows.join("\n")], { type: "text/csv" });
    downloadBlob(blob, "opportunities-" + todayISO() + ".csv");
    toast("CSV exported");
  }
  function csvEscape(v) {
    v = v === undefined || v === null ? "" : String(v);
    if (/[",\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
    return v;
  }
  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function handleImportFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try { parsed = JSON.parse(reader.result); } catch (e) { toast("That file doesn't look like a valid backup"); return; }
      if (!parsed || !Array.isArray(parsed.opportunities)) { toast("That file doesn't look like a valid backup"); return; }
      openImportConfirm(parsed);
    };
    reader.readAsText(file);
  }

  function openImportConfirm(parsed) {
    var m = document.getElementById("modal-content");
    m.innerHTML =
      '<div class="modal-head"><h2 class="modal-title">Import Backup</h2><button class="icon-btn" data-action="close-modal">✕</button></div>' +
      '<p style="font-size:12.5px;line-height:1.6;">This file contains ' + (parsed.opportunities || []).length + ' opportunities, ' + (parsed.companies || []).length + ' companies, ' + (parsed.contacts || []).length + ' contacts and ' + (parsed.tasks || []).length + ' tasks.</p>' +
      '<p class="modal-note">Choose how to bring this data in. <b>Merge</b> adds new records and keeps anything with a matching ID up to date. <b>Replace</b> permanently deletes everything currently in this browser and replaces it with the file\'s contents.</p>' +
      '<div class="modal-foot"><button class="btn" data-action="close-modal">Cancel</button><button class="btn" data-action="import-merge">Merge</button><button class="btn btn-danger" data-action="import-replace">Replace All</button></div>';
    showModal();
    m.querySelector('[data-action="import-merge"]').addEventListener("click", function () { doImport(parsed, "merge"); });
    m.querySelector('[data-action="import-replace"]').addEventListener("click", function () { doImport(parsed, "replace"); });
  }

  function doImport(parsed, mode) {
    if (mode === "replace") {
      DB = {
        version: 1,
        companies: parsed.companies || [],
        contacts: parsed.contacts || [],
        opportunities: parsed.opportunities || [],
        tasks: parsed.tasks || [],
        activities: parsed.activities || []
      };
    } else {
      ["companies", "contacts", "opportunities", "tasks", "activities"].forEach(function (key) {
        var incoming = parsed[key] || [];
        incoming.forEach(function (rec) {
          var idx = DB[key].findIndex(function (r) { return r.id === rec.id; });
          if (idx !== -1) DB[key][idx] = rec; else DB[key].push(rec);
        });
      });
    }
    saveDB();
    closeModal();
    toast("Import complete");
    setView(state.view);
  }

  function resetAll() {
    if (!confirm("This will permanently erase all data in this browser. This cannot be undone. Continue?")) return;
    DB = { version: 1, companies: [], contacts: [], opportunities: [], tasks: [], activities: [] };
    saveDB();
    toast("All data erased");
    setView("dashboard");
  }

  function loadSample() {
    if (DB.opportunities.length && !confirm("Load sample data alongside your existing records?")) return;
    var seed = D.buildSeedData();
    DB.companies = DB.companies.concat(seed.companies.filter(function (c) { return !DB.companies.some(function (x) { return x.id === c.id; }); }));
    DB.contacts = DB.contacts.concat(seed.contacts.filter(function (c) { return !DB.contacts.some(function (x) { return x.id === c.id; }); }));
    DB.opportunities = DB.opportunities.concat(seed.opportunities.filter(function (o) { return !DB.opportunities.some(function (x) { return x.id === o.id; }); }));
    DB.tasks = DB.tasks.concat(seed.tasks.filter(function (t) { return !DB.tasks.some(function (x) { return x.id === t.id; }); }));
    DB.activities = DB.activities.concat(seed.activities);
    saveDB();
    toast("Sample data loaded");
    setView("dashboard");
  }

  /* ================= MODAL SHOW/HIDE ================= */
  function showModal() { document.getElementById("modal-wrap").hidden = false; }
  function closeModal() { document.getElementById("modal-wrap").hidden = true; document.getElementById("modal-content").innerHTML = ""; }

  /* ================= GLOBAL SEARCH ================= */
  function runGlobalSearch(q) {
    state.search = q;
    if (state.view !== "opportunities") setView("opportunities");
    else renderView();
  }

  /* ================= EVENT WIRING ================= */
  function wireGlobalEvents() {
    document.getElementById("global-search").addEventListener("input", debounce(function (e) { runGlobalSearch(e.target.value); }, 200));
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        document.getElementById("global-search").focus();
      }
      if (e.key === "Escape") {
        if (!document.getElementById("modal-wrap").hidden) closeModal();
        else if (!document.getElementById("drawer").hidden) closeDrawer();
      }
    });

    document.getElementById("scrim").addEventListener("click", closeDrawer);
    document.getElementById("modal-wrap").addEventListener("click", function (e) { if (e.target.id === "modal-wrap") closeModal(); });

    document.body.addEventListener("click", function (e) {
      var el = e.target.closest("[data-action]");
      if (!el) {
        // close open filter pops if clicking elsewhere
        document.querySelectorAll(".filter-pop").forEach(function (p) { p.classList.add("hidden"); });
        return;
      }
      var action = el.getAttribute("data-action");
      handleAction(action, el, e);
    });

    document.body.addEventListener("change", function (e) {
      handleFieldChange(e);
    });
    document.body.addEventListener("blur", function (e) {
      handleFieldChange(e);
    }, true);

    document.body.addEventListener("input", function (e) {
      if (e.target.id === "company-search") { state.companyFilter = e.target.value; renderIfMatches("companies"); }
      if (e.target.id === "contact-search") { state.contactFilter = e.target.value; renderIfMatches("contacts"); }
    });
  }
  var debouncedFilterInput = debounce(function () { renderView(); }, 250);
  function renderIfMatches(view) {
    if (state.view !== view) return;
    debouncedFilterInput();
  }

  function handleFieldChange(e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    // opportunity fields
    if (t.matches("[data-field]") && document.getElementById("drawer-content").contains(t)) {
      var o = activeDrawerOpp;
      if (!o) return;
      var key = t.getAttribute("data-field");
      o[key] = t.value;
      saveDB();
      if (key === "status" || key === "priority" || key === "companyId" || key === "contactId") renderDrawer(o);
    }
    if (t.matches("[data-multi]") && document.getElementById("drawer-content").contains(t)) {
      var o2 = activeDrawerOpp;
      if (!o2) return;
      var field = t.getAttribute("data-multi");
      o2[field] = o2[field] || [];
      var v = t.value;
      var idx = o2[field].indexOf(v);
      if (t.checked && idx === -1) o2[field].push(v);
      if (!t.checked && idx !== -1) o2[field].splice(idx, 1);
      saveDB();
    }
    // company fields
    if (t.matches("[data-cfield]")) {
      var c = activeDrawerCompany;
      if (!c) return;
      var ck = t.getAttribute("data-cfield");
      c[ck] = ck === "bCorp" ? t.value === "true" : t.value;
      saveDB();
    }
    // contact fields
    if (t.matches("[data-pfield]")) {
      var p = activeDrawerContact;
      if (!p) return;
      var pk = t.getAttribute("data-pfield");
      p[pk] = t.value;
      saveDB();
    }
  }

  var activeDrawerOpp = null;
  var activeDrawerCompany = null;
  var activeDrawerContact = null;

  function handleAction(action, el, e) {
    var id = el.getAttribute("data-id");
    switch (action) {
      case "nav": setView(el.getAttribute("data-view")); break;
      case "open-quick-add": openQuickAdd(); break;
      case "close-modal": closeModal(); break;
      case "close-drawer": closeDrawer(); break;
      case "open-opp":
        activeDrawerOpp = getOpportunity(id); activeDrawerCompany = null; activeDrawerContact = null;
        openOpportunityDrawer(id);
        break;
      case "open-company":
        activeDrawerCompany = getCompany(id); activeDrawerOpp = null; activeDrawerContact = null;
        openCompanyDrawer(id);
        break;
      case "open-contact":
        activeDrawerContact = getContact(id); activeDrawerOpp = null; activeDrawerCompany = null;
        openContactDrawer(id);
        break;
      case "open-add-company": openAddCompanyModal(); break;
      case "open-add-contact": openAddContactModal(); break;
      case "open-add-task": openAddTaskModal(); break;
      case "add-task-for-opp": openAddTaskModal({ opportunityId: id }); break;
      case "delete-opp":
        if (confirm("Delete this opportunity? This cannot be undone.")) {
          DB.opportunities = DB.opportunities.filter(function (o) { return o.id !== id; });
          DB.activities = DB.activities.filter(function (a) { return a.opportunityId !== id; });
          saveDB(); closeDrawer(); toast("Opportunity deleted");
        }
        break;
      case "delete-company":
        if (confirm("Delete this company? Related opportunities and contacts will keep their data but lose the link.")) {
          DB.companies = DB.companies.filter(function (c) { return c.id !== id; });
          saveDB(); closeDrawer(); toast("Company deleted");
        }
        break;
      case "delete-contact":
        if (confirm("Delete this contact?")) {
          DB.contacts = DB.contacts.filter(function (c) { return c.id !== id; });
          saveDB(); closeDrawer(); toast("Contact deleted");
        }
        break;
      case "mark-contacted":
        var p = getContact(id);
        if (p) { p.lastContact = todayISO(); saveDB(); openContactDrawer(id); toast("Marked as contacted today"); }
        break;
      case "delete-task":
        DB.tasks = DB.tasks.filter(function (t) { return t.id !== id; });
        saveDB(); renderView(); toast("Task removed");
        break;
      case "toggle-task":
        var task = DB.tasks.find(function (t) { return t.id === id; });
        if (task) { task.completed = !task.completed; saveDB(); renderView(); toast(task.completed ? "Task completed" : "Task reopened"); }
        break;
      case "task-filter": state.taskFilter = el.getAttribute("data-filter"); renderView(); break;
      case "add-activity": addActivityFromDrawer(); break;
      case "saved-view": applySavedView(el.getAttribute("data-name")); break;
      case "clear-filters": clearFilters(); renderView(); break;
      case "opp-view": state.oppView = el.getAttribute("data-mode"); renderView(); break;
      case "toggle-filter-pop": toggleFilterPop(el); break;
      case "metric-click": handleMetricClick(el.getAttribute("data-metric")); break;
      case "attn-click": handleAttnClick(el.getAttribute("data-target")); break;
      case "export-json": exportJSON(); break;
      case "export-csv": exportCSV(); break;
      case "load-sample": loadSample(); break;
      case "reset-all": resetAll(); break;
      case "import-merge": break; // handled inline
      case "import-replace": break; // handled inline
      default: break;
    }
    if (action !== "toggle-filter-pop") {
      document.querySelectorAll(".filter-pop").forEach(function (p) { p.classList.add("hidden"); });
    }
    e.stopPropagation();
  }

  function addActivityFromDrawer() {
    var o = activeDrawerOpp;
    if (!o) return;
    var type = document.getElementById("new-act-type").value;
    var note = document.getElementById("new-act-note").value.trim();
    logActivity(o.id, type, note);
    saveDB();
    document.getElementById("new-act-note").value = "";
    document.querySelector('.timeline').innerHTML = renderTimelineItems(o.id);
    toast("Activity logged");
  }

  function toggleFilterPop(btn) {
    var key = btn.getAttribute("data-key");
    var pop = document.querySelector('[data-pop="' + key + '"]');
    var wasHidden = pop.classList.contains("hidden");
    document.querySelectorAll(".filter-pop").forEach(function (p) { p.classList.add("hidden"); });
    if (wasHidden) pop.classList.remove("hidden");
  }

  document.addEventListener("change", function (e) {
    if (e.target.matches("[data-action='filter-check']")) {
      var key = e.target.getAttribute("data-key");
      var v = e.target.value;
      var arr = state.filters[key];
      var idx = arr.indexOf(v);
      if (e.target.checked && idx === -1) arr.push(v);
      if (!e.target.checked && idx !== -1) arr.splice(idx, 1);
      state.savedView = null;
      renderView();
      // re-open the popover after re-render since it wipes DOM
      var btn = document.querySelector('[data-action="toggle-filter-pop"][data-key="' + key + '"]');
      if (btn) {
        var pop = document.querySelector('[data-pop="' + key + '"]');
        pop.classList.remove("hidden");
      }
    }
  });

  document.addEventListener("change", function (e) {
    if (e.target.id === "import-file" && e.target.files && e.target.files[0]) {
      handleImportFile(e.target.files[0]);
    }
  });

  function handleMetricClick(metric) {
    clearFilters();
    if (metric === "active") state.filters.status = D.STATUSES.slice();
    else if (metric === "applied") state.filters.status = ["Applied", "Conversation", "Interview", "Negotiating", "Offer", "Accepted"];
    else if (metric === "followup") { state.savedView = "followup"; }
    else if (metric === "conversation") state.filters.status = ["Conversation", "Interview"];
    else if (metric === "offer") state.filters.status = ["Offer"];
    else if (metric === "closed") state.filters.status = ["Rejected", "Withdrawn", "Archived"];
    else if (metric === "consulting") state.filters.type = ["Consulting", "Fractional", "Direct Client"];
    setView("opportunities");
  }

  function handleAttnClick(target) {
    var parts = target.split(":");
    if (parts[0] === "opp") openOpportunityDrawerFromAnywhere(parts[1]);
    else if (parts[0] === "contact") { activeDrawerContact = getContact(parts[1]); activeDrawerOpp = null; activeDrawerCompany = null; openContactDrawer(parts[1]); }
  }
  function openOpportunityDrawerFromAnywhere(id) {
    activeDrawerOpp = getOpportunity(id); activeDrawerCompany = null; activeDrawerContact = null;
    openOpportunityDrawer(id);
  }

  /* ================= INIT ================= */
  function init() {
    DB = loadDB();
    wireGlobalEvents();
    setView("dashboard");
  }

  document.addEventListener("DOMContentLoaded", init);
})();

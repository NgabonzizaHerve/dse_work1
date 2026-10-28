(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* =========================================================
     ROUTING  — Dashboard is built; every other page is blank
     ========================================================= */
  var pageDash = $('#page-dashboard');
  var pageBlank = $('#page-blank');
  var titles = {
    'dashboard': 'HR Insight Dashboard',
    'employee-directory': 'Employee Directory',
    'attendance': 'Attendance',
    'employee-performance': 'Employee Performance',
    'leave-management': 'Leave Management',
    'payroll': 'Payroll',
    'recruitment': 'Recruitment',
    'onboarding': 'Onboarding',
    'development': 'Development',
    'help-center': 'Help Center',
    'settings': 'Settings',
    'sign-out': 'Sign Out'
  };

  function route() {
    var page = (location.hash || '#dashboard').slice(1);
    if (!titles[page]) page = 'dashboard';
    var isDash = page === 'dashboard';
    pageDash.hidden = !isDash;
    pageBlank.hidden = isDash;
    $$('.nav-item').forEach(function (a) {
      a.classList.toggle('active', a.dataset.page === page && page !== 'sign-out');
    });
    document.title = titles[page] + ' · Nonsense Studio';
    $('.main').scrollTop = 0;
    if (isDash) { drawChart(); }
  }
  window.addEventListener('hashchange', route);

  // ⌘K / Ctrl+K focuses the search field
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      $('#searchInput').focus();
    }
  });

  /* =========================================================
     TEAM PERFORMANCE CHART
     ========================================================= */
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DATA = {
    yearly: {
      labels: MONTHS,
      project: [29, 32, 27, 30, 36, 33, 31, 36, 38, 36, 40, 46],
      product: [18, 14, 13, 15, 22, 25, 20, 23, 24, 21, 17, 27],
      title: function (i) { return MONTHS[i] + ', 2025'; },
      def: 8
    },
    monthly: {
      labels: ['1','4','7','10','13','16','19','22','25','28','30'],
      project: [31, 33, 30, 34, 36, 35, 38, 37, 40, 39, 42],
      product: [19, 21, 18, 22, 24, 23, 26, 25, 27, 26, 29],
      title: function (i) { return 'Oct ' + this.labels[i] + ', 2026'; },
      def: 6
    }
  };
  var mode = 'yearly';
  var activeIdx = DATA[mode].def;
  var COL_PROJECT = '#5b4fd6', COL_PRODUCT = '#f59a4e';
  var Y_MIN = 10, Y_MAX = 50;

  function smooth(pts) {
    var d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + p2[0] + ',' + p2[1];
    }
    return d;
  }

  function drawChart() {
    var box = $('#chart');
    if (!box || pageDash.hidden) return;
    var W = box.clientWidth, H = box.clientHeight;
    if (!W || !H) return;
    var D = DATA[mode], n = D.labels.length;
    var pad = { l: 40, r: 10, t: 12, b: 30 };
    var x0 = pad.l + 12, x1 = W - pad.r;
    var X = function (i) { return x0 + i * (x1 - x0) / (n - 1); };
    var Y = function (v) { return pad.t + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * (H - pad.t - pad.b); };
    var base = H - pad.b;

    var pp = D.project.map(function (v, i) { return [X(i), Y(v)]; });
    var qp = D.product.map(function (v, i) { return [X(i), Y(v)]; });
    var pLine = smooth(pp), qLine = smooth(qp);
    var pArea = pLine + ' L' + X(n - 1) + ',' + base + ' L' + X(0) + ',' + base + ' Z';
    var qArea = qLine + ' L' + X(n - 1) + ',' + base + ' L' + X(0) + ',' + base + ' Z';

    var s = '<svg id="chartSvg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">';
    s += '<defs>' +
      '<linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + COL_PROJECT + '" stop-opacity=".16"/><stop offset="1" stop-color="' + COL_PROJECT + '" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="gQ" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + COL_PRODUCT + '" stop-opacity=".14"/><stop offset="1" stop-color="' + COL_PRODUCT + '" stop-opacity="0"/></linearGradient></defs>';

    // y labels
    for (var v = 10; v <= 50; v += 10) {
      s += '<text x="' + (pad.l - 12) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + 'K</text>';
    }
    // x labels
    for (var i = 0; i < n; i++) {
      s += '<text x="' + X(i) + '" y="' + (H - 6) + '" text-anchor="middle"' + (i === activeIdx ? ' style="fill:#16161d;font-weight:600"' : '') + '>' + D.labels[i] + '</text>';
    }
    s += '<path d="' + qArea + '" fill="url(#gQ)"/>';
    s += '<path d="' + pArea + '" fill="url(#gP)"/>';
    s += '<path d="' + qLine + '" fill="none" stroke="' + COL_PRODUCT + '" stroke-width="2" stroke-linecap="round"/>';
    s += '<path d="' + pLine + '" fill="none" stroke="' + COL_PROJECT + '" stroke-width="2" stroke-linecap="round"/>';
    s += '<g id="marker">' +
      '<line id="mLine" y1="' + pad.t + '" y2="' + base + '" stroke="#c9c9d6" stroke-dasharray="4 4"/>' +
      '<circle id="mP" r="4" fill="#fff" stroke="' + COL_PROJECT + '" stroke-width="2"/>' +
      '<circle id="mQ" r="4" fill="#fff" stroke="' + COL_PRODUCT + '" stroke-width="2"/></g>';
    s += '<rect id="hit" x="0" y="0" width="' + W + '" height="' + H + '" fill="transparent"/>';
    s += '</svg><div class="chart-tip" id="chartTip"></div>';
    box.innerHTML = s;

    var svg = $('#chartSvg'), tip = $('#chartTip');

    function setActive(i) {
      activeIdx = i;
      var x = X(i);
      var mL = $('#mLine'); mL.setAttribute('x1', x); mL.setAttribute('x2', x);
      var mP = $('#mP'); mP.setAttribute('cx', x); mP.setAttribute('cy', Y(D.project[i]));
      var mQ = $('#mQ'); mQ.setAttribute('cx', x); mQ.setAttribute('cy', Y(D.product[i]));
      tip.innerHTML = '<b>' + D.title(i) + '</b>' +
        '<div><i class="dot dot-project"></i>Project Team<strong>' + D.project[i] + 'K</strong></div>' +
        '<div><i class="dot dot-product"></i>Product Team<strong>' + D.product[i] + 'K</strong></div>';
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var left = x + 14, top = Math.min(Y(D.project[i]), Y(D.product[i])) - th - 6;
      if (left + tw > W) left = x - tw - 14;
      if (top < 0) top = 4;
      tip.style.left = left + 'px'; tip.style.top = top + 'px';
      $$('text', svg).forEach(function (t) { /* highlight active x label */ });
      var xl = $$('text', svg).slice(5);
      xl.forEach(function (t, k) {
        if (k === i) { t.style.fill = '#16161d'; t.style.fontWeight = '600'; }
        else { t.style.fill = ''; t.style.fontWeight = ''; }
      });
    }

    function idxFromEvent(e) {
      var r = svg.getBoundingClientRect();
      var px = (e.clientX - r.left) * (W / r.width);
      var i = Math.round((px - x0) / ((x1 - x0) / (n - 1)));
      return Math.max(0, Math.min(n - 1, i));
    }
    var hit = $('#hit');
    hit.addEventListener('pointermove', function (e) { setActive(idxFromEvent(e)); });
    hit.addEventListener('pointerdown', function (e) { setActive(idxFromEvent(e)); });
    hit.addEventListener('pointerleave', function () { setActive(D.def); });

    setActive(activeIdx);
  }

  $$('.seg button').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.dataset.mode;
      activeIdx = DATA[mode].def;
      $$('.seg button').forEach(function (x) { x.classList.toggle('active', x === b); });
      drawChart();
    });
  });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(drawChart, 60); });

  /* =========================================================
     ATTENDANCE HEATMAP
     ========================================================= */
  (function buildHeatmap() {
    var times = ['11:00','10:30','10:00','09:30','09:00','08:30'];
    var days = ['Mon','Tue','Wed','Thu','Fri'];
    var full = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday' };
    var level = [
      [.10,.10,.10,.10,.10],
      [.14,.14,.16,.14,.14],
      [.18,.32,.46,.32,.30],
      [.32,.52,.68,.52,.38],
      [.66,.76,.78,.72,.70],
      [1,1,1,1,1]
    ];
    var h = '';
    times.forEach(function (t, r) {
      h += '<div class="tl">' + t + '</div>';
      days.forEach(function (d, c) {
        var v = level[r][c];
        h += '<div class="cell" style="opacity:' + (0.12 + v * 0.88).toFixed(2) + '" title="' + full[d] + ' · ' + t + ' · ' + Math.round(v * 272) + ' employees checked in"></div>';
      });
    });
    h += '<div></div>';
    days.forEach(function (d) { h += '<div class="dl">' + d + '</div>'; });
    $('#heatmap').innerHTML = h;
  })();

  /* =========================================================
     EMPLOYEES TABLE
     ========================================================= */
  var EMP = [
    ['#FR01890','Cooper Herwitz','cooper@mail.com','Jr. Developer','IT','Active'],
    ['#FR01728','Kierra Gouse','kierra@mail.com','UI Designer','Creative','Active'],
    ['#FR01653','Cheyenne Franci','cheyennefci@mail.com','Development','HR','Active'],
    ['#FR01832','Charlie Saris','charliesar@mail.com','Media Social','Marketing','Active'],
    ['#FR01728','Lindsey Mango','lindsey@mail.com','Product Designer','Creative','Active']
  ];
  $('#employeeRows').innerHTML = EMP.map(function (e) {
    return '<tr><td class="c-check"><label class="check"><input type="checkbox" class="rowCheck"><span></span></label></td>' +
      '<td>' + e[0] + '</td><td class="name">' + e[1] + '</td><td>' + e[2] + '</td><td>' + e[3] + '</td><td>' + e[4] + '</td><td class="status">' + e[5] + '</td></tr>';
  }).join('');

  var checkAll = $('#checkAll');
  function syncAll() {
    var rows = $$('.rowCheck'), on = rows.filter(function (r) { return r.checked; }).length;
    checkAll.checked = on === rows.length;
    checkAll.indeterminate = on > 0 && on < rows.length;
  }
  checkAll.addEventListener('change', function () {
    $$('.rowCheck').forEach(function (r) { r.checked = checkAll.checked; });
    checkAll.indeterminate = false;
  });
  $$('.rowCheck').forEach(function (r) { r.addEventListener('change', syncAll); });

  /* =========================================================
     JOBS OVERVIEW GAUGE
     ========================================================= */
  (function buildGauge() {
    var JOBS = [
      { n: 46, label: 'Active Jobs',     color: '#7b57ee' },
      { n: 18, label: 'In Reviews Jobs', color: '#f59a4e' },
      { n: 8,  label: 'Finish Jobs',     color: '#3fcf79' }
    ];
    var total = JOBS.reduce(function (a, j) { return a + j.n; }, 0);
    var cx = 120, cy = 118, r = 96, sw = 26;
    var capDeg = (sw / 2) / r * 180 / Math.PI;   // angle eaten by a round cap
    var gap = 1.6;
    var pt = function (deg) {
      var a = deg * Math.PI / 180;
      return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
    };
    var svg = '<svg viewBox="0 0 240 128">';
    var ang = 180;
    JOBS.forEach(function (j, i) {
      var span = j.n / total * 180;
      var a0 = ang - capDeg - gap, a1 = ang - span + capDeg + gap;
      if (a1 > a0) { a1 = a0 = (a0 + a1) / 2; }
      var p0 = pt(a0), p1 = pt(a1);
      svg += '<path class="seg-arc" data-i="' + i + '" d="M' + p0[0].toFixed(2) + ',' + p0[1].toFixed(2) +
        ' A' + r + ',' + r + ' 0 0 1 ' + p1[0].toFixed(2) + ',' + p1[1].toFixed(2) +
        '" fill="none" stroke="' + j.color + '" stroke-width="' + sw + '" stroke-linecap="round"/>';
      ang -= span;
    });
    svg += '</svg><div class="gauge-center"><strong>' + total + '</strong><span>Total Jobs</span></div>';
    $('#gauge').innerHTML = svg;

    $('#jobList').innerHTML = JOBS.map(function (j, i) {
      return '<li data-i="' + i + '"><i class="dot" style="background:' + j.color + '"></i><strong>' + j.n + '</strong><span>' + j.label + '</span></li>';
    }).join('');

    function hl(i) {
      $$('.seg-arc').forEach(function (p) { p.style.opacity = (i === null || +p.dataset.i === i) ? 1 : .35; });
      $$('#jobList li').forEach(function (li) { li.classList.toggle('hl', i !== null && +li.dataset.i === i); });
    }
    $$('.seg-arc, #jobList li').forEach(function (el) {
      el.addEventListener('mouseenter', function () { hl(+el.dataset.i); });
      el.addEventListener('mouseleave', function () { hl(null); });
    });
  })();

  /* ---------- init ---------- */
  route();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawChart);
})();

/* Kết nối giao diện với store và khung nhìn bản đồ. */
(function (global) {
  'use strict';

  var CFG = global.VSKHConfig;
  var Icons = global.VSKHIcons;
  var SU = global.VSKHStore;
  var D = CFG.DEFAULTS;

  var $ = function (id) { return document.getElementById(id); };
  var store = new SU.Store();
  var board = null;
  var session = null;
  var toastTimer = null;

  /* ---------- Tiện ích ---------- */

  function toast(msg, kind) {
    var el = $('toast');
    el.textContent = msg;
    el.className = 'toast' + (kind ? ' toast-' + kind : '');
    el.hidden = false;
    global.clearTimeout(toastTimer);
    toastTimer = global.setTimeout(function () { el.hidden = true; }, 2600);
  }

  function setStatus(text, kind) {
    $('status-text').textContent = text;
    $('status-dot').dataset.kind = kind || 'ok';
  }

  function isLeader() { return session && session.role === 'leader'; }

  /* ---------- Đăng nhập ---------- */

  function readSession() {
    try {
      var raw = global.localStorage.getItem(D.sessionKey);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (s && typeof s.name === 'string' && (s.role === 'leader' || s.role === 'member')) return s;
    } catch (err) { /* bỏ qua phiên hỏng */ }
    return null;
  }

  function initLogin() {
    var form = $('login-form');
    var codeField = $('code-field');

    form.addEventListener('change', function () {
      var role = form.querySelector('input[name="role"]:checked').value;
      codeField.hidden = role !== 'leader';
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = $('login-name').value.trim();
      var role = form.querySelector('input[name="role"]:checked').value;
      var err = $('login-error');

      if (!name) { err.textContent = 'Vui lòng nhập tên hiển thị.'; err.hidden = false; return; }
      if (role === 'leader' && $('login-code').value.trim() !== D.leaderCode) {
        err.textContent = 'Mã chỉ huy không đúng.';
        err.hidden = false;
        return;
      }
      err.hidden = true;
      session = { name: name, role: role, at: Date.now() };
      try { global.localStorage.setItem(D.sessionKey, JSON.stringify(session)); } catch (e) { /* ignore */ }
      startApp();
    });

    var saved = readSession();
    if (saved) { session = saved; startApp(); }
  }

  function logout() {
    try { global.localStorage.removeItem(D.sessionKey); } catch (e) { /* ignore */ }
    session = null;
    $('app').hidden = true;
    $('login-screen').hidden = false;
    $('login-code').value = '';
  }

  /* ---------- Bảng chọn icon ---------- */

  var currentSide = 'red';

  function buildSideChips() {
    var wrap = $('side-group');
    wrap.innerHTML = '';
    CFG.SIDES.forEach(function (sd) {
      var b = document.createElement('button');
      b.className = 'chip' + (sd.id === currentSide ? ' is-active' : '');
      b.dataset.side = sd.id;
      b.innerHTML = '<i style="background:' + sd.color + '"></i>' + sd.label;
      b.addEventListener('click', function () {
        currentSide = sd.id;
        buildSideChips();
        buildPalette();
        if (board) board.pendingSide = currentSide;
      });
      wrap.appendChild(b);
    });
  }

  function buildPalette() {
    var wrap = $('palette');
    wrap.innerHTML = '';
    CFG.groups().forEach(function (g) {
      var block = document.createElement('div');
      block.className = 'panel-block';
      var h = document.createElement('div');
      h.className = 'rule';
      h.innerHTML = '<span></span>';
      h.firstChild.textContent = g.name;
      block.appendChild(h);

      var grid = document.createElement('div');
      grid.className = 'icon-grid';
      g.items.forEach(function (icon) {
        var tile = document.createElement('button');
        tile.className = 'icon-tile';
        tile.dataset.icon = icon.id;
        tile.draggable = true;
        tile.innerHTML = Icons.paletteSvg(icon, currentSide) + '<span>' + icon.label + '</span>';
        tile.addEventListener('click', function () {
          if (!isLeader()) { toast('Chế độ chỉ xem — không thể chỉnh sửa.', 'warn'); return; }
          var next = board.pendingIcon === icon.id ? null : icon.id;
          board.setPending(next, currentSide);
          markPending();
          /* Trên màn hình nhỏ, thu bảng lại để người dùng chạm vào bản đồ. */
          if (next && global.innerWidth <= 900) {
            document.body.classList.add('sidebar-hidden');
            toast('Chạm lên bản đồ để cắm "' + icon.label + '".');
          }
        });
        tile.addEventListener('dragstart', function (ev) {
          if (!isLeader()) { ev.preventDefault(); return; }
          ev.dataTransfer.setData('text/plain', icon.id + '|' + currentSide);
          ev.dataTransfer.effectAllowed = 'copy';
        });
        grid.appendChild(tile);
      });
      block.appendChild(grid);
      wrap.appendChild(block);
    });
    markPending();
  }

  function markPending() {
    var id = board ? board.pendingIcon : null;
    Array.prototype.forEach.call(document.querySelectorAll('.icon-tile'), function (t) {
      t.classList.toggle('is-active', t.dataset.icon === id);
    });
  }

  /* ---------- Thanh công cụ ---------- */

  function buildToolbar() {
    var colors = $('color-group');
    colors.innerHTML = '';
    CFG.PEN_COLORS.forEach(function (c, i) {
      var b = document.createElement('button');
      b.className = 'chip' + (i === 0 ? ' is-active' : '');
      b.dataset.color = c.id;
      b.innerHTML = '<i style="background:' + c.color + '"></i>' + c.label;
      b.addEventListener('click', function () {
        board.setPen({ color: c.id });
        Array.prototype.forEach.call(colors.children, function (x) {
          x.classList.toggle('is-active', x === b);
        });
      });
      colors.appendChild(b);
    });

    var widths = $('width-group');
    widths.innerHTML = '';
    CFG.PEN_WIDTHS.forEach(function (w) {
      var b = document.createElement('button');
      b.className = 'seg-btn' + (w.id === 'medium' ? ' is-active' : '');
      b.dataset.width = w.id;
      b.textContent = w.label;
      b.addEventListener('click', function () {
        board.setPen({ width: w.id });
        Array.prototype.forEach.call(widths.children, function (x) {
          x.classList.toggle('is-active', x === b);
        });
      });
      widths.appendChild(b);
    });

    Array.prototype.forEach.call($('mode-group').children, function (btn) {
      btn.addEventListener('click', function () { setMode(btn.dataset.mode); });
    });

    Array.prototype.forEach.call($('tool-group').children, function (btn) {
      btn.addEventListener('click', function () {
        board.setPen({ tool: btn.dataset.tool });
        Array.prototype.forEach.call($('tool-group').children, function (x) {
          x.classList.toggle('is-active', x === btn);
        });
      });
    });
  }

  function setMode(mode) {
    board.setMode(mode);
    if (mode !== 'select') { board.setPending(null); markPending(); }
    Array.prototype.forEach.call($('mode-group').children, function (b) {
      b.classList.toggle('is-active', b.dataset.mode === mode);
    });
    $('pen-tools').hidden = mode !== 'draw';
    $('pen-sep').hidden = mode !== 'draw';
  }

  /* ---------- Bảng thuộc tính ký hiệu ---------- */

  function renderMarkerSideChips(marker) {
    var wrap = $('marker-side-group');
    wrap.innerHTML = '';
    CFG.SIDES.forEach(function (sd) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (sd.id === marker.side ? ' is-active' : '');
      b.innerHTML = '<i style="background:' + sd.color + '"></i>' + sd.label;
      b.addEventListener('click', function () { updateSelected({ side: sd.id }); });
      wrap.appendChild(b);
    });
  }

  function renderInspector(marker) {
    var box = $('inspector');
    if (!marker || !isLeader()) { box.hidden = true; return; }
    box.hidden = false;
    renderMarkerSideChips(marker);

    var icon = CFG.icon(marker.icon);
    var sd = CFG.side(marker.side);
    var token = $('inspector-token');
    token.innerHTML = Icons.paletteSvg(icon, marker.side);
    token.style.borderColor = sd.color;
    token.style.background = 'rgba(0,0,0,.25)';
    $('inspector-name').textContent = icon.label;
    $('inspector-sub').textContent = sd.label + ' · ' + Math.round((marker.scale || 1) * 100) + '%';

    $('marker-label').value = marker.label || '';
    $('marker-label').placeholder = CFG.icon(marker.icon).label;
    var pct = Math.round((marker.scale || 1) * 100);
    $('marker-scale').value = pct;
    $('marker-scale-val').textContent = pct + '%';
  }

  function updateSelected(patch) {
    var id = board.selectedId;
    if (!id || !isLeader()) return;
    store.update(function (st) {
      st.markers.forEach(function (m) { if (m.id === id) Object.assign(m, patch); });
    }, 'marker-edit');
    if (patch.side) renderMarkerSideChips(board.findMarker(id));
  }

  function bindInspector() {
    $('marker-label').addEventListener('input', function () {
      updateSelected({ label: this.value.slice(0, 40) });
    });
    $('marker-scale').addEventListener('input', function () {
      $('marker-scale-val').textContent = this.value + '%';
      var m = board.selectedId && board.findMarker(board.selectedId);
      if (m) $('inspector-sub').textContent = CFG.side(m.side).label + ' · ' + this.value + '%';
      updateSelected({ scale: Number(this.value) / 100 });
    });
    $('btn-delete-marker').addEventListener('click', function () {
      if (board.selectedId) board.removeMarker(board.selectedId);
    });
    $('btn-duplicate').addEventListener('click', function () {
      var m = board.selectedId && board.findMarker(board.selectedId);
      if (!m) return;
      var copy = SU.clone(m);
      copy.id = SU.uid('mk');
      copy.x = Math.min(1, copy.x + 0.03);
      copy.y = Math.min(1, copy.y + 0.03);
      store.update(function (st) { st.markers.push(copy); }, 'marker-duplicate');
      board.select(copy.id);
    });
  }

  /* ---------- Bản đồ nền ---------- */

  function measureImage(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve({
          width: img.naturalWidth || D.mapWidth,
          height: img.naturalHeight || D.mapHeight
        });
      };
      img.onerror = function () { reject(new Error('Không tải được ảnh bản đồ.')); };
      img.src = url;
    });
  }

  function setMap(url, name) {
    return measureImage(url).then(function (dim) {
      store.update(function (st) {
        st.map = { url: url, width: dim.width, height: dim.height, name: name };
      }, 'map-change');
      board.render();
      board.fit();
      $('map-name').textContent = name;
      toast('Đã đổi bản đồ: ' + name);
    });
  }

  function bindMapControls() {
    $('map-file').addEventListener('change', function () {
      var file = this.files && this.files[0];
      this.value = '';
      if (!file) return;
      if (file.size > 6 * 1024 * 1024) {
        toast('Ảnh lớn hơn 6MB có thể không lưu được vào bộ nhớ trình duyệt.', 'warn');
      }
      var reader = new FileReader();
      reader.onload = function () {
        setMap(String(reader.result), file.name).catch(function (err) { toast(err.message, 'error'); });
      };
      reader.readAsDataURL(file);
    });

    $('btn-map-url').addEventListener('click', function () {
      var url = global.prompt('Dán URL ảnh bản đồ (http/https):', '');
      if (!url) return;
      if (!/^https?:\/\//i.test(url)) { toast('URL phải bắt đầu bằng http:// hoặc https://', 'error'); return; }
      setMap(url.trim(), 'Bản đồ từ URL').catch(function () {
        toast('Không tải được ảnh từ URL này.', 'error');
      });
    });

    $('btn-map-reset').addEventListener('click', function () {
      setMap(D.mapUrl, D.mapName).catch(function (err) { toast(err.message, 'error'); });
    });
  }

  /* ---------- Xuất / nhập ---------- */

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    global.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function stamp() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  }

  function bindPlanControls() {
    $('btn-export-json').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(store.state, null, 2)], { type: 'application/json' });
      download(blob, 'vskh-tactical-' + stamp() + '.json');
      toast('Đã xuất file kế hoạch.');
    });

    $('import-json').addEventListener('change', function () {
      var file = this.files && this.files[0];
      this.value = '';
      if (!file) return;
      if (!isLeader()) { toast('Chế độ chỉ xem — không thể nhập kế hoạch.', 'warn'); return; }
      var reader = new FileReader();
      reader.onload = function () {
        try {
          store.replace(JSON.parse(String(reader.result)), 'import');
          board.render();
          board.fit();
          toast('Đã nhập kế hoạch.');
        } catch (err) {
          toast('File không hợp lệ.', 'error');
        }
      };
      reader.readAsText(file);
    });

    $('btn-export-png').addEventListener('click', function () {
      /* Trình duyệt cấm đọc canvas có ảnh file:// nên xuất PNG chỉ chạy qua http. */
      if (location.protocol === 'file:') {
        toast('Xuất PNG cần mở trang qua http:// (vd: python3 -m http.server) — mở file trực tiếp thì trình duyệt chặn đọc ảnh nền.', 'warn');
        return;
      }
      setStatus('Đang dựng ảnh…', 'busy');
      board.exportPng().then(function (canvas) {
        canvas.toBlob(function (blob) {
          if (!blob) { toast('Không tạo được ảnh.', 'error'); setStatus('Sẵn sàng'); return; }
          download(blob, 'vskh-tactical-' + stamp() + '.png');
          setStatus('Sẵn sàng');
          toast('Đã xuất ảnh PNG.');
        }, 'image/png');
      }).catch(function (err) {
        setStatus('Sẵn sàng');
        /* Ảnh từ domain khác không cho phép đọc canvas. */
        toast('Không xuất được ảnh: ảnh nền không cho phép đọc (CORS). Hãy dùng ảnh cùng domain hoặc tải ảnh lên từ máy.', 'error');
      });
    });

    $('btn-share').addEventListener('click', function () {
      var payload = SU.clone(store.state);
      if (/^data:/.test(payload.map.url)) {
        payload.map = { url: D.mapUrl, width: D.mapWidth, height: D.mapHeight, name: D.mapName };
        toast('Ảnh tải lên không kèm được trong link — link dùng bản đồ mặc định.', 'warn');
      }
      var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      var link = location.origin + location.pathname + '#plan=' + encoded;
      if (link.length > 30000) { toast('Kế hoạch quá lớn để tạo link. Hãy xuất file .json.', 'error'); return; }
      var copy = global.navigator.clipboard && global.navigator.clipboard.writeText(link);
      if (copy && copy.then) {
        copy.then(function () { toast('Đã sao chép link chia sẻ.'); },
                  function () { global.prompt('Sao chép link:', link); });
      } else {
        global.prompt('Sao chép link:', link);
      }
    });
  }

  function loadFromHash() {
    var m = /#plan=(.+)$/.exec(location.hash);
    if (!m) return false;
    try {
      var json = decodeURIComponent(escape(atob(m[1])));
      store.replace(JSON.parse(json), 'share-link');
      toast('Đã mở kế hoạch từ link chia sẻ.');
      return true;
    } catch (err) {
      toast('Link chia sẻ không hợp lệ.', 'error');
      return false;
    }
  }

  /* ---------- Xoá hàng loạt ---------- */

  function bindClearControls() {
    function guard(fn) {
      return function () {
        if (!isLeader()) { toast('Chế độ chỉ xem — không thể chỉnh sửa.', 'warn'); return; }
        fn();
      };
    }
    $('btn-clear-strokes').addEventListener('click', guard(function () {
      if (!store.state.strokes.length) return;
      store.update(function (st) { st.strokes = []; }, 'clear-strokes');
      toast('Đã xoá toàn bộ nét vẽ. Ctrl+Z để hoàn tác.');
    }));
    $('btn-clear-markers').addEventListener('click', guard(function () {
      if (!store.state.markers.length) return;
      store.update(function (st) { st.markers = []; }, 'clear-markers');
      toast('Đã xoá toàn bộ ký hiệu. Ctrl+Z để hoàn tác.');
    }));
    $('btn-clear-all').addEventListener('click', guard(function () {
      if (!global.confirm('Xoá toàn bộ ký hiệu và nét vẽ trên bản đồ?')) return;
      store.update(function (st) { st.markers = []; st.strokes = []; }, 'clear-all');
      toast('Đã xoá tất cả. Ctrl+Z để hoàn tác.');
    }));
  }

  /* ---------- Chú giải ---------- */

  function renderLegend() {
    var counts = {};
    store.state.markers.forEach(function (m) { counts[m.side] = (counts[m.side] || 0) + 1; });
    var html = CFG.SIDES.filter(function (sd) { return counts[sd.id]; }).map(function (sd) {
      return '<span><i style="background:' + sd.color + '"></i>' + sd.label + ': <b>' + counts[sd.id] + '</b></span>';
    }).join('');
    var el = $('legend');
    el.innerHTML = html;
    el.hidden = !html;
  }

  /* ---------- Phím tắt ---------- */

  function bindKeys() {
    global.addEventListener('keydown', function (ev) {
      var t = ev.target;
      var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (typing) return;

      var mod = ev.ctrlKey || ev.metaKey;
      if (mod && ev.key.toLowerCase() === 'z') {
        ev.preventDefault();
        var ok = ev.shiftKey ? store.redo() : store.undo();
        if (ok) { board.render(); toast(ev.shiftKey ? 'Đã làm lại.' : 'Đã hoàn tác.'); }
        return;
      }
      if (mod) return;

      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        if (board.selectedId) { ev.preventDefault(); board.removeMarker(board.selectedId); }
        return;
      }
      if (ev.key === 'Escape') { board.setPending(null); markPending(); board.select(null); return; }
      if (ev.key === '1') setMode('select');
      if (ev.key === '2') setMode('draw');
      if (ev.key === '3') setMode('pan');
      if (ev.key === 'f' || ev.key === 'F') board.fit();
    });
  }

  /* ---------- Khởi động ---------- */

  function applyRole() {
    var leader = isLeader();
    document.body.classList.toggle('is-viewer', !leader);
    board.editable = leader;
    $('user-name').textContent = session.name;
    $('user-avatar').textContent = session.name.trim().slice(0, 2).toUpperCase();
    $('user-role').textContent = leader ? 'Chỉ huy' : 'Thành viên';
    $('user-chip').dataset.role = session.role;
    $('side-hint').innerHTML = leader
      ? 'Chọn icon rồi click lên bản đồ để thả nhanh, hoặc kéo trực tiếp. Giữ <kbd>Shift</kbd> khi thả để cắm liên tiếp.'
      : 'Bạn đang xem kế hoạch ở chế độ chỉ đọc. Dùng con lăn để phóng to, kéo nền để di chuyển bản đồ.';
    if (!leader) {
      board.setPending(null);
      markPending();
      renderInspector(null);
      setMode('select');
      setStatus('Chế độ chỉ xem', 'view');
    } else {
      setStatus('Sẵn sàng');
    }
  }

  function startApp() {
    $('login-screen').hidden = true;
    $('app').hidden = false;

    if (board) { applyRole(); board.fit(); return; }

    store.load();
    loadFromHash();

    board = new global.VSKHBoard({
      viewport: $('viewport'),
      world: $('world'),
      image: $('map-image'),
      canvas: $('draw-layer'),
      markerLayer: $('marker-layer'),
      store: store,
      handlers: {
        select: renderInspector,
        view: function (v) { $('zoom-readout').textContent = Math.round(v.zoom * 100) + '%'; },
        rename: function (m) {
          if (!m || !isLeader()) return;
          var next = global.prompt('Nhãn cho ký hiệu:', m.label || '');
          if (next === null) return;
          board.select(m.id);
          updateSelected({ label: next.slice(0, 40) });
        },
        resize: function () { board.applyTransform(); }
      }
    });

    /* Cửa sổ gỡ lỗi / tự động hoá. */
    global.VSKHApp = { store: store, board: board };

    store.subscribe(function (state, reason) {
      $('marker-count').textContent = state.markers.length;
      $('map-name').textContent = state.map.name;
      $('btn-undo').disabled = !store.canUndo();
      $('btn-redo').disabled = !store.canRedo();
      renderLegend();
      if (reason === 'storage-error') {
        setStatus('Không lưu được', 'warn');
        toast('Không lưu được vào bộ nhớ trình duyệt — ảnh nền quá lớn. Hãy xuất file .json.', 'warn');
        return;
      }
      if (reason !== 'marker-move') board.renderMarkers();
      board.redrawStrokes();
    });

    buildSideChips();
    buildPalette();
    buildToolbar();
    bindInspector();
    bindMapControls();
    bindPlanControls();
    bindClearControls();
    bindKeys();

    $('btn-logout').addEventListener('click', logout);
    $('btn-undo').addEventListener('click', function () { if (store.undo()) board.render(); });
    $('btn-redo').addEventListener('click', function () { if (store.redo()) board.render(); });
    $('btn-zoom-in').addEventListener('click', function () { board.zoomAt(1.2); });
    $('btn-zoom-out').addEventListener('click', function () { board.zoomAt(1 / 1.2); });
    $('btn-fit').addEventListener('click', function () { board.fit(); });
    $('sidebar-toggle').addEventListener('click', function () {
      document.body.classList.toggle('sidebar-hidden');
    });

    $('map-image').addEventListener('load', function () { board.applyTransform(); });
    global.addEventListener('resize', function () { board.applyTransform(); });

    if (global.innerWidth <= 900) document.body.classList.add('sidebar-hidden');

    board.render();
    board.fit();
    applyRole();
    $('marker-count').textContent = store.state.markers.length;
    $('map-name').textContent = store.state.map.name;
    $('btn-undo').disabled = true;
    $('btn-redo').disabled = true;
    renderLegend();
  }

  document.addEventListener('DOMContentLoaded', initLogin);
})(window);

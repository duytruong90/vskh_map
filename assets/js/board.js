/* Khung nhìn bản đồ: phóng to/thu nhỏ, kéo thả marker, lớp vẽ tay, xuất ảnh. */
(function (global) {
  'use strict';

  var CFG = global.NTHConfig;
  var Icons = global.NTHIcons;
  var SU = global.NTHStore;
  var CANVAS_RES = 2;      /* Độ phân giải lớp vẽ so với kích thước bản đồ. */
  var MARKER_W = 44;
  var MARKER_H = 58;
  var MARKER_LOGO = 46;    /* Icon môn phái là ảnh vuông, neo ở tâm. */
  var ERASER_RADIUS = 14;  /* Tính theo pixel bản đồ. */

  function Board(opts) {
    this.viewport = opts.viewport;
    this.world = opts.world;
    this.image = opts.image;
    this.canvas = opts.canvas;
    this.layer = opts.markerLayer;
    this.store = opts.store;
    this.ctx = this.canvas.getContext('2d');

    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.mode = 'select';
    this.pen = { tool: 'pen', color: 'red', width: 'medium' };
    this.pendingIcon = null;
    this.pendingSide = 'red';
    this.selectedId = null;
    this.editable = true;
    this.spaceDown = false;

    this.drag = null;          /* Kéo marker đang diễn ra */
    this.panning = null;       /* Kéo nền để di chuyển khung nhìn */
    this.stroke = null;        /* Nét vẽ đang vẽ dở */
    this.markerNodes = {};     /* id -> phần tử DOM */

    this.handlers = opts.handlers || {};
    this._bind();
  }

  Board.prototype.emit = function (name, payload) {
    if (typeof this.handlers[name] === 'function') this.handlers[name](payload);
  };

  /* ---------- Chuyển đổi toạ độ ---------- */

  Board.prototype.mapSize = function () {
    var m = this.store.state.map;
    return { w: m.width || 1600, h: m.height || 1000 };
  };

  Board.prototype.toWorld = function (clientX, clientY) {
    var rect = this.viewport.getBoundingClientRect();
    return {
      x: (clientX - rect.left - this.pan.x) / this.zoom,
      y: (clientY - rect.top - this.pan.y) / this.zoom
    };
  };

  Board.prototype.toNorm = function (clientX, clientY) {
    var p = this.toWorld(clientX, clientY);
    var s = this.mapSize();
    return { x: p.x / s.w, y: p.y / s.h };
  };

  Board.prototype.applyTransform = function () {
    this.world.style.transform =
      'translate(' + this.pan.x.toFixed(2) + 'px,' + this.pan.y.toFixed(2) + 'px) scale(' + this.zoom + ')';
    this.emit('view', { zoom: this.zoom });
  };

  Board.prototype.fit = function () {
    var s = this.mapSize();
    var rect = this.viewport.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var z = Math.min(rect.width / s.w, rect.height / s.h) * 0.96;
    this.zoom = Math.max(CFG.DEFAULTS.minZoom, Math.min(CFG.DEFAULTS.maxZoom, z));
    this.pan.x = (rect.width - s.w * this.zoom) / 2;
    this.pan.y = (rect.height - s.h * this.zoom) / 2;
    this.applyTransform();
  };

  Board.prototype.zoomAt = function (factor, clientX, clientY) {
    var rect = this.viewport.getBoundingClientRect();
    var cx = clientX == null ? rect.left + rect.width / 2 : clientX;
    var cy = clientY == null ? rect.top + rect.height / 2 : clientY;
    var before = this.toWorld(cx, cy);
    var next = Math.max(CFG.DEFAULTS.minZoom, Math.min(CFG.DEFAULTS.maxZoom, this.zoom * factor));
    if (next === this.zoom) return;
    this.zoom = next;
    this.pan.x = cx - rect.left - before.x * this.zoom;
    this.pan.y = cy - rect.top - before.y * this.zoom;
    this.applyTransform();
  };

  /* ---------- Vẽ lại ---------- */

  Board.prototype.syncMapSize = function () {
    var s = this.mapSize();
    this.world.style.width = s.w + 'px';
    this.world.style.height = s.h + 'px';
    this.canvas.width = Math.round(s.w * CANVAS_RES);
    this.canvas.height = Math.round(s.h * CANVAS_RES);
    this.canvas.style.width = s.w + 'px';
    this.canvas.style.height = s.h + 'px';
    if (this.image.getAttribute('src') !== this.store.state.map.url) {
      this.image.setAttribute('src', this.store.state.map.url);
    }
  };

  Board.prototype.strokePath = function (ctx, stroke, s, opts) {
    opts = opts || {};
    var color = opts.color || CFG.penColor(stroke.color).color;
    var width = CFG.penWidth(stroke.width).width * (opts.widthMul || 1);
    var pts = stroke.points;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = width * 0.9;

    if (stroke.tool === 'arrow') {
      var a = { x: pts[0][0] * s.w, y: pts[0][1] * s.h };
      var b = { x: pts[pts.length - 1][0] * s.w, y: pts[pts.length - 1][1] * s.h };
      var ang = Math.atan2(b.y - a.y, b.x - a.x);
      var head = Math.max(14, width * 3.2);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x - Math.cos(ang) * head * 0.6, b.y - Math.sin(ang) * head * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - Math.cos(ang - 0.42) * head, b.y - Math.sin(ang - 0.42) * head);
      ctx.lineTo(b.x - Math.cos(ang + 0.42) * head, b.y - Math.sin(ang + 0.42) * head);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(pts[0][0] * s.w, pts[0][1] * s.h);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * s.w, pts[i][1] * s.h);
      ctx.stroke();
    }
    ctx.restore();
  };

  Board.prototype.redrawStrokes = function () {
    var s = this.mapSize();
    var ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(CANVAS_RES, 0, 0, CANVAS_RES, 0, 0);
    var all = this.store.state.strokes;
    for (var i = 0; i < all.length; i++) this.strokePath(ctx, all[i], s);
    if (this.stroke && this.stroke.points.length > 1) this.strokePath(ctx, this.stroke, s);

    /* Vệt sáng ngắn trên nét vừa vẽ xong. */
    if (this.flash) {
      var el = Math.min(1, (Date.now() - this.flash.start) / 300);
      ctx.save();
      ctx.globalAlpha = (1 - el) * 0.55;
      ctx.globalCompositeOperation = 'lighter';
      this.strokePath(ctx, this.flash.stroke, s, { color: '#ffffff', widthMul: 1 + 0.9 * (1 - el) });
      ctx.restore();
    }
  };

  Board.prototype.reducedMotion = function () {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };

  Board.prototype.flashStroke = function (stroke) {
    var self = this;
    if (this.reducedMotion() || !global.requestAnimationFrame) return;
    this.flash = { stroke: stroke, start: Date.now() };
    if (this.flashRaf) return;
    var step = function () {
      if (!self.flash) { self.flashRaf = 0; return; }
      if (Date.now() - self.flash.start >= 300) {
        self.flash = null;
        self.flashRaf = 0;
        self.redrawStrokes();
        return;
      }
      self.redrawStrokes();
      self.flashRaf = global.requestAnimationFrame(step);
    };
    this.flashRaf = global.requestAnimationFrame(step);
  };

  Board.prototype.renderMarkers = function () {
    var self = this;
    var seen = {};
    this.store.state.markers.forEach(function (m) {
      seen[m.id] = true;
      var node = self.markerNodes[m.id];
      if (!node) {
        node = document.createElement('div');
        node.className = 'marker';
        node.dataset.id = m.id;
        self.layer.appendChild(node);
        self.markerNodes[m.id] = node;
      }
      if (node.dataset.icon !== m.icon || node.dataset.side !== m.side) {
        var icon = CFG.icon(m.icon);
        node.innerHTML = Icons.markerSvg(icon, m.side) +
          '<span class="marker-label"></span>';
        node.dataset.icon = m.icon;
        node.dataset.side = m.side;
        node.title = icon.label;
      }
      var labelEl = node.querySelector('.marker-label');
      if (labelEl.textContent !== (m.label || '')) labelEl.textContent = m.label || '';
      labelEl.hidden = !m.label;
      var isLogo = Icons.isLogo(CFG.icon(m.icon));
      node.classList.toggle('is-logo', isLogo);
      node.style.left = (m.x * 100) + '%';
      node.style.top = (m.y * 100) + '%';
      node.style.width = ((isLogo ? MARKER_LOGO : MARKER_W) * (m.scale || 1)) + 'px';
      node.style.height = ((isLogo ? MARKER_LOGO : MARKER_H) * (m.scale || 1)) + 'px';
      node.classList.toggle('is-selected', m.id === self.selectedId);
    });

    Object.keys(this.markerNodes).forEach(function (id) {
      if (!seen[id]) {
        self.layer.removeChild(self.markerNodes[id]);
        delete self.markerNodes[id];
      }
    });
  };

  Board.prototype.render = function () {
    this.syncMapSize();
    this.renderMarkers();
    this.redrawStrokes();
  };

  /* ---------- Chế độ & công cụ ---------- */

  Board.prototype.setMode = function (mode) {
    this.mode = mode;
    if (mode !== 'select') this.select(null);
    this.viewport.dataset.mode = mode;
  };

  Board.prototype.setPen = function (patch) {
    Object.assign(this.pen, patch);
  };

  Board.prototype.setPending = function (iconId, side) {
    this.pendingIcon = iconId;
    if (side) this.pendingSide = side;
    this.viewport.classList.toggle('is-placing', !!iconId);
    this.emit('pending', { icon: iconId, side: this.pendingSide });
  };

  Board.prototype.select = function (id) {
    if (this.selectedId === id) return;
    this.selectedId = id;
    this.renderMarkers();
    this.emit('select', id ? this.findMarker(id) : null);
  };

  Board.prototype.findMarker = function (id) {
    return this.store.state.markers.filter(function (m) { return m.id === id; })[0] || null;
  };

  Board.prototype.addMarker = function (iconId, side, nx, ny) {
    if (!this.editable || !CFG.icon(iconId)) return null;
    var id = SU.uid('mk');
    this.store.update(function (st) {
      st.markers.push({
        id: id, icon: iconId, side: side,
        x: Math.min(1, Math.max(0, nx)), y: Math.min(1, Math.max(0, ny)),
        label: '', scale: 1
      });
    }, 'marker-add');
    return id;
  };

  Board.prototype.removeMarker = function (id) {
    if (!this.editable) return;
    this.store.update(function (st) {
      st.markers = st.markers.filter(function (m) { return m.id !== id; });
    }, 'marker-remove');
    if (this.selectedId === id) this.select(null);
  };

  Board.prototype.eraseAt = function (nx, ny) {
    var s = this.mapSize();
    var r = ERASER_RADIUS / this.zoom;
    var hit = this.store.state.strokes.filter(function (st) {
      return st.points.some(function (p) {
        var dx = p[0] * s.w - nx * s.w, dy = p[1] * s.h - ny * s.h;
        return Math.sqrt(dx * dx + dy * dy) <= r;
      });
    });
    if (!hit.length) return;
    var ids = hit.map(function (h) { return h.id; });
    this.store.update(function (st) {
      st.strokes = st.strokes.filter(function (x) { return ids.indexOf(x.id) < 0; });
    }, 'stroke-erase');
  };

  /* ---------- Sự kiện chuột/cảm ứng ---------- */

  Board.prototype._bind = function () {
    var self = this;

    this.viewport.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      self.zoomAt(ev.deltaY < 0 ? 1.12 : 1 / 1.12, ev.clientX, ev.clientY);
    }, { passive: false });

    this.viewport.addEventListener('pointerdown', function (ev) {
      var markerEl = ev.target.closest ? ev.target.closest('.marker') : null;
      var wantsPan = ev.button === 1 || ev.button === 2 || self.spaceDown || self.mode === 'pan';

      if (wantsPan) {
        ev.preventDefault();
        self.panning = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, px: self.pan.x, py: self.pan.y, moved: false };
        self.viewport.setPointerCapture(ev.pointerId);
        self.viewport.classList.add('is-panning');
        return;
      }
      if (ev.button !== 0) return;

      if (self.mode === 'draw') {
        ev.preventDefault();
        var n = self.toNorm(ev.clientX, ev.clientY);
        if (!self.editable) return;
        if (self.pen.tool === 'eraser') {
          self.stroke = null;
          self.erasing = { id: ev.pointerId };
          self.viewport.setPointerCapture(ev.pointerId);
          self.eraseAt(n.x, n.y);
          return;
        }
        self.stroke = {
          id: SU.uid('st'), tool: self.pen.tool,
          color: self.pen.color, width: self.pen.width,
          points: [[n.x, n.y], [n.x, n.y]],
          pointerId: ev.pointerId
        };
        self.viewport.setPointerCapture(ev.pointerId);
        return;
      }

      /* Chế độ kéo thả */
      if (markerEl) {
        var m = self.findMarker(markerEl.dataset.id);
        if (!m) return;
        self.select(m.id);
        if (!self.editable) return;
        ev.preventDefault();
        var start = self.toNorm(ev.clientX, ev.clientY);
        self.drag = {
          id: ev.pointerId, markerId: m.id, moved: false,
          offX: m.x - start.x, offY: m.y - start.y,
          startX: m.x, startY: m.y
        };
        self.viewport.setPointerCapture(ev.pointerId);
        return;
      }

      if (self.pendingIcon && self.editable) {
        var np = self.toNorm(ev.clientX, ev.clientY);
        if (np.x < 0 || np.x > 1 || np.y < 0 || np.y > 1) return;
        var newId = self.addMarker(self.pendingIcon, self.pendingSide, np.x, np.y);
        if (!ev.shiftKey) self.setPending(null);
        self.select(newId);
        return;
      }

      self.select(null);
      /* Kéo nền để di chuyển khung nhìn. */
      self.panning = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, px: self.pan.x, py: self.pan.y, moved: false };
      self.viewport.setPointerCapture(ev.pointerId);
      self.viewport.classList.add('is-panning');
    });

    this.viewport.addEventListener('pointermove', function (ev) {
      if (self.panning && self.panning.id === ev.pointerId) {
        self.pan.x = self.panning.px + (ev.clientX - self.panning.x);
        self.pan.y = self.panning.py + (ev.clientY - self.panning.y);
        self.panning.moved = true;
        self.applyTransform();
        return;
      }
      if (self.drag && self.drag.id === ev.pointerId) {
        var n = self.toNorm(ev.clientX, ev.clientY);
        var m = self.findMarker(self.drag.markerId);
        if (!m) return;
        m.x = Math.min(1, Math.max(0, n.x + self.drag.offX));
        m.y = Math.min(1, Math.max(0, n.y + self.drag.offY));
        self.drag.moved = true;
        self.renderMarkers();
        return;
      }
      if (self.erasing && self.erasing.id === ev.pointerId) {
        var ne = self.toNorm(ev.clientX, ev.clientY);
        self.eraseAt(ne.x, ne.y);
        return;
      }
      if (self.stroke && self.stroke.pointerId === ev.pointerId) {
        var np = self.toNorm(ev.clientX, ev.clientY);
        if (self.stroke.tool === 'arrow') {
          self.stroke.points[1] = [np.x, np.y];
        } else {
          var last = self.stroke.points[self.stroke.points.length - 1];
          var s = self.mapSize();
          var dx = (np.x - last[0]) * s.w, dy = (np.y - last[1]) * s.h;
          if (dx * dx + dy * dy > 2) self.stroke.points.push([np.x, np.y]);
        }
        self.redrawStrokes();
        return;
      }
      if (self.mode === 'select' && self.pendingIcon) self.emit('hover', self.toNorm(ev.clientX, ev.clientY));
    });

    function finishPointer(ev) {
      if (self.panning && self.panning.id === ev.pointerId) {
        self.panning = null;
        self.viewport.classList.remove('is-panning');
      }
      if (self.drag && self.drag.id === ev.pointerId) {
        var d = self.drag;
        self.drag = null;
        if (d.moved) {
          var m = self.findMarker(d.markerId);
          var nx = m ? m.x : d.startX, ny = m ? m.y : d.startY;
          /* Trả về vị trí cũ rồi ghi lại qua store để undo hoạt động đúng. */
          if (m) { m.x = d.startX; m.y = d.startY; }
          self.store.update(function (st) {
            st.markers.forEach(function (mm) {
              if (mm.id === d.markerId) { mm.x = nx; mm.y = ny; }
            });
          }, 'marker-move');
        }
      }
      if (self.erasing && self.erasing.id === ev.pointerId) self.erasing = null;
      if (self.stroke && self.stroke.pointerId === ev.pointerId) {
        var st = self.stroke;
        self.stroke = null;
        var s = self.mapSize();
        var a = st.points[0], b = st.points[st.points.length - 1];
        var far = Math.abs(a[0] - b[0]) * s.w > 4 || Math.abs(a[1] - b[1]) * s.h > 4;
        if (st.points.length > 2 || far) {
          delete st.pointerId;
          self.store.update(function (state) { state.strokes.push(st); }, 'stroke-add');
          self.flashStroke(st);
        } else {
          self.redrawStrokes();
        }
      }
    }

    this.viewport.addEventListener('pointerup', finishPointer);
    this.viewport.addEventListener('pointercancel', finishPointer);
    this.viewport.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });

    this.viewport.addEventListener('dblclick', function (ev) {
      var el = ev.target.closest ? ev.target.closest('.marker') : null;
      if (el) self.emit('rename', self.findMarker(el.dataset.id));
    });

    /* Kéo thả icon từ bảng chọn vào bản đồ. */
    this.viewport.addEventListener('dragover', function (ev) {
      if (!self.editable) return;
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'copy';
    });
    this.viewport.addEventListener('drop', function (ev) {
      if (!self.editable) return;
      ev.preventDefault();
      var payload = ev.dataTransfer.getData('text/plain');
      if (!payload) return;
      var parts = payload.split('|');
      var n = self.toNorm(ev.clientX, ev.clientY);
      if (n.x < 0 || n.x > 1 || n.y < 0 || n.y > 1) return;
      var id = self.addMarker(parts[0], parts[1] || self.pendingSide, n.x, n.y);
      self.select(id);
    });

    global.addEventListener('keydown', function (ev) {
      if (ev.code === 'Space') self.spaceDown = true;
    });
    global.addEventListener('keyup', function (ev) {
      if (ev.code === 'Space') self.spaceDown = false;
    });
    global.addEventListener('resize', function () { self.emit('resize'); });
  };

  /* ---------- Xuất ảnh PNG ---------- */

  Board.prototype.exportPng = function () {
    var self = this;
    var s = this.mapSize();
    var out = document.createElement('canvas');
    out.width = s.w;
    out.height = s.h;
    var ctx = out.getContext('2d');

    function loadImage(src) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error('Không tải được ảnh: ' + src.slice(0, 60))); };
        img.src = src;
      });
    }

    /* Logo môn phái là file rời, thiếu thì bỏ qua chứ không làm hỏng cả bản xuất. */
    function loadLogo(src) {
      return loadImage(src).catch(function () { return null; });
    }

    return loadImage(this.store.state.map.url).then(function (bg) {
      ctx.drawImage(bg, 0, 0, s.w, s.h);
      ctx.drawImage(self.canvas, 0, 0, s.w, s.h);

      var markers = self.store.state.markers;
      return Promise.all(markers.map(function (m) {
        var icon = CFG.icon(m.icon);
        /* markerSvg có thể kèm thẻ <img>; chỉ lấy phần <svg> để rasterise. */
        var svg = Icons.markerSvg(icon, m.side).replace(/<img[\s\S]*$/, '');
        var full = '<svg xmlns="http://www.w3.org/2000/svg" ' + svg.slice(4);
        return Promise.all([
          loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(full)),
          icon.image ? loadLogo(icon.image) : null
        ]).then(function (pair) { return { img: pair[0], logo: pair[1], m: m }; });
      })).then(function (items) {
        ctx.textAlign = 'center';
        ctx.font = '600 13px system-ui, sans-serif';
        items.forEach(function (it) {
          var sc = it.m.scale || 1;
          var isLogo = !!CFG.icon(it.m.icon).image;
          var w = (isLogo ? MARKER_LOGO : MARKER_W) * sc;
          var h = (isLogo ? MARKER_LOGO : MARKER_H) * sc;
          var cx = it.m.x * s.w;
          /* Ghim neo ở mũi nhọn dưới, icon ảnh neo ở tâm. */
          var y = isLogo ? it.m.y * s.h - h / 2 : it.m.y * s.h - h;
          ctx.drawImage(it.img, cx - w / 2, y, w, h);

          if (isLogo && it.logo) {
            var box = w * 0.76;
            var ar = it.logo.naturalWidth / it.logo.naturalHeight || 1;
            var lw = ar >= 1 ? box : box * ar;
            var lh = ar >= 1 ? box / ar : box;
            ctx.drawImage(it.logo, cx - lw / 2, y + h / 2 - lh / 2, lw, lh);
          }

          var text = it.m.label;
          if (!text) return;
          var ty = y + h + (isLogo ? 13 : -1);
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(0,0,0,.8)';
          ctx.fillStyle = '#fff';
          ctx.strokeText(text, cx, ty);
          ctx.fillText(text, cx, ty);
        });
        return out;
      });
    });
  };

  global.NTHBoard = Board;
})(window);

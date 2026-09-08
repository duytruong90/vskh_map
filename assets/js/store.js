/* Trạng thái bản đồ: marker, nét vẽ, lịch sử undo/redo và lưu trữ cục bộ. */
(function (global) {
  'use strict';

  var CFG = global.PHLConfig;
  var D = CFG.DEFAULTS;
  var HISTORY_LIMIT = 60;

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function blank() {
    return {
      version: 1,
      map: { url: D.mapUrl, width: D.mapWidth, height: D.mapHeight, name: 'Bản đồ mặc định' },
      markers: [],
      strokes: [],
      updatedAt: Date.now()
    };
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /* Chấp nhận dữ liệu ngoài (localStorage / file nhập) một cách phòng thủ. */
  function sanitize(raw) {
    var base = blank();
    if (!raw || typeof raw !== 'object') return base;

    if (raw.map && typeof raw.map === 'object' && typeof raw.map.url === 'string') {
      base.map = {
        url: raw.map.url,
        width: Number(raw.map.width) > 0 ? Number(raw.map.width) : D.mapWidth,
        height: Number(raw.map.height) > 0 ? Number(raw.map.height) : D.mapHeight,
        name: typeof raw.map.name === 'string' ? raw.map.name.slice(0, 120) : 'Bản đồ tuỳ chỉnh'
      };
    }

    if (Array.isArray(raw.markers)) {
      base.markers = raw.markers.reduce(function (acc, m) {
        if (!m || !CFG.icon(m.icon)) return acc;
        acc.push({
          id: typeof m.id === 'string' ? m.id : uid('mk'),
          icon: m.icon,
          side: CFG.side(m.side).id,
          x: Math.min(1, Math.max(0, Number(m.x) || 0)),
          y: Math.min(1, Math.max(0, Number(m.y) || 0)),
          label: typeof m.label === 'string' ? m.label.slice(0, 60) : '',
          scale: Number(m.scale) > 0 ? Math.min(3, Number(m.scale)) : 1
        });
        return acc;
      }, []);
    }

    if (Array.isArray(raw.strokes)) {
      base.strokes = raw.strokes.reduce(function (acc, s) {
        if (!s || !Array.isArray(s.points) || s.points.length < 2) return acc;
        var pts = s.points.reduce(function (ps, p) {
          if (Array.isArray(p) && p.length >= 2 && isFinite(p[0]) && isFinite(p[1])) {
            ps.push([Number(p[0]), Number(p[1])]);
          }
          return ps;
        }, []);
        if (pts.length < 2) return acc;
        acc.push({
          id: typeof s.id === 'string' ? s.id : uid('st'),
          tool: s.tool === 'arrow' ? 'arrow' : 'pen',
          color: CFG.penColor(s.color).id,
          width: CFG.penWidth(s.width).id,
          points: pts
        });
        return acc;
      }, []);
    }

    base.updatedAt = Number(raw.updatedAt) || Date.now();
    return base;
  }

  function Store() {
    this.state = blank();
    this.past = [];
    this.future = [];
    this.listeners = [];
    this.saveTimer = null;
  }

  Store.prototype.load = function () {
    try {
      var raw = global.localStorage.getItem(D.storageKey);
      if (raw) this.state = sanitize(JSON.parse(raw));
    } catch (err) {
      console.warn('Không đọc được dữ liệu đã lưu:', err);
      this.state = blank();
    }
    return this.state;
  };

  Store.prototype.save = function () {
    var self = this;
    global.clearTimeout(this.saveTimer);
    this.saveTimer = global.setTimeout(function () {
      try {
        global.localStorage.setItem(D.storageKey, JSON.stringify(self.state));
      } catch (err) {
        /* Ảnh nền base64 lớn có thể vượt hạn mức localStorage. */
        self.emit('storage-error', err);
      }
    }, 250);
  };

  Store.prototype.subscribe = function (fn) {
    this.listeners.push(fn);
    return function () {
      var i = this.listeners.indexOf(fn);
      if (i >= 0) this.listeners.splice(i, 1);
    }.bind(this);
  };

  Store.prototype.emit = function (reason, payload) {
    for (var i = 0; i < this.listeners.length; i++) this.listeners[i](this.state, reason, payload);
  };

  /* mutate(state) thay đổi trực tiếp; opts.history=false cho thao tác nháp. */
  Store.prototype.update = function (mutate, reason, opts) {
    opts = opts || {};
    if (opts.history !== false) {
      this.past.push(clone(this.state));
      if (this.past.length > HISTORY_LIMIT) this.past.shift();
      this.future.length = 0;
    }
    mutate(this.state);
    this.state.updatedAt = Date.now();
    this.save();
    this.emit(reason || 'update');
  };

  Store.prototype.undo = function () {
    if (!this.past.length) return false;
    this.future.push(clone(this.state));
    this.state = this.past.pop();
    this.save();
    this.emit('undo');
    return true;
  };

  Store.prototype.redo = function () {
    if (!this.future.length) return false;
    this.past.push(clone(this.state));
    this.state = this.future.pop();
    this.save();
    this.emit('redo');
    return true;
  };

  Store.prototype.canUndo = function () { return this.past.length > 0; };
  Store.prototype.canRedo = function () { return this.future.length > 0; };

  Store.prototype.replace = function (raw, reason) {
    this.past.push(clone(this.state));
    this.future.length = 0;
    this.state = sanitize(raw);
    this.save();
    this.emit(reason || 'replace');
  };

  global.PHLStore = { Store: Store, uid: uid, blank: blank, sanitize: sanitize, clone: clone };
})(window);

/* Cấu hình chung: bảng màu, bộ icon, thông số mặc định. */
(function (global) {
  'use strict';

  var SIDES = [
    { id: 'red',   label: 'Phe Đỏ',   color: '#e2453c', deep: '#7e1c17' },
    { id: 'blue',  label: 'Phe Xanh', color: '#39a7d8', deep: '#14536f' },
    { id: 'gold',  label: 'Trung Lập', color: '#e8b23a', deep: '#7a5a10' },
    { id: 'white', label: 'Ghi Chú',  color: '#e8e6df', deep: '#5c5a52' }
  ];

  var PEN_COLORS = [
    { id: 'red',   label: 'Đỏ',    color: '#ff4d42' },
    { id: 'blue',  label: 'Xanh',  color: '#3fb6ec' },
    { id: 'gold',  label: 'Vàng',  color: '#ffc53d' },
    { id: 'white', label: 'Trắng', color: '#f4f2ec' },
    { id: 'lime',  label: 'Lục',   color: '#7bdc6a' }
  ];

  var PEN_WIDTHS = [
    { id: 'thin',   label: 'Mảnh', width: 3 },
    { id: 'medium', label: 'Vừa',  width: 6 },
    { id: 'thick',  label: 'Dày',  width: 11 }
  ];

  /* Mỗi glyph vẽ trong hệ toạ độ 24x24, tâm tại (12,12). */
  var ICONS = [
    { group: 'Đoàn Đội', id: 'cong', label: 'Team Công',
      glyph: '<path d="M4 19 L15 8 M9 5 L19 15 M4 6 L6 4 L10 8 M20 18 L18 20 L14 16" />' +
             '<path d="M3 18.5 L5.5 21 M18.5 21 L21 18.5" />' },
    { group: 'Đoàn Đội', id: 'thu', label: 'Team Thủ',
      glyph: '<path d="M12 3 L20 6 V12 C20 16.5 16.6 19.8 12 21.5 C7.4 19.8 4 16.5 4 12 V6 Z" />' +
             '<path d="M8.5 12 L11 14.5 L15.8 9.6" />' },
    { group: 'Đoàn Đội', id: 'scout', label: 'Team Scout',
      glyph: '<path d="M2.5 12 C5 7.5 8.6 5.5 12 5.5 C15.4 5.5 19 7.5 21.5 12 C19 16.5 15.4 18.5 12 18.5 C8.6 18.5 5 16.5 2.5 12 Z" />' +
             '<circle cx="12" cy="12" r="3.2" />' },
    { group: 'Đoàn Đội', id: 'codong', label: 'Team Cơ Động',
      glyph: '<path d="M3 8 L9 14 L3 20 M11 8 L17 14 L11 20" />' +
             '<path d="M13 3.5 L21 3.5 L21 11" />' },
    { group: 'Đoàn Đội', id: 'vattu', label: 'Team Vật Tư',
      glyph: '<path d="M3.5 8.5 L12 4 L20.5 8.5 V16 L12 20.5 L3.5 16 Z" />' +
             '<path d="M3.5 8.5 L12 13 L20.5 8.5 M12 13 V20.5" />' },
    { group: 'Đoàn Đội', id: 'chihuy', label: 'Chỉ Huy',
      glyph: '<path d="M3 17 L5 6 L9.5 11.5 L12 4 L14.5 11.5 L19 6 L21 17 Z" />' +
             '<path d="M3.5 20 H20.5" />' },
    { group: 'Đoàn Đội', id: 'hoiphuc', label: 'Đội Hồi Phục',
      glyph: '<path d="M12 4.5 V19.5 M4.5 12 H19.5" />' +
             '<circle cx="12" cy="12" r="9" />' },

    { group: 'Tài Nguyên', id: 'vt-xanh', label: 'Vật Tư Xanh',
      glyph: '<path d="M3.5 7.5 H20.5 V19 H3.5 Z M3.5 11.5 H20.5" />' +
             '<path d="M8.5 7.5 L10.5 3.5 H13.5 L15.5 7.5" />' },
    { group: 'Tài Nguyên', id: 'vt-do', label: 'Vật Tư Đỏ',
      glyph: '<path d="M4 8 H20 V19.5 H4 Z" />' +
             '<path d="M9.5 8 V19.5 M14.5 8 V19.5 M4 4.5 H20 V8 H4 Z" />' },
    { group: 'Tài Nguyên', id: 'luong', label: 'Lương Thảo',
      glyph: '<path d="M12 21 V10 M12 10 C12 6 9.5 3.5 6 3 C6 7 8.5 9.6 12 10 Z" />' +
             '<path d="M12 12.5 C12 9 14.4 6.6 18 6.2 C18 10 15.6 12.2 12 12.5 Z" />' },
    { group: 'Tài Nguyên', id: 'go', label: 'Gỗ',
      glyph: '<ellipse cx="8" cy="12" rx="3.2" ry="7.5" />' +
             '<path d="M8 4.5 H17 M8 19.5 H17 M17 4.5 C19 6 19 18 17 19.5" /><circle cx="8" cy="12" r="1.6" />' },
    { group: 'Tài Nguyên', id: 'sat', label: 'Sắt',
      glyph: '<path d="M5 15 L12 5 L19 15 Z" /><path d="M3 19.5 H21" /><path d="M9 15 L12 10.5 L15 15" />' },

    { group: 'Chiến Thuật', id: 'tapket', label: 'Điểm Tập Kết',
      glyph: '<circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.6" /><path d="M12 1.5 V5 M12 19 V22.5 M1.5 12 H5 M19 12 H22.5" />' },
    { group: 'Chiến Thuật', id: 'huong-cong', label: 'Hướng Công',
      glyph: '<path d="M3 12 H18" /><path d="M12.5 6 L19.5 12 L12.5 18" /><path d="M3 6.5 V17.5" />' },
    { group: 'Chiến Thuật', id: 'rut-lui', label: 'Rút Lui',
      glyph: '<path d="M21 12 H6" /><path d="M11.5 6 L4.5 12 L11.5 18" /><path d="M21 6.5 V17.5" />' },
    { group: 'Chiến Thuật', id: 'phuc-kich', label: 'Phục Kích',
      glyph: '<path d="M12 3 L21.5 20 H2.5 Z" /><path d="M12 9.5 V14.5 M12 17 V17.6" />' },
    { group: 'Chiến Thuật', id: 'canh-bao', label: 'Cảnh Báo',
      glyph: '<circle cx="12" cy="12" r="8.5" /><path d="M12 7 V13 M12 15.6 V16.4" />' },
    { group: 'Chiến Thuật', id: 'co', label: 'Cắm Cờ',
      glyph: '<path d="M6.5 21 V3" /><path d="M6.5 4 L19 7.5 L6.5 12.5 Z" />' },
    { group: 'Chiến Thuật', id: 'muc-tieu', label: 'Mục Tiêu',
      glyph: '<path d="M4 4 L10 10 M20 4 L14 10 M4 20 L10 14 M20 20 L14 14" />' +
             '<circle cx="12" cy="12" r="3.2" /><path d="M2.5 2.5 V7 M2.5 2.5 H7 M21.5 2.5 V7 M21.5 2.5 H17 M2.5 21.5 V17 M2.5 21.5 H7 M21.5 21.5 V17 M21.5 21.5 H17" />' }
,

    { group: 'Môn Phái', id: 'thiet-y', label: 'Thiết Y', accent: '#f0b64a',
      image: 'assets/img/class/thiet-y.png',
      glyph: '<path d="M12 3 L20 6 V12 C20 16.5 16.6 19.8 12 21.5 C7.4 19.8 4 16.5 4 12 V6 Z" />' +
             '<path d="M12 7.5 V16.5 M8.5 11 H15.5" />' },
    { group: 'Môn Phái', id: 'than-tuong', label: 'Thần Tướng', accent: '#3b7bfe',
      image: 'assets/img/class/than-tuong.png',
      glyph: '<path d="M13 3 C8 7.5 6 11.5 6.5 15 C7 18.5 9.5 20.5 13 20.5 C16 20.5 18 18.5 18 16 C18 13.5 16 12 14 12.5" />' +
             '<path d="M9 5.5 C5.5 9 4 12.5 4.5 16" />' },
    { group: 'Môn Phái', id: 'huyet-ha', label: 'Huyết Hà', accent: '#d0453a',
      glyph: '<path d="M12 3 C9 7.5 7.5 10.5 7.5 13 A4.5 4.5 0 0 0 16.5 13 C16.5 10.5 15 7.5 12 3 Z" />' +
             '<path d="M3 18.5 C6 16.5 8 20.5 11 18.5 C14 16.5 16 20.5 21 18" />' },
    { group: 'Môn Phái', id: 'toai-mong', label: 'Toái Mộng', accent: '#8fe6f5',
      image: 'assets/img/class/toai-mong.png',
      glyph: '<path d="M6 19 L18 5 M8.5 4.5 L19.5 15.5" />' +
             '<path d="M4 21 C3 16 5.5 11 10 8" />' },
    { group: 'Môn Phái', id: 'long-ngam', label: 'Long Ngâm', accent: '#6ee7b7',
      image: 'assets/img/class/long-ngam.png',
      glyph: '<path d="M12 3 V21" /><path d="M8.5 7 H15.5" />' +
             '<path d="M5 9 C3 13 4.5 18 9 20.5 M19 9 C21 13 19.5 18 15 20.5" />' },
    { group: 'Môn Phái', id: 'cuu-linh', label: 'Cửu Linh', accent: '#9a5dfe',
      image: 'assets/img/class/cuu-linh.png',
      glyph: '<path d="M12 4.5 C9 7 8.5 10 10 12.5 C6.5 11.5 4 13 3.5 16.5 C7 15.5 9 17 10 20 L12 15 L14 20 C15 17 17 15.5 20.5 16.5 C20 13 17.5 11.5 14 12.5 C15.5 10 15 7 12 4.5 Z" />' },
    { group: 'Môn Phái', id: 'to-van', label: 'Tố Vấn', accent: '#feb8af',
      image: 'assets/img/class/to-van.png',
      glyph: '<circle cx="12" cy="12" r="9" />' +
             '<path d="M12 4.5 C8 7 7 10.5 9 13 C11 15.5 10.5 18 8.5 19.5 M12 19.5 C16 17 17 13.5 15 11 C13 8.5 13.5 6 15.5 4.5" />' }
  ];

  var DEFAULTS = {
    mapUrl: 'assets/img/guildwar-map.webp',
    mapName: 'Guild War Map',
    mapWidth: 1825,
    mapHeight: 1018,
    minZoom: 0.15,
    maxZoom: 6,
    markerScale: 1,
    storageKey: 'vskh-tactical-map/board/v1',
    sessionKey: 'vskh-tactical-map/session/v1',
    /* Mật khẩu demo phía client — chỉ để phân vai, KHÔNG phải bảo mật thật. */
    leaderCode: 'vskh2024'
  };

  global.VSKHConfig = {
    SIDES: SIDES,
    PEN_COLORS: PEN_COLORS,
    PEN_WIDTHS: PEN_WIDTHS,
    ICONS: ICONS,
    DEFAULTS: DEFAULTS,
    icon: function (id) {
      for (var i = 0; i < ICONS.length; i++) { if (ICONS[i].id === id) return ICONS[i]; }
      return null;
    },
    side: function (id) {
      for (var i = 0; i < SIDES.length; i++) { if (SIDES[i].id === id) return SIDES[i]; }
      return SIDES[0];
    },
    penColor: function (id) {
      for (var i = 0; i < PEN_COLORS.length; i++) { if (PEN_COLORS[i].id === id) return PEN_COLORS[i]; }
      return PEN_COLORS[0];
    },
    penWidth: function (id) {
      for (var i = 0; i < PEN_WIDTHS.length; i++) { if (PEN_WIDTHS[i].id === id) return PEN_WIDTHS[i]; }
      return PEN_WIDTHS[1];
    },
    groups: function () {
      var out = [], seen = {};
      ICONS.forEach(function (ic) {
        if (!seen[ic.group]) { seen[ic.group] = []; out.push({ name: ic.group, items: seen[ic.group] }); }
        seen[ic.group].push(ic);
      });
      return out;
    }
  };
})(window);

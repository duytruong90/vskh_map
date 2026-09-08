/* Sinh SVG cho icon trong bảng chọn và marker trên bản đồ. */
(function (global) {
  'use strict';

  var CFG = global.VSKHConfig;

  function glyphGroup(icon, stroke, scale) {
    var s = scale || 1;
    var off = 12 - 12 * s;
    return '<g transform="translate(' + off.toFixed(2) + ' ' + off.toFixed(2) + ') scale(' + s + ')" ' +
           'fill="none" stroke="' + stroke + '" stroke-width="1.9" ' +
           'stroke-linecap="round" stroke-linejoin="round">' + icon.glyph + '</g>';
  }

  /* Logo ảnh phủ lên trên; nếu thiếu file thì tự ẩn để lộ glyph SVG bên dưới. */
  function logoImg(icon, cls) {
    if (!icon.image) return '';
    return '<img class="' + cls + '" src="' + icon.image + '" alt="" draggable="false" ' +
           'onerror="this.style.display=&quot;none&quot;">';
  }

  /* Huy hiệu tròn dùng cho bảng chọn bên trái. */
  function paletteSvg(icon, side) {
    var sd = CFG.side(side);
    var uid = 'pg-' + icon.id + '-' + sd.id;
    return '' +
      '<svg viewBox="0 0 48 48" class="icon-emblem" aria-hidden="true">' +
        '<defs>' +
          '<radialGradient id="' + uid + '" cx="35%" cy="28%" r="78%">' +
            '<stop offset="0%" stop-color="' + sd.color + '"/>' +
            '<stop offset="100%" stop-color="' + sd.deep + '"/>' +
          '</radialGradient>' +
        '</defs>' +
        '<circle cx="24" cy="24" r="21" fill="url(#' + uid + ')" stroke="' + sd.color + '" stroke-width="2"/>' +
        '<circle cx="24" cy="24" r="17" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1"/>' +
        '<g transform="translate(12 12)">' + glyphGroup(icon, '#fff', 1) + '</g>' +
      '</svg>' + logoImg(icon, 'emblem-logo');
  }

  /* Ghim cắm trên bản đồ. */
  function markerSvg(icon, side) {
    var sd = CFG.side(side);
    var uid = 'mk-' + Math.random().toString(36).slice(2, 9);
    return '' +
      '<svg viewBox="0 0 48 64" class="marker-svg" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="' + uid + '" x1="0" y1="0" x2="0.4" y2="1">' +
            '<stop offset="0%" stop-color="' + sd.color + '"/>' +
            '<stop offset="100%" stop-color="' + sd.deep + '"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<ellipse cx="24" cy="60" rx="9" ry="3" fill="rgba(0,0,0,.45)"/>' +
        '<path d="M24 61 C24 61 42 38 42 24 A18 18 0 1 0 6 24 C6 38 24 61 24 61 Z" ' +
          'fill="url(#' + uid + ')" stroke="rgba(12,10,6,.85)" stroke-width="2.5"/>' +
        '<circle cx="24" cy="24" r="14" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.2"/>' +
        '<g transform="translate(12 12)">' + glyphGroup(icon, '#fff', 1) + '</g>' +
      '</svg>' + logoImg(icon, 'marker-logo');
  }

  global.VSKHIcons = { paletteSvg: paletteSvg, markerSvg: markerSvg };
})(window);

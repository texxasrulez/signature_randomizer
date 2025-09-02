/* Signature Randomizer identities UI */
(function () {

// === SR DEBUG UTILITIES ===
window.SR_DEBUG = window.SR_DEBUG || 1;
function SR_LOG() {
  if (!window.SR_DEBUG) return;
  try { console.log.apply(console, ['[SR]'].concat([].slice.call(arguments))); } catch(_){}
}
function sr_editor_ready() {
  try {
    if (rcmail && rcmail.editor && rcmail.editor.getBody && rcmail.editor.getBody()) return true;
  } catch(_){}
  try {
    if (window.tinymce && tinymce.activeEditor && tinymce.activeEditor.getBody()) return true;
  } catch(_){}
  return !!document.querySelector('.mce-content-body');
}
function sr_wait_for_editor(cb, tries) {
  tries = tries || 0;
  if (sr_editor_ready()) { try { cb(); } catch(e){ SR_LOG('cb error', e); } return; }
  if (tries > 120) { SR_LOG('editor never became ready'); return; }
  setTimeout(function(){ sr_wait_for_editor(cb, tries+1); }, 250);
}
// Force insert helper for manual testing from console
window.sr_force_insert = function(forceDifferent) {
  SR_LOG('force insert called');
  if (forceDifferent) { window.__SR_INSERTED = false; }
  sr_wait_for_editor(function(){ try { insertRandom(!!forceDifferent); } catch(e){ SR_LOG('insertRandom error', e); } });
};
window.sr_diag = function(){
  try {
    SR_LOG('env', {task: rcmail && rcmail.env && rcmail.env.task, action: rcmail && rcmail.env && rcmail.env.action, compose_html: rcmail && rcmail.env && rcmail.env.compose_html, sig_above: rcmail && rcmail.env && rcmail.env.sig_above, sig_separator: rcmail && rcmail.env && rcmail.env.sig_separator});
    SR_LOG('editor?', !!(rcmail && rcmail.editor), 'api:', rcmail && rcmail.editor && Object.keys(rcmail.editor));
    if (rcmail && rcmail.editor && rcmail.editor.getContent) SR_LOG('content len', (rcmail.editor.getContent()||'').length);
  } catch(e) { SR_LOG('diag error', e); }
};
// === END SR DEBUG ===

// === SR LOOP GUARDS ===
window.__SR_AUTO_SCHEDULED = window.__SR_AUTO_SCHEDULED || false;
window.__SR_INSERTED = window.__SR_INSERTED || false;
window.__SR_INSERTING = window.__SR_INSERTING || false;
// === END SR LOOP GUARDS ===

// === SR EDITOR API ADAPTER ===
function sr_editor_api() {
  try {
    if (rcmail && rcmail.editor) {
      if (typeof rcmail.editor.get_content === 'function' && typeof rcmail.editor.set_content === 'function') return 'rc_api';
      if (rcmail.editor.editor && (rcmail.editor.editor.insertContent || rcmail.editor.editor.execCommand)) return 'mce_editor';
      if (rcmail.editor.insertContent || rcmail.editor.execCommand) return 'mce_top';
    }
  } catch (e) {}
  return 'none';
}
function sr_insert_html(sig, above) {
  window.__SR_SKIPS = window.__SR_SKIPS || { inserted: 0, inprogress: 0 };if (window.__SR_INSERTING) { if (((window.__SR_SKIPS && window.__SR_SKIPS.inprogress) || 0) < 1) SR_LOG('skip: insert in progress'); window.__SR_SKIPS.inprogress = (((window.__SR_SKIPS && window.__SR_SKIPS.inprogress) || 0) + 1); return true; }
  if (window.__SR_INSERTED) { if (((window.__SR_SKIPS && window.__SR_SKIPS.inserted) || 0) < 1) SR_LOG('skip: already inserted'); window.__SR_SKIPS.inserted = (((window.__SR_SKIPS && window.__SR_SKIPS.inserted) || 0) + 1); return true; }
  window.__SR_INSERTING = true;
  var ok = false;
  try {
    var api = sr_editor_api();
    SR_LOG('insert api', api, 'above?', !!above);
    var spacer = '<p><br data-mce-bogus="1"></p><p><br data-mce-bogus="1"></p><p><br data-mce-bogus="1"></p>';
    try {
      var cur = rcmail.editor.get_content() || '';
      var d  = document.createElement('div'); d.innerHTML = cur;
      var qs = d.querySelectorAll('.rcmSig,.signature,.rcm-signature');
      for (var i=qs.length-1;i>=0;i--) if (qs[i] && qs[i].parentNode) qs[i].parentNode.removeChild(qs[i]);
      rcmail.editor.set_content(d.innerHTML);
    } catch (e) {}
    if (api === 'rc_api') {
      var body = (function(){ try { var b = rcmail.editor.get_content() || ''; return stripExisting(b, true); } catch(_) { return rcmail.editor.get_content() || ''; } })();
      var html = above ? (spacer + sig + body) : (body + sig);
      rcmail.editor.set_content(html);
      ok = true;
    } else if (api === 'mce_editor') {
      if (above) rcmail.editor.editor.execCommand('mceInsertContent', false, spacer + sig);
      else rcmail.editor.editor.execCommand('mceInsertContent', false, sig);
      ok = true;
    } else if (api === 'mce_top') {
      if (above) rcmail.editor.execCommand('mceInsertContent', false, spacer + sig);
      else if (rcmail.editor.insertContent) rcmail.editor.insertContent(sig);
      else rcmail.editor.execCommand('mceInsertContent', false, sig);
      ok = true;
    } else {
      try {
        var body2 = (function(){ try { var b2 = getBody() || ''; return stripExisting(b2, true); } catch(_){ return getBody()||''; } })();
        var d2 = document.createElement('div'); d2.innerHTML = body2;
        d2.innerHTML = above ? (spacer + sig + d2.innerHTML) : (d2.innerHTML + sig);
        setBody(d2.innerHTML);
        ok = true;
      } catch (e2) {}
    }
  } catch (e) {}
  if (ok) window.__SR_INSERTED = true;
  window.__SR_INSERTING = false;
  return ok;
}

// === END SR EDITOR API ADAPTER ===
  if (!window.rcmail) return;

  var state = {
    last_vid: null,
    boundForComposeId: null
  };
  function getBody() {
    try {
      if (isHtml() && rcmail && rcmail.editor && rcmail.editor.get_content) {
        return rcmail.editor.get_content() || '';
      }
    } catch (e) {}
    var ta = document.getElementById('composebody')
          || document.querySelector('#composebody')
          || document.querySelector('textarea[name="_message"]')
          || document.querySelector('textarea[name="_body"]')
          || document.querySelector('textarea');
    return ta ? (ta.value || '') : '';
  }

  function setBody(v) {
    try {
      if (isHtml() && rcmail && rcmail.editor && rcmail.editor.set_content) {
        rcmail.editor.set_content(v || '');
        return true;
      }
    } catch (e) {}
    var ta = document.getElementById('composebody')
          || document.querySelector('#composebody')
          || document.querySelector('textarea[name="_message"]')
          || document.querySelector('textarea[name="_body"]')
          || document.querySelector('textarea');
    if (ta) ta.value = v || '';
    return !!ta;
  }


  function resetStateForNewCompose(anchor) {
    try {
      state.last_vid = null;
      state.boundForComposeId = anchor || (Date.now() + '');
    } catch (e) {}
    window.__SR_INSERTING = false;
    window.__SR_INSERTED = false;
    return true;
  }


  function log() {
    try {
      console.debug.apply(console, ['[SR]'].concat([].slice.call(arguments)));
    } catch (e) {}
  }

  function isHtml() {
    try { return !!(rcmail.editor || (rcmail.env && rcmail.env.compose_html)); }
    catch (e) { return !!document.querySelector('.mce-content-body'); }
  }

  function editorReady() {
    if (!isHtml()) return true;
    try { return !!(rcmail.editor && rcmail.editor.getBody()); }
    catch (e) { return false; }
  }

  function waitForEditor(cb, tries) {
    tries = typeof tries === 'number' ? tries : 80; // ~8s
    if (editorReady()) { try { cb(); } catch (e) { SR_LOG('cb error', e); } return; }
    if (tries <= 0) { SR_LOG('editor never ready'); return; }
    setTimeout(function () { waitForEditor(cb, tries - 1); }, 100);
  }

  function identity() {
    var s = document.querySelector(
      'select[name="_from"], select#from, select[name="_identity"]'
    );
    if (s && s.value) return s.value;
    if (rcmail.env && (rcmail.env.identity || rcmail.env.ident))
      return rcmail.env.identity || rcmail.env.ident;
    if (s && s.options && s.options.length)
      return s.options[s.selectedIndex >= 0 ? s.selectedIndex : 0].value;
    return null;
  }

  function token() {
    return rcmail.env.request_token;
  }

  function fetchVariants(iid, cb) {
    var url =
      '?_task=settings&_action=plugin.sr_get_variants&_id=' +
      encodeURIComponent(iid || '') +
      '&_token=' +
      encodeURIComponent(token());
    var x = new XMLHttpRequest();
    x.open('GET', url, true);
    x.timeout = 8000;
    x.onload = function () {
      var r = {};
      try {
        r = JSON.parse(x.responseText);
      } catch (e) {
        log('bad JSON from server');
      }
      log(
        'fetch variants status=',
        x.status,
        'variants=',
        r && r.variants ? r.variants.length : 0,
        'iid=',
        iid
      );
      cb && cb(r);
    };
    x.onerror = function () {
      log('fetch variants network error');
      cb && cb({ variants: [] });
    };
    x.ontimeout = function () {
      log('fetch variants timeout');
      cb && cb({ variants: [] });
    };
    x.send();
  }

  function pick(list, lastVid, forceDifferent) {
    var a = (list || []).filter(function (v) {
      return !!v.include && parseFloat(v.weight || 1) > 0;
    });
    if (!a.length) return null;
    var tries = forceDifferent ? Math.max(2, a.length) : 1;
    var chosen = null;
    while (tries--) {
      var total = a.reduce(function (s, v) {
        var w = parseFloat(v.weight || 1);
        return s + (isNaN(w) ? 1 : Math.max(0, w));
      }, 0);
      var r = Math.random() * total,
        acc = 0;
      for (var i = 0; i < a.length; i++) {
        var w = Math.max(0, parseFloat(a[i].weight || 1) || 1);
        acc += w;
        if (r <= acc) {
          chosen = a[i];
          break;
        }
      }
      if (!chosen) chosen = a[a.length - 1];
      if (!forceDifferent || !lastVid || chosen.vid !== lastVid) break;
    }
    return chosen;
  }

  function stripExisting(body, htmlMode) {
  if (htmlMode) {
    var d = document.createElement('div');
    d.innerHTML = body || '';
    var sigs = d.querySelectorAll('.rcmSig,.signature,.rcm-signature');
    if (sigs.length) sigs[sigs.length - 1].remove();
    return d.innerHTML;
  }
  var lines = (body || '').split(/\r?\n/);
  for (var i = lines.length - 1; i >= 0; i--) {
    if (/^--\s?$/.test(lines[i]) || /^__+$/.test(lines[i]) || /^\s*—/.test(lines[i])) {
      lines = lines.slice(0, i);
      break;
    }
  }
  return lines.join('\n');
}

  function block(htmlMode, html) {
    if (htmlMode) return '<div class="rcmSig">' + (html || '') + '</div>';
    var txt = (html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
    return txt + '\n';
  }


  function insertRandom(forceDifferent) {
    if (
      typeof rcmail.env.sr_enabled !== 'undefined' &&
      !rcmail.env.sr_enabled
    ) {
      log('disabled via env');
      return;
    }
    var iid = identity();
    if (!iid) {
      log('no identity');
      return;
    }
    fetchVariants(iid, function (res) {
      var v = pick(res.variants || [], state.last_vid, !!forceDifferent);
      if (!v) {
        log('no active variants');
        return;
      }
      var htmlMode = isHtml();
      var body = getBody() || '';
      body = stripExisting(body, htmlMode);
      var sig = block(htmlMode, v.html);
if (htmlMode) {
  var below = !rcmail.env.sig_above;
  var ok = sr_insert_html(sig, !below);
  if (!ok) {
    var d = document.createElement('div');
    var body2 = (function(){try{var b = getBody()||''; return stripExisting(b, true);}catch(_){return getBody()||'';}})();
    var spacer = '<p><br data-mce-bogus="1"></p><p><br data-mce-bogus="1"></p><p><br data-mce-bogus="1"></p>';
    d.innerHTML = body2;
    d.innerHTML = below ? (d.innerHTML + sig) : (spacer + sig + d.innerHTML);
    setBody(d.innerHTML);
  window.__SR_INSERTED = true;}
} else {
  var txt = body || '';
  var below = !rcmail.env.sig_above;
  setBody(below ? (txt + '\n' + sig) : ('\n\n\n' + sig + '\n' + txt));
}
state.last_vid = v.vid;
      log('inserted vid=', v.vid);
    });
  }

  
// Auto-insert once on compose open if enabled
try {
  if (
    rcmail && rcmail.env && rcmail.env.task === 'mail' &&
    String(rcmail.env.action || '').indexOf('compose') === 0
  ) {
    if (!window.__SR_AUTO_SCHEDULED) {
      window.__SR_AUTO_SCHEDULED = true;
      SR_LOG('compose detected, scheduling auto-insert');
      sr_wait_for_editor(function(){ if (window.__SR_INSERTING || window.__SR_INSERTED) { SR_LOG('skip auto: busy or already'); return; } try { insertRandom(false); } catch (e) { SR_LOG('auto insert error', e); }
      });
    }
  }
} catch (e) { SR_LOG('auto insert setup error', e); }


function ensureToolbarButton() {
  try {
    var bar =
      document.querySelector('#compose-toolbar') ||
      document.querySelector('.compose-toolbar') ||
      document.querySelector('.toolbar');
    if (!bar) return; if (bar.__sr_button) return;

    var a = document.createElement('a');
    a.className = 'button sr-shuffle';
    a.href = '#';
    a.title =
      (rcmail.gettext &&
        rcmail.gettext('sr_toolbar_shuffle', 'signature_randomizer')) ||
      'Shuffle signature';
    a.textContent = 'Shuffle';
    a.addEventListener('click', function (e) {
      e.preventDefault();
      // allow replacement on click
      window.__SR_INSERTED = false;
      sr_wait_for_editor(function () { insertRandom(true); });
    });
    bar.appendChild(a);
    bar.__sr_button = a;
  } catch (e) { SR_LOG('ensureToolbarButton error', e); }
}

function bootForCompose() {
  try {
    if (window.__SR_BOOTED) { SR_LOG('skip boot: already booted'); return; }
    window.__SR_BOOTED = true;
    var form =
      document.getElementById('composeform') ||
      document.querySelector('form[action*="compose"]') ||
      document.getElementById('composebody') ||
      document.body;
    var anchor = (form && form.id ? form.id : 'compose') + ':' + Date.now();
    resetStateForNewCompose(anchor);

    log('compose-init: booting SR for', anchor);
    ensureToolbarButton();

    sr_wait_for_editor(function () {
      if (window.__SR_INSERTING || window.__SR_INSERTED) {
        SR_LOG('skip auto: busy or already');
        return;
      }
      insertRandom(false);
    });

    if (rcmail && rcmail.addEventListener) {
      rcmail.addEventListener('change_identity', function () {
        window.__SR_INSERTED = false;
        sr_wait_for_editor(function () { insertRandom(true); });
      });
    }
  } catch (e) { SR_LOG('bootForCompose error', e); }
}

rcmail.addEventListener('compose-init', function () {
  bootForCompose();
});

rcmail.addEventListener('init', function () {
  var act = String(rcmail.env.action || '');
  if (act.indexOf('compose') === 0 || /compose/.test(window.location.search)) {
    bootForCompose();
  }
});
})();
/* Signature Randomizer identities UI */
(function () {

// === SR: Rich editor support ===
function sr_init_editor(ta, v) {
  try {
    if (!ta || !window.tinymce) return;
    if (!ta.id) ta.id = 'sr_html_' + (v && v.vid ? v.vid : (Date.now()+Math.random().toString(16).slice(2)));
    var ex = window.tinymce.get(ta.id);
    if (ex) { try { ex.remove(); } catch(_) {} }
    var base = (window.tinymce.editors && window.tinymce.editors.length)
      ? (window.tinymce.editors[0].settings || {}) : {};
    var cfg = {};
    for (var k in base) { try { cfg[k] = base[k]; } catch(e) {} }
    delete cfg.selector; delete cfg.mode; delete cfg.elements; delete cfg.target;
    cfg.target = ta;
    if (!cfg.height) cfg.height = 180;
    cfg.setup = function (ed) {
      ed.on('init', function () { try { ed.setContent(ta.value || ''); } catch(e) {} });
      var upd = function(){ try { v.html = ed.getContent(); } catch(e) {} };
      ed.on('change keyup undo redo SetContent', upd);
    };
    window.tinymce.init(cfg);
  } catch (e) { try { console.warn('[SR] editor init failed', e); } catch(_){}} 
}
function sr_destroy_all_editors() {
  if (!window.tinymce) return;
  try {
    var list = document.querySelectorAll('textarea.sr-html');
    for (var i=0;i<list.length;i++) {
      var id = list[i].id;
      if (id) {
        var ed = window.tinymce.get(id);
        if (ed) ed.remove();
      }
    }
  } catch(_) {}
}
// === end SR: Rich editor support ===
  if (!window.rcmail) return;

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $all(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function t(key) {
    return (
      rcmail.gettext(key, 'signature_randomizer') ||
      rcmail.gettext(key) ||
      key
    );
  }

  function token() {
    return rcmail.env.request_token;
  }

  function iid() {
    const el = $('input[name="_iid"], input[name="identity_id"]');
    return el ? el.value : rcmail.env.sr_identity_id || null;
  }

  function escHtml(s) {
    return String(s).replace(/[&<>\"']/g, (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c]
    );
  }

  function showDialog(title, html) {
    if (rcmail.simple_dialog) {
      rcmail.simple_dialog(html, title);
    } else {
      const w = window.open('', '_blank');
      if (w) {
        w.document.write('<title>' + escHtml(title) + '</title>' + html);
        w.document.close();
      } else {
        alert(title + '\n' + html.replace(/<[^>]+>/g, ''));
      }
    }
  }

  function ajax(method, action, data, cb) {
    data = data || {};
    data._token = token();

    const xhr = new XMLHttpRequest();
    const url = '?_task=settings&_action=' + encodeURIComponent(action);
    const parts = [];

    Object.keys(data).forEach((k) => {
      const v = data[k];
      parts.push(
        encodeURIComponent(k) +
          '=' +
          encodeURIComponent(typeof v === 'string' ? v : JSON.stringify(v))
      );
    });

    if (method === 'GET') {
      xhr.open('GET', url + '&' + parts.join('&'), true);
      xhr.onload = done;
      xhr.send();
    } else {
      xhr.open('POST', url, true);
      xhr.setRequestHeader(
        'Content-Type',
        'application/x-www-form-urlencoded; charset=UTF-8'
      );
      xhr.onload = done;
      xhr.send(parts.join('&'));
    }

    function done() {
      let res = {};
      try {
        res = JSON.parse(xhr.responseText);
      } catch (e) {}
      console.debug('[SR]', action, res);
      cb && cb(res);
    }
  }

  function load() {
    ajax('GET', 'plugin.sr_get_variants', { _id: iid() }, (res) => {
      window._sr_list = res.variants || [];
      render(window._sr_list);
    });
  }

  function render(list) {
    const tb = $('#sr-table tbody');
    if (!tb) return;
    tb.innerHTML = '';
    try { sr_destroy_all_editors(); } catch(_) {}

    if (!list || !list.length) {
      const tr = document.createElement('tr');
      tr.className = 'sr-empty';
      const td = document.createElement('td');
      td.colSpan = 4;
      td.textContent = t('sr_no_variants');
      tr.appendChild(td);
      tb.appendChild(tr);
      return;
    }

    list.forEach((v) => {
      const tr = document.createElement('tr');
      tr.className = 'sr-row';
      tr.dataset.vid = v.vid;

      const td1 = document.createElement('td');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'checkbox';
      cb.checked = !!v.include;
      cb.onchange = () => {
        v.include = cb.checked;
        save(v);
      };
      td1.appendChild(cb);

      const td2 = document.createElement('td');
      const name = document.createElement('input');
      name.type = 'text';
      name.className = 'txt';
      name.placeholder = t('sr_new_variant');
      name.value = v.name || '';
      name.addEventListener('focus', () => {
        if (name.value === '') name.placeholder = '';
      });
      name.addEventListener('blur', () => {
        if (name.value === '') name.placeholder = t('sr_new_variant');
      });
      name.onchange = () => {
        v.name = name.value;
        save(v);
      };
      td2.appendChild(name);

      const td3 = document.createElement('td');
      const w = document.createElement('input');
      w.type = 'number';
      w.className = 'txt';
      w.min = '0';
      w.step = '0.1';
      w.style.maxWidth = '90px';
      w.value = v.weight != null ? v.weight : 1;
      w.onchange = () => {
        v.weight = parseFloat(w.value) || 0;
        save(v);
      };
      td3.appendChild(w);

      const td4 = document.createElement('td');
      const act = document.createElement('div');
      act.className = 'sr-actions';

      function btn(label, cmd) {
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'button';
        a.dataset.cmd = cmd;
        a.textContent = label;
        act.appendChild(a);
        return a;
      }

      btn(t('sr_save'), 'save');
      btn(t('sr_preview'), 'preview');
      btn(t('sr_duplicate'), 'duplicate');
      const up = btn('↑', 'up');
      up.title = t('sr_move_up');
      const down = btn('↓', 'down');
      down.title = t('sr_move_down');
      btn(t('sr_delete'), 'delete');

      td4.appendChild(act);

      tr.appendChild(td1);
      tr.appendChild(td2);
      tr.appendChild(td3);
      tr.appendChild(td4);
      tb.appendChild(tr);

      const er = document.createElement('tr');
      er.className = 'sr-editor-row';
      er.dataset.vid = v.vid;
      const tdd = document.createElement('td');
      tdd.colSpan = 4;
      const label = document.createElement('div');
      label.className = 'sr-html-label';
      label.textContent = t('sr_html');
      const ta = document.createElement('textarea');
      ta.className = 'txt sr-html';
      ta.rows = 4;
      ta.value = v.html || '';
      setTimeout(function(){ sr_init_editor(ta, v); }, 0);
      ta.addEventListener('focus', () => {
        if (ta.placeholder) ta.placeholder = '';
      });
      ta.oninput = () => {
        v.html = ta.value;
      };
      tdd.appendChild(label);
      tdd.appendChild(ta);
      er.appendChild(tdd);
      tb.appendChild(er);
    });
  }

  function findVariant(vid) {
    return (window._sr_list || []).find((x) => x.vid === vid);
  }

  function save(v, toast) {
    if (!v.vid)
      v.vid = 'v' + Date.now() + Math.random().toString(16).slice(2);
    ajax('POST', 'plugin.sr_save_variant', { _id: iid(), _variant: v }, (res) => {
      if (toast && res.ok)
        rcmail.display_message(t('sr_saved'), 'confirmation');
      load();
    });
  }

  function add() {
    const v = {
      vid: 'v' + Date.now() + Math.random().toString(16).slice(2),
      name: '',
      include: true,
      weight: 1,
      html: getIdentitySignatureHTML(),
    };
    ajax('POST', 'plugin.sr_save_variant', { _id: iid(), _variant: v }, () => {
      load();
      setTimeout(() => {
        const last = $all('#sr-table tbody tr.sr-row input.txt').pop();
        if (last) last.focus();
      }, 80);
    });
  }

  function delVariant(vid) {
    ajax('POST', 'plugin.sr_delete_variant', { _id: iid(), _vid: vid }, load);
  }

  function duplicate(vid) {
    ajax('POST', 'plugin.sr_duplicate_variant', { _id: iid(), _vid: vid }, load);
  }

  function reorder(vid, dir) {
    const list = window._sr_list || [];
    const i = list.findIndex((x) => x.vid === vid);
    if (i < 0) return;
    const ni = i + dir;
    if (ni < 0 || ni >= list.length) return;
    const t0 = list[i];
    list[i] = list[ni];
    list[ni] = t0;
    ajax(
      'POST',
      'plugin.sr_reorder_variants',
      { _id: iid(), _order: list.map((x) => x.vid) },
      load
    );
  }

  function preview(v) {
    const html =
      '<div style="padding:12px;border:1px solid rgba(0,0,0,.1);max-height:420px;overflow:auto;">' +
      (v.html || '') +
      '</div>';
    showDialog(t('sr_preview_title'), html);
  }

  /*** PATCHED: Export always opens a modal ***/
  function exportJSON() {
    ajax('GET', 'plugin.sr_export', { _id: iid() }, (res) => {
      const json = JSON.stringify(res.variants || [], null, 2);
      const html =
        '<textarea id="sr-export-ta" style="width:100%;height:260px;">' +
        escHtml(json) +
        '</textarea>';
      showDialog(t('sr_export_title'), html);
    });
  }

  /*** PATCHED: Import shows exact example JSON in the textarea ***/
  function importJSON() {
    const example = [
      {
        name: 'Formal',
        include: true,
        weight: 2,
        html: '<p>Regards,<br>Gene</p>',
      },
      { name: 'Casual', include: true, weight: 1, html: '<p>– G</p>' },
    ];
    const html =
      '<textarea id="sr-import-ta" style="width:100%;height:260px;">' +
      escHtml(JSON.stringify(example, null, 2)) +
      '</textarea>' +
      '<div style="margin-top:8px; text-align:right;">' +
      '<button type="button" class="button mainaction" id="sr-import-now">' +
      t('sr_import_btn') +
      '</button>' +
      '</div>';
    showDialog(t('sr_import_title'), html);
    setTimeout(() => {
      const btn = $('#sr-import-now');
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const ta = $('#sr-import-ta');
        if (!ta) return;
        const txt = ta.value || '[]';
        try {
          JSON.parse(txt);
        } catch (e) {
          alert(t('sr_invalid_json'));
          return;
        }
        ajax('POST', 'plugin.sr_import', { _id: iid(), _json: txt }, () => {
          rcmail.display_message(t('sr_saved'), 'confirmation');
          if (rcmail.simple_dialog_close) rcmail.simple_dialog_close();
          load();
        });
      });
    }, 60);
  }

  function getIdentitySignatureHTML() {
    try {
      if (rcmail.editor)
        return rcmail.editor.getContent({ format: 'raw' }) || '';
    } catch (e) {}
    const ta = $(
      'textarea[name="signature"], textarea[name="_signature"]'
    );
    return ta ? ta.value : '';
  }

  function bindToolbar(container) {
    container.addEventListener('click', (e) => {
      const el = e.target.closest('[data-cmd]');
      if (!el) return;
      e.preventDefault();
      const cmd = el.dataset.cmd;
      if (cmd === 'add') add();
      else if (cmd === 'export') exportJSON();
      else if (cmd === 'import') importJSON();
      else if (cmd === 'shuffle_preview') {
        const list = (window._sr_list || []).filter((v) => !!v.include);
        if (!list.length) {
          alert('No active variants');
          return;
        }
        const total = list.reduce((s, v) => {
          const w = parseFloat(v.weight || 1);
          return s + (isNaN(w) ? 1 : Math.max(0, w));
        }, 0);
        const r = Math.random() * total;
        let acc = 0;
        let pick = list[0];
        for (let i = 0; i < list.length; i++) {
          const w = Math.max(0, parseFloat(list[i].weight || 1) || 1);
          acc += w;
          if (r <= acc) {
            pick = list[i];
            break;
          }
        }
        const ta = $(
          '#sr-table .sr-editor-row[data-vid="' + pick.vid + '"] textarea.sr-html'
        );
        if (ta) ta.focus();
      }
    });
  }

  function bindRowDelegation() {
    const table = $('#sr-table');
    if (!table) return;
    table.addEventListener('click', (e) => {
      if (!e.target.closest('.sr-actions')) return;
      const a = e.target.closest('a.button');
      if (!a) return;
      const row = e.target.closest('tr.sr-row');
      if (!row) return;
      const vid = row.dataset.vid;
      const v = findVariant(vid);
      if (!v) return;
      const cmd = a.dataset.cmd;
      e.preventDefault();
      if (cmd === 'save') save(v, true);
      else if (cmd === 'preview') preview(v);
      else if (cmd === 'duplicate') duplicate(vid);
      else if (cmd === 'up') reorder(vid, -1);
      else if (cmd === 'down') reorder(vid, 1);
      else if (cmd === 'delete') delVariant(vid);
    });
  }

  rcmail.addEventListener('init', () => {
    if (
      rcmail.env.task === 'settings' &&
      rcmail.env.action &&
      rcmail.env.action.indexOf('edit-identity') === 0
    ) {
      const c = $('#sr-manager');
      if (c) bindToolbar(c);
      bindRowDelegation();
      load();
    }
  });
})();

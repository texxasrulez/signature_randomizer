/* Signature Randomizer identities UI */
(function () {
  if (!window.rcmail) return;

  var state = {
    last_vid: null,
    boundForComposeId: null
  };

  function log() {
    try {
      console.debug.apply(console, ['[SR]'].concat([].slice.call(arguments)));
    } catch (e) {}
  }

  function isHtml() {
    return !!rcmail.env.compose_html;
  }

  function editorReady() {
    if (!isHtml()) return true;
    try {
      return !!(rcmail.editor && rcmail.editor.getBody());
    } catch (e) {
      return false;
    }
  }

  function waitForEditor(cb, tries) {
    tries = typeof tries === 'number' ? tries : 80; // ~8s
    if (editorReady()) {
      cb();
      return;
    }
    if (tries <= 0) {
      log('editor not ready; proceeding anyway');
      cb();
      return;
    }
    setTimeout(function () {
      waitForEditor(cb, tries - 1);
    }, 100);
  }

  function bodyEl() {
    if (isHtml() && rcmail.editor) {
      try {
        return rcmail.editor.getBody();
      } catch (e) {}
    }
    return (
      document.getElementById('composebody') ||
      document.querySelector('textarea[name="composebody"]')
    );
  }

  function getBody() {
    if (isHtml() && rcmail.editor) {
      try {
        return rcmail.editor.getContent({ format: 'raw' }) || '';
      } catch (e) {}
    }
    var el = bodyEl();
    return el ? el.value : '';
  }

  function setBody(html) {
    if (isHtml() && rcmail.editor) {
      try {
        rcmail.editor.setContent(html || '', { format: 'raw' });
        return;
      } catch (e) {}
    }
    var el = bodyEl();
    if (el) {
      el.value = (html || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '');
    }
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
      if (
        /^--\s?$/.test(lines[i]) ||
        /^__+$/.test(lines[i]) ||
        /^\s*—/.test(lines[i])
      ) {
        lines = lines.slice(0, i);
        break;
      }
    }
    return lines.join('\n');
  }

  function block(htmlMode, html) {
    if (htmlMode) return '<div class="rcmSig">' + (html || '') + '</div>';
    var txt = (html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '');
    return '-- \n' + txt + '\n';
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
        var d = document.createElement('div');
        d.innerHTML = body;
        var below = !rcmail.env.sig_above;
        d.innerHTML = below ? d.innerHTML + sig : sig + d.innerHTML;
        setBody(d.innerHTML);
      } else {
        var txt = body;
        var below = !rcmail.env.sig_above;
        setBody(below ? txt + '\n' + sig : sig + '\n' + txt);
      }
      state.last_vid = v.vid;
      log('inserted vid=', v.vid);
    });
  }

  function ensureToolbarButton() {
    try {
      rcmail.register_command(
        'plugin.sr_shuffle',
        function () {
          waitForEditor(function () {
            insertRandom(true);
          });
        },
        true
      );
    } catch (e) {}

    var bar =
      document.getElementById('compose-toolbar') ||
      document.querySelector('.toolbar');
    if (!bar || bar.querySelector('.sr-shuffle')) return;

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
      waitForEditor(function () {
        insertRandom(true);
      });
    });
    bar.appendChild(a);
  }

  function resetStateForNewCompose(anchor) {
    state.last_vid = null;
    state.boundForComposeId = anchor;
  }

  function bootForCompose() {
    var form =
      document.getElementById('compose-content') ||
      document.getElementById('composebody') ||
      document.body;
    var anchor = (form && form.id ? form.id : 'compose') + ':' + Date.now();
    resetStateForNewCompose(anchor);

    log('compose-init: booting SR for', anchor);
    ensureToolbarButton();

    waitForEditor(function () {
      insertRandom(false);
    });
    [600, 1500, 3000].forEach(function (ms) {
      setTimeout(function () {
        waitForEditor(function () {
          insertRandom(false);
        });
      }, ms);
    });

    rcmail.addEventListener('change_identity', function () {
      waitForEditor(function () {
        insertRandom(true);
      });
    });
  }

  rcmail.addEventListener('compose-init', function () {
    bootForCompose();
  });

  rcmail.addEventListener('init', function () {
    var act = String(rcmail.env.action || '');
    if (
      act.indexOf('compose') === 0 ||
      /compose/.test(window.location.search)
    ) {
      bootForCompose();
    }
  });
})();

/* History-based breadcrumb for BloWeD Consulting.
 * Each page carries <nav class="crumbs" data-crumb-label="…" data-crumb-href="…">.
 * The trail is the pages this visitor opened in this browser tab, in order:
 * opening a page already in the trail cuts the trail back to it, a new page
 * is added at the end, and only the last 5 are kept.
 * The Home page carries data-crumb-start: it shows no breadcrumb and starts
 * a fresh trail, so "Home" appears as the first link once the visitor moves on. */
(function () {
  var KEY = 'blowed-crumbs';
  var MAX = 5;
  var memory = [];

  function load() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || '[]') || []; }
    catch (e) { return memory; }
  }
  function save(trail) {
    memory = trail;
    try { sessionStorage.setItem(KEY, JSON.stringify(trail)); } catch (e) { /* storage blocked */ }
  }

  var started = false;

  function render(el) {
    var label = el.getAttribute('data-crumb-label');
    var href = el.getAttribute('data-crumb-href');
    if (!label || !href) return;
    if (el.hasAttribute('data-crumb-start')) {
      if (!started) { started = true; save([{ label: label, href: href }]); }
      return;
    }
    if (el.querySelector('ol')) return;

    var trail = load().filter(function (c) { return c && c.label && c.href; });
    var at = -1;
    for (var i = 0; i < trail.length; i++) if (trail[i].href === href) { at = i; break; }
    if (at >= 0) trail = trail.slice(0, at + 1);
    else trail.push({ label: label, href: href });
    if (trail.length > MAX) trail = trail.slice(trail.length - MAX);
    save(trail);

    var ol = document.createElement('ol');
    trail.forEach(function (c, i) {
      var li = document.createElement('li');
      if (i === trail.length - 1) {
        var span = document.createElement('span');
        span.setAttribute('aria-current', 'page');
        span.textContent = c.label;
        li.appendChild(span);
      } else {
        var a = document.createElement('a');
        a.href = c.href;
        a.textContent = c.label;
        li.appendChild(a);
      }
      ol.appendChild(li);
    });
    el.innerHTML = '';
    el.appendChild(ol);
  }

  function scan() {
    var els = document.querySelectorAll('[data-crumb-href]');
    for (var i = 0; i < els.length; i++) render(els[i]);
    return els.length > 0;
  }

  // Pages may render (or re-render) after this script runs, so keep watching.
  function start() {
    scan();
    new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

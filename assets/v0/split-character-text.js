<script>
(function(){
  if (window.__charsGlobalInit) return; window.__charsGlobalInit = true;

  function splitChars(hostEl){
    const targetSel = hostEl.getAttribute('data-animate-chars-target');
    const targets = targetSel ? hostEl.querySelectorAll(targetSel) : [hostEl];
    if (!targets || !targets.length) return;

    const inc = parseFloat(hostEl.getAttribute('data-animate-delay') || '0.01');

    targets.forEach((target) => {
      if (!target || target.dataset.charsInit === '1') return;

      const text = target.textContent || '';
      target.textContent = '';

      const inner = document.createElement('span');
      inner.setAttribute('data-animate-chars-inner','');

      const frag = document.createDocumentFragment();
      for (let i = 0; i < text.length; i++){
        const ch = text[i];
        const s = document.createElement('span');
        s.textContent = ch;
        if (ch === ' ') s.style.whiteSpace = 'pre';
        s.style.transitionDelay = (i * inc) + 's';
        frag.appendChild(s);
      }
      inner.appendChild(frag);
      target.appendChild(inner);
      target.dataset.charsInit = '1';
    });

    // Touch pulse (visual hint)
    const pulse = () => {
      hostEl.setAttribute('data-animate-pulse','1');
      clearTimeout(hostEl.__pulseTO);
      hostEl.__pulseTO = setTimeout(()=> hostEl.removeAttribute('data-animate-pulse'), 700);
    };
    if (!hostEl.__pulseBound) {
      hostEl.__pulseBound = true;
      hostEl.addEventListener('touchstart', pulse, { passive:true });
    }
  }

  function ensureOptIn(el){
    if (!el.hasAttribute('data-animate-chars')) el.setAttribute('data-animate-chars','');
    splitChars(el);
  }

  function initList(listEl){
    if (!listEl || listEl.__charsListInit) return;
    listEl.__charsListInit = true;

    const sel       = listEl.getAttribute('data-animate-chars-selector') || 'a';
    const targetSel = listEl.getAttribute('data-animate-chars-target') || null;
    const listDelay = listEl.getAttribute('data-animate-delay');

    listEl.querySelectorAll(sel).forEach((link) => {
      if (!link.hasAttribute('data-animate-chars')) link.setAttribute('data-animate-chars','');
      if (targetSel && !link.hasAttribute('data-animate-chars-target')) link.setAttribute('data-animate-chars-target', targetSel);
      if (listDelay && !link.hasAttribute('data-animate-delay')) link.setAttribute('data-animate-delay', listDelay);
      splitChars(link);
    });
  }

  function scan(root){
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('[data-animate-chars]').forEach(ensureOptIn);
    if (root.nodeType === 1 && root.hasAttribute && root.hasAttribute('data-animate-chars')) ensureOptIn(root);
    root.querySelectorAll('[data-animate-chars-list]').forEach(initList);
    if (root.nodeType === 1 && root.hasAttribute && root.hasAttribute('data-animate-chars-list')) initList(root);
  }

  document.addEventListener('DOMContentLoaded', () => scan(document));

  // Batched observer
  let scheduled = false;
  const queue = new Set();
  const scheduleScan = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      for (const n of queue) scan(n);
      queue.clear();
    });
  };

  const mo = new MutationObserver((muts)=>{
    for (let i=0;i<muts.length;i++) {
      const m = muts[i];
      if (m.type === 'childList') {
        m.addedNodes && m.addedNodes.forEach?.(n => { if (n.nodeType === 1) { queue.add(n); } });
      } else if (m.type === 'attributes') {
        const t = m.target;
        if (t && t.nodeType === 1) queue.add(t);
      }
    }
    scheduleScan();
  });

  mo.observe(document.documentElement, {
    subtree:true, childList:true, attributes:true,
    attributeFilter:['data-animate-chars','data-animate-chars-list','data-animate-chars-target','data-animate-delay']
  });
})();
</script>

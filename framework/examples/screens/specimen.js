(() => {
  const part=new URLSearchParams(location.search).get('part')||'ds-note';
  const note='<div class="ds-note"><div class="ds-note__meta"><span class="ds-note__icon" aria-hidden="true">'+dsIcon('note')+'</span><span class="ds-note__meta-text">Avery Chen · Today</span></div><p class="ds-note__body">A useful note, with room to read.\nLine breaks remain part of the content.</p></div>';
  const card='<article class="ds-card ds-card--structured"><header class="ds-card__header"><h2 class="ds-card-title">Review summary</h2><p class="ds-card-sub">Optional supporting context</p></header><div class="ds-card__body"><p>The body is content-driven.</p><p>A second body item uses the shared gap.</p></div><footer class="ds-card__footer"><button class="ds-btn ds-btn--secondary">Cancel</button><button class="ds-btn ds-btn--primary">Continue</button></footer></article>';
  const specimens={
    'ds-note':note+'<div class="ds-note"><p class="ds-note__body">Metadata is optional. No empty gap is reserved.</p></div>',
    'ds-btn':'<div class="ds-row"><button class="ds-btn ds-btn--primary">Primary</button><button class="ds-btn ds-btn--secondary">Secondary</button><button class="ds-btn ds-btn--ghost">Ghost</button><button class="ds-btn ds-btn--primary" disabled>Disabled</button><button class="ds-btn ds-btn--destructive-quiet">Remove</button></div>',
    'ds-input':'<div class="ds-field"><label class="ds-field-label" for="field">Project name</label><input class="ds-input" id="field" value="Northstar launch"><span class="ds-field-hint">A persistent label stays visible.</span></div><input class="ds-input" aria-label="Invalid example" aria-invalid="true" placeholder="Invalid"><input class="ds-input" aria-label="Disabled example" disabled value="Disabled">',
    'ds-floating-field':'<div class="ds-floating-field"><input class="ds-input" id="floating" placeholder=" " value="Northstar launch"><label class="ds-floating-field__label" for="floating">Project name</label></div>',
    'ds-card':card,
    'ds-card--structured':card,
    'ds-list-row':'<div><div class="ds-list-row"><span class="ds-list-row__leading">'+dsIcon('note')+'</span><div class="ds-list-row__content"><div class="ds-list-row__title">Review completed</div><p class="ds-list-row__snippet">Optional secondary content wraps naturally.</p></div><span class="ds-list-row__trailing">Today</span></div><div class="ds-list-row ds-list-row--interactive" tabindex="0" role="button"><span class="ds-list-row__leading">'+dsIcon('check')+'</span><div class="ds-list-row__content"><div class="ds-list-row__title">Interactive row specimen</div></div></div></div>',
    'ds-menu':'<div class="ds-menu-anchor"><button class="ds-btn ds-btn--secondary" data-ds-menu="demo-menu" aria-expanded="false" aria-haspopup="menu">Open menu</button><div class="ds-menu ds-menu--below" id="demo-menu" role="menu"><button class="ds-menu__item" role="menuitem">First action</button><button class="ds-menu__item" role="menuitem">Second action</button></div></div>',
    'ds-stat':'<div class="ds-card ds-stat"><div class="ds-stat__head"><span class="ds-stat__label">Review progress</span></div><strong class="ds-stat__value">72%</strong><span class="ds-stat__context">Fictional metric</span></div>',
    'ds-badge':'<div class="ds-row"><span class="ds-badge">Default</span><span class="ds-badge ds-badge--pill">Pill</span></div>',
    'ds-stack':'<div class="ds-stack"><div class="lab-box">First item</div><div class="lab-box">Second item</div><div class="lab-box">Third item</div></div>',
    'ds-row':'<div class="ds-row"><button class="ds-btn ds-btn--secondary">A wrapping</button><button class="ds-btn ds-btn--secondary">row of</button><button class="ds-btn ds-btn--secondary">related actions</button></div>',
    'ds-section':'<section class="ds-section"><header class="ds-section__heading"><h2>A grouped section</h2><p>Optional context</p></header><div class="ds-section__body"><p>First body item</p><p>Second body item</p></div></section>'
  };
  const host=document.getElementById('specimen');
  host.querySelector('.wb-spec-body').innerHTML='<div class="ds-stack">'+(specimens[part]||'<p>No specimen provider for this entry yet.</p>')+'</div>';
  fetch('/demo/design-system/registry.json').then(r=>r.json()).then(reg=>{
    const entry=[...reg.components,...reg.compositions].find(entry=>entry.class===part);
    if(entry)wbAnatomy.mount(host,entry,'.wb-spec-body');
  });
})();

/* Shared provider tooling: keep product renderers and icon definitions app-owned. */
(() => {
  window.StudioIconGallery = {
    mount({names, render, code, weights, currentWeight, setWeight, searchText = name => name}) {
      const search = document.getElementById('search');
      const weight = document.getElementById('weight');
      const grid = document.getElementById('icons');
      const status = document.getElementById('icon-status');
      grid.classList.add('studio-icon-grid');
      weight.replaceChildren();
      weights.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value[0].toUpperCase() + value.slice(1);
        weight.append(option);
      });
      weight.value = currentWeight;
      async function copy(value, message) {
        try { await navigator.clipboard.writeText(value); status.textContent = message; }
        catch { status.textContent = 'Clipboard unavailable'; }
      }
      function paint() {
        const query = search.value.trim().toLowerCase();
        const visible = names.filter(name => searchText(name).toLowerCase().includes(query));
        grid.replaceChildren();
        status.textContent = visible.length + (visible.length === 1 ? ' icon' : ' icons');
        visible.forEach(name => {
          const card = document.createElement('article');
          card.className = 'studio-icon-card';
          const preview = document.createElement('button');
          preview.type = 'button'; preview.className = 'studio-icon-preview';
          preview.setAttribute('aria-label', 'Copy ' + name + ' code');
          preview.title = code(name);
          preview.innerHTML = render(name, {size:24});
          const label = document.createElement('span'); label.textContent = name;
          preview.append(label);
          preview.onclick = () => copy(code(name), 'Copied ' + name + ' code');
          const svgButton = document.createElement('button');
          svgButton.type = 'button'; svgButton.className = 'studio-icon-copy';
          svgButton.textContent = 'Copy SVG';
          svgButton.setAttribute('aria-label', 'Copy ' + name + ' SVG');
          svgButton.onclick = () => {
            const svg = preview.querySelector('svg').cloneNode(true);
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            ['class','aria-hidden','aria-label','role','focusable'].forEach(attr => svg.removeAttribute(attr));
            // Standalone SVGs must retain visible ink outside the provider's CSS.
            svg.querySelectorAll('[fill="currentColor"], [stroke="currentColor"]').forEach(node => {
              if (node.getAttribute('fill') === 'currentColor') node.setAttribute('fill', '#000000');
              if (node.getAttribute('stroke') === 'currentColor') node.setAttribute('stroke', '#000000');
            });
            if (svg.getAttribute('fill') === 'currentColor') svg.setAttribute('fill', '#000000');
            if (svg.getAttribute('stroke') === 'currentColor') svg.setAttribute('stroke', '#000000');
            copy(new XMLSerializer().serializeToString(svg), 'Copied ' + name + ' SVG');
          };
          card.append(preview, svgButton); grid.append(card);
        });
        if (!visible.length) {
          const empty = document.createElement('p'); empty.textContent = 'No icons found';
          empty.className = 'studio-icon-empty'; grid.append(empty);
        }
      }
      search.oninput = paint;
      weight.onchange = () => { setWeight(weight.value); paint(); };
      paint();
    }
  };
})();

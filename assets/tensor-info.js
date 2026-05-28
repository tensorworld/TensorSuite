(function () {
  // Hypergraph datasets: fetch summary.json from CDN, render compact table
  document.querySelectorAll('[data-summary-url]').forEach(function (section) {
    var url = section.getAttribute('data-summary-url');
    var container = section.querySelector('[data-tensor-table]');
    if (!container) return;

    container.innerHTML = '<p class="tensor-table-loading">Loading tensor info…</p>';

    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var tensors = Array.isArray(data) ? data : (data.tensors || []);
        if (!tensors.length) { container.textContent = 'No tensor data found.'; return; }
        renderHypergraphTable(container, section, tensors, url);
      })
      .catch(function () {
        container.innerHTML = '<p class="tensor-table-loading">Could not load tensor info. <a class="text-link" href="' + url + '">View JSON</a></p>';
      });
  });

  function renderHypergraphTable(container, section, tensors, summaryUrl) {
    var baseUrl = summaryUrl.replace(/\/summary\.json$/, '/');
    var datasetName = baseUrl.split('/').filter(Boolean).pop();

    // Fill shared mode-size info
    var first = tensors[0];
    var modeSize = (first.size || first.dimensions || [])[0];
    var dimsEl = section.querySelector('[data-dims]');
    if (dimsEl && modeSize != null) {
      dimsEl.textContent = 'Mode size: ' + Number(modeSize).toLocaleString() + ' (shared across all modes)';
    }

    var wrap = document.createElement('div');
    wrap.className = 'tensor-pair-table-wrap';

    var table = document.createElement('table');
    table.className = 'tensor-pair-table tensor-info-table';

    var thead = document.createElement('thead');
    var hr = document.createElement('tr');
    ['Order', 'NNZ', 'Download'].forEach(function (label) {
      var th = document.createElement('th');
      th.textContent = label;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    tensors.forEach(function (t) {
      var order = t.order != null ? t.order : (t.name || '').replace(/.*_A/, '');
      var nnz = t.nnz;
      var href = baseUrl + datasetName + '_A' + order + '.tar.gz';

      var row = document.createElement('tr');

      var tdOrder = document.createElement('td');
      tdOrder.textContent = order;
      row.appendChild(tdOrder);

      var tdNnz = document.createElement('td');
      tdNnz.className = 'tensor-nnz';
      tdNnz.textContent = nnz != null ? Number(nnz).toLocaleString() : '—';
      row.appendChild(tdNnz);

      var tdLink = document.createElement('td');
      var a = document.createElement('a');
      a.className = 'text-link';
      a.href = href;
      a.textContent = '[Link]';
      tdLink.appendChild(a);
      row.appendChild(tdLink);

      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);

    container.innerHTML = '';
    container.appendChild(wrap);
  }

  // Local-data datasets (quantum physics, knowledge graph): load pre-built JSON
  document.querySelectorAll('[data-local-summary]').forEach(function (section) {
    var name = section.getAttribute('data-local-summary');
    var container = section.querySelector('[data-tensor-table]');
    if (!container) return;

    fetch('assets/data/' + name + '.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var tensors = Array.isArray(data) ? data : (data.tensors || []);
        if (!tensors.length) return;
        renderLocalTable(container, tensors);
      })
      .catch(function () { /* leave static table intact */ });
  });

  function renderLocalTable(container, tensors) {
    var isBlock = tensors.some(function (t) { return t.nnz_block != null; });
    var headers = ['Name', 'Order', 'Dimensions', 'NNZ'];
    if (isBlock) headers.push('NNZ Block');

    var wrap = document.createElement('div');
    wrap.className = 'tensor-pair-table-wrap';

    var table = document.createElement('table');
    table.className = 'tensor-pair-table';

    var thead = document.createElement('thead');
    var hr = document.createElement('tr');
    headers.forEach(function (label) {
      var th = document.createElement('th');
      th.textContent = label;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    tensors.forEach(function (t) {
      var row = document.createElement('tr');

      function cell(val, isFirst) {
        var td = document.createElement('td');
        if (isFirst) {
          var code = document.createElement('code');
          code.textContent = val || '—';
          td.appendChild(code);
        } else {
          td.className = 'tensor-nnz';
          td.textContent = val != null ? (typeof val === 'number' ? Number(val).toLocaleString() : val) : '—';
        }
        return td;
      }

      row.appendChild(cell(t.name, true));
      row.appendChild(cell(t.order));
      var dimTd = document.createElement('td');
      dimTd.textContent = t.size ? t.size.join(' × ') : (t.dimensions ? t.dimensions.join(' × ') : '—');
      row.appendChild(dimTd);
      row.appendChild(cell(t.nnz));
      if (isBlock) row.appendChild(cell(t.nnz_block));

      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);

    container.innerHTML = '';
    container.appendChild(wrap);
  }
})();

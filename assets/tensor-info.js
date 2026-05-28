(function () {
  document.querySelectorAll('[data-summary-url]').forEach(function (section) {
    var url = section.getAttribute('data-summary-url');
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var tensors = Array.isArray(data) ? data : (data.tensors || []);
        if (tensors.length) augmentTable(section, tensors);
      })
      .catch(function () { /* leave table intact on failure */ });
  });

  function augmentTable(section, tensors) {
    // Build order → nnz lookup
    var nnzMap = {};
    tensors.forEach(function (t) {
      var order = t.order != null
        ? t.order
        : parseInt((t.name || '').replace(/.*_A/, ''), 10);
      nnzMap[order] = t.nnz;
    });

    // Fill shared mode-size line
    var first = tensors[0];
    var modeSize = (first.size || first.dimensions || [])[0];
    var dimsEl = section.querySelector('[data-dims]');
    if (dimsEl && modeSize != null) {
      dimsEl.textContent = 'Mode size: ' + Number(modeSize).toLocaleString()
        + ' (shared across all modes)';
    }

    // Find the existing table and append an NNZ row aligned to column headers
    var table = section.querySelector('.tensor-pair-table');
    if (!table) return;

    var headers = table.querySelectorAll('thead th');
    var orders = Array.from(headers).map(function (th) {
      return parseInt(th.textContent, 10);
    });

    // Remove a previously injected row if re-rendering
    var prev = table.querySelector('.tensor-nnz-row');
    if (prev) prev.parentNode.removeChild(prev);

    var tbody = table.querySelector('tbody');
    if (!tbody) return;

    var row = document.createElement('tr');
    row.className = 'tensor-nnz-row';
    orders.forEach(function (order) {
      var td = document.createElement('td');
      var nnz = nnzMap[order];
      td.textContent = nnz != null ? Number(nnz).toLocaleString() : '—';
      row.appendChild(td);
    });
    tbody.appendChild(row);
  }
})();

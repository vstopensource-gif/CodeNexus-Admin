export function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export function exportToCSV(data, filename) {
  if (!data || data.length === 0) return alert('No data to export');
  const headers = Object.keys(data[0]);
  const csvContent = [headers.join(','), ...data.map(row => headers.map(h => {
    const v = row[h];
    if (v && typeof v === 'object' && v.toDate) {
      return '"' + v.toDate().toISOString().replace(/"/g, '""') + '"';
    }
    const s = String(v ?? '').replace(/"/g, '""');
    return '"' + s + '"';
  }).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename || 'export.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToJSON(data, filename) {
  if (!data || data.length === 0) return alert('No data to export');
  const clean = data.map(item => {
    const out = {};
    Object.entries(item).forEach(([k, v]) => {
      out[k] = (v && typeof v === 'object' && v.toDate) ? v.toDate().toISOString() : v;
    });
    return out;
  });
  const jsonContent = JSON.stringify(clean, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename || 'export.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function renderRows(tbody, rows) {
  tbody.innerHTML = '';
  const frag = document.createDocumentFragment();
  rows.forEach(cells => {
    const tr = document.createElement('tr');
    cells.forEach(cell => {
      const td = document.createElement('td');
      if (cell && cell.type === 'html') {
        td.innerHTML = cell.html;
      } else {
        td.textContent = String(cell ?? '');
      }
      tr.appendChild(td);
    });
    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
}



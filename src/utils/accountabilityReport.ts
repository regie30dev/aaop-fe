import type { DirectoryAccountability } from "../types";

/**
 * Builds and opens a printable "Accountability List" report for a set of
 * accountability records, laid out after uidesign/forms/AAOPForms.xlsx:
 *
 *   Office of the President
 *   Accountability List                         Date Generated: <date>
 *   Name:   <employee>
 *   Office: <office>
 *            Property Accountabilities
 *   No. | Photo | Prop No. | Qty. | Unit | Name and Description | Cost | Date Issued | Status
 *
 * Records are grouped by employee (one form per person, page-broken for print),
 * matching the example: a search that yields all of one person's items produces
 * that person's form. Opens in a new window with a Print button.
 */

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** "ASSIGNED" -> "Assigned". */
function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

interface Group {
  name: string;
  office: string;
  rows: DirectoryAccountability[];
}

function groupByEmployee(items: DirectoryAccountability[]): Group[] {
  const groups = new Map<string, Group>();
  for (const row of items) {
    const key = `${row.issuedTo}||${row.office}`;
    let group = groups.get(key);
    if (!group) {
      group = { name: row.issuedTo, office: row.office, rows: [] };
      groups.set(key, group);
    }
    group.rows.push(row);
  }
  return [...groups.values()];
}

function photoCell(row: DirectoryAccountability): string {
  return row.propertyImage
    ? `<img class="photo" src="${esc(row.propertyImage)}" alt="" />`
    : `<span class="photo photo--none">—</span>`;
}

function rowsHtml(
  group: Group,
  priceByPropertyNo: Record<string, string>,
): string {
  return group.rows
    .map((row, index) => {
      const cost = priceByPropertyNo[row.propertyNo] ?? "—";
      return `<tr>
        <td class="num">${index + 1}</td>
        <td class="ph">${photoCell(row)}</td>
        <td>${esc(row.propertyNo)}</td>
        <td class="num">${esc(row.qty)}</td>
        <td>${esc(row.unit || "—")}</td>
        <td class="desc">${esc(row.property)}</td>
        <td class="cost">${esc(cost)}</td>
        <td>${esc(row.dateIssued)}</td>
        <td>${esc(statusLabel(row.status))}</td>
      </tr>`;
    })
    .join("");
}

function sectionHtml(
  group: Group,
  priceByPropertyNo: Record<string, string>,
  generatedAt: string,
): string {
  return `<section class="form">
    <div class="head">
      <div class="org">Office of the President</div>
      <div class="doc">Accountability List</div>
      <div class="gen">Date Generated: ${esc(generatedAt)}</div>
    </div>
    <div class="meta">
      <div><span class="lbl">Name:</span> ${esc(group.name)}</div>
      <div><span class="lbl">Office:</span> ${esc(group.office)}</div>
    </div>
    <div class="section">Property Accountabilities</div>
    <table>
      <thead>
        <tr>
          <th>No.</th><th>Photo</th><th>Prop No.</th><th>Qty.</th><th>Unit</th>
          <th>Name and Description</th><th>Cost</th><th>Date Issued</th><th>Status</th>
        </tr>
      </thead>
      <tbody>${rowsHtml(group, priceByPropertyNo)}</tbody>
    </table>
    <div class="closing">
      <p class="cert">This list of accountabilities of the employee is based on the database records of the concerned personnel. It is accurate and current. This was printed for official purpose for the conduct of inventory or any related matter pertaining to any purpose it may serve.</p>
      <div class="sign">
        <div class="sign-line"></div>
        <div class="sign-caption">Certified Correct and Complete by the SPMD Head</div>
      </div>
    </div>
  </section>`;
}

const STYLES = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; background: #e5e7eb; }
  .toolbar { position: sticky; top: 0; z-index: 5; display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; background: #fff; border-bottom: 1px solid #ddd; }
  .toolbar button { display: inline-flex; align-items: center; padding: 8px 16px; font-size: 14px; font-weight: 600; border-radius: 6px; border: 1px solid #2563eb; cursor: pointer; }
  .toolbar button:disabled { opacity: 0.7; cursor: progress; }
  .print { background: #2563eb; color: #fff; }
  .close { background: #fff; color: #2563eb; }
  .excel { background: #16794c; color: #fff; border-color: #16794c; }
  /* Waiting spinner shown on the Excel button while the file is being prepared. */
  .spin { display: none; width: 14px; height: 14px; margin-right: 8px; border: 2px solid rgba(255,255,255,0.55); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
  .excel.loading .spin { display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Each .sheet is one A4 page. Physical margins come from the padding here
     (@page margin is 0), so they print on every side. The footer sits in the
     bottom margin band. */
  #pages { display: none; }
  .sheet { position: relative; width: 210mm; min-height: 297mm; padding: 15mm 15mm 18mm; margin: 12px auto; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.15); }
  .sheet-body { height: 264mm; overflow: hidden; }
  .sheet-footer { position: absolute; right: 15mm; bottom: 8mm; font-size: 10px; color: #444; }

  /* Fallback view (shown only if JS pagination doesn't run). */
  #source { max-width: 210mm; margin: 12px auto; padding: 24px 28px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.15); }
  .form + .form { margin-top: 28px; }

  .org { text-align: center; font-size: 26px; font-weight: 400;
    font-family: "Old English Text MT", "UnifrakturCook", "UnifrakturMaguntia", "Blackadder ITC", serif; }
  .doc { text-align: center; font-size: 15px; font-weight: 600; margin-top: 2px; }
  /* Date Generated on its own right-aligned line, two-line gap before Name. */
  .gen { text-align: right; font-size: 12px; color: #444; margin: 4px 0 28px; }
  .meta { margin: 0 0 6px; font-size: 14px; }
  .meta .lbl { font-weight: 700; }
  .section { text-align: center; font-weight: 700; font-size: 14px; margin: 10px 0 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #333; padding: 6px 8px; vertical-align: top; }
  td { text-align: left; }
  th { background: #eef2f7; font-weight: 700; text-align: center; }
  td.num { text-align: center; }
  td.cost { text-align: right; white-space: nowrap; }
  tr { break-inside: avoid; }
  .photo { display: inline-block; width: 40px; height: 40px; object-fit: cover; border: 1px solid #ccc; }
  .photo--none { display: grid; place-items: center; color: #999; }

  /* Certification blurb + signature line below each person's table. Kept as one
     block so they never split across a page break. */
  .closing { break-inside: avoid; }
  .cert { margin: 46px 0 0; font-size: 12px; line-height: 1.5; text-align: justify; text-indent: 2.5em; }
  .sign { width: 340px; margin: 56px 0 0 auto; break-inside: avoid; }
  .sign-line { border-bottom: 1px solid #333; height: 0; }
  .sign-caption { margin-top: 5px; font-size: 12px; font-weight: 600; text-align: center; }

  @page { size: A4; margin: 0; }
  @media print {
    body { background: #fff; }
    .toolbar { display: none; }
    #source { box-shadow: none; margin: 0; }
    .sheet { margin: 0; box-shadow: none; page-break-after: always; }
    .sheet:last-child { page-break-after: auto; }
  }
`;

// Splits the report content into A4 "sheets" and stamps a right-aligned
// "N of X Pages" footer on each. Defines `paginate()` and a `renderReport()`
// the opener calls to swap in fresh content and re-paginate live, then runs
// once on load.
const PAGINATE_JS = `
  function paginate() {
    try {
      var pages = document.getElementById("pages");
      var source = document.getElementById("source");
      pages.style.display = "block"; // must be laid out to measure heights
      pages.innerHTML = ""; // clear any previously-built sheets (re-render safe)
      var body = null;
      function el(t, c) { var e = document.createElement(t); if (c) e.className = c; return e; }
      function addSheet() { var s = el("div", "sheet"); body = el("div", "sheet-body"); s.appendChild(body); pages.appendChild(s); }
      function overflows() { return body.scrollHeight > body.clientHeight + 1; }
      function makeTable(thead) { var t = el("table"); t.appendChild(thead.cloneNode(true)); t.appendChild(el("tbody")); return t; }
      function placeBlock(node) {
        body.appendChild(node);
        if (overflows() && body.children.length > 1) { body.removeChild(node); addSheet(); body.appendChild(node); }
      }
      addSheet();
      var forms = source.querySelectorAll(".form");
      var groups = []; // [startSheetIndex, endSheetIndex] per employee
      for (var i = 0; i < forms.length; i++) {
        var form = forms[i];
        // Each employee starts on a fresh page (the first uses the sheet made above).
        if (i > 0) addSheet();
        var startIdx = pages.querySelectorAll(".sheet").length - 1;
        [".head", ".meta", ".section"].forEach(function (sel) {
          var n = form.querySelector(sel); if (n) placeBlock(n.cloneNode(true));
        });
        var srcTable = form.querySelector("table");
        if (!srcTable) continue;
        var thead = srcTable.querySelector("thead");
        var table = makeTable(thead);
        placeBlock(table);
        var rows = srcTable.querySelectorAll("tbody tr");
        for (var r = 0; r < rows.length; r++) {
          var tb = table.querySelector("tbody");
          var rc = rows[r].cloneNode(true);
          tb.appendChild(rc);
          if (overflows() && tb.children.length > 1) {
            tb.removeChild(rc);
            addSheet();
            table = makeTable(thead);
            body.appendChild(table);
            table.querySelector("tbody").appendChild(rc);
          }
        }
        // Place the certification + signature as ONE block so they can't be
        // split across pages — if they don't fit, they move together.
        var closing = form.querySelector(".closing");
        if (closing) placeBlock(closing.cloneNode(true));
        groups.push([startIdx, pages.querySelectorAll(".sheet").length - 1]);
      }
      // Footer numbers pages within each employee ("1 of 1 Pages"), not the
      // running total across the whole multi-employee report.
      var sheets = pages.querySelectorAll(".sheet");
      for (var g = 0; g < groups.length; g++) {
        var start = groups[g][0];
        var end = groups[g][1];
        var count = end - start + 1;
        for (var k = start; k <= end; k++) {
          var f = el("div", "sheet-footer");
          f.textContent = (k - start + 1) + " of " + count + " Pages";
          sheets[k].appendChild(f);
        }
      }
      source.style.display = "none"; // pagination succeeded — hide the fallback
    } catch (e) {
      var p = document.getElementById("pages"); if (p) p.style.display = "none";
    }
  }
  // Called by the opener to push fresh report content in real time — swaps the
  // source HTML and re-paginates without reloading the window.
  window.renderReport = function (bodyHtml) {
    var source = document.getElementById("source");
    if (!source) return;
    source.style.display = "block";
    source.innerHTML = bodyHtml;
    paginate();
  };
  paginate();
`;

// Drives the "Export to Excel" button: shows a spinner while the app builds the
// file server-side, until the browser's save-file dialog / download appears.
const EXPORT_JS = `
  function doExport() {
    var btn = document.getElementById("excelBtn");
    if (!btn || btn.disabled) return;
    var fn = window.opener && window.opener.__aaopExportXlsx;
    if (!fn) { alert("Please reopen Reports and try again."); return; }
    var label = btn.querySelector(".excel-label");
    var original = label.textContent;
    btn.disabled = true;
    btn.classList.add("loading");
    label.textContent = "Preparing\\u2026";
    Promise.resolve()
      .then(function () { return fn(); })
      .catch(function () { alert("Sorry, the Excel export failed."); })
      .then(function () {
        btn.disabled = false;
        btn.classList.remove("loading");
        label.textContent = original;
      });
  }
`;

/** Builds just the report body (the per-employee sections) — swapped into the
 *  popup's #source on both first render and live updates. */
function buildBodyHtml(
  items: DirectoryAccountability[],
  priceByPropertyNo: Record<string, string>,
): string {
  const generatedAt = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return items.length
    ? groupByEmployee(items)
        .map((g) => sectionHtml(g, priceByPropertyNo, generatedAt))
        .join("")
    : `<p style="text-align:center;color:#666">No records to report.</p>`;
}

/** Wraps the body in the full popup document (styles, toolbar, scripts). */
function buildReportDocument(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Accountability List — Report</title>
    <style>${STYLES}</style>
  </head>
  <body>
    <div class="toolbar">
      <button class="excel" id="excelBtn" type="button" onclick="doExport()"><span class="spin" aria-hidden="true"></span><span class="excel-label">Export to Excel</span></button>
      <button class="print" type="button" onclick="window.print()">Print</button>
      <button class="close" type="button" onclick="window.close()">Close</button>
    </div>
    <div id="pages"></div>
    <div id="source">${bodyHtml}</div>
    <script>${PAGINATE_JS}</script>
    <script>${EXPORT_JS}</script>
  </body>
</html>`;
}

// Bridge: the Excel export runs in the app (it calls the backend), not the
// popup, so the popup's "Export to Excel" button calls back into this window.
// Refreshed on every render so it always exports the records currently shown.
function setExportBridge(onExportExcel: () => void | Promise<void>): void {
  (
    window as unknown as { __aaopExportXlsx?: () => Promise<void> }
  ).__aaopExportXlsx = () => Promise.resolve(onExportExcel());
}

type ReportWindow = Window & { renderReport?: (bodyHtml: string) => void };

/**
 * Opens the printable report in a centered popup and returns the window handle
 * (or null if the popup was blocked). Keep the handle to push real-time updates
 * via `updateAccountabilityReport`.
 */
export function openAccountabilityReport(
  items: DirectoryAccountability[],
  priceByPropertyNo: Record<string, string>,
  onExportExcel: () => void | Promise<void>,
): Window | null {
  // Center the report window on the current screen (dual-monitor aware:
  // screenLeft/Top anchor to the monitor the browser is on).
  const width = 1100;
  const height = 850;
  const dualLeft = window.screenLeft ?? window.screenX ?? 0;
  const dualTop = window.screenTop ?? window.screenY ?? 0;
  const availW = window.screen?.availWidth ?? window.innerWidth ?? width;
  const availH = window.screen?.availHeight ?? window.innerHeight ?? height;
  const left = Math.round(dualLeft + Math.max(0, (availW - width) / 2));
  // Horizontally centered, but sit a bit above vertical center (a quarter of
  // the free vertical space rather than half) so it reads higher on screen.
  const top = Math.round(dualTop + Math.max(0, (availH - height) / 4));

  const win = window.open(
    "",
    "_blank",
    `width=${width},height=${height},left=${left},top=${top}`,
  );
  if (!win) {
    // Popup blocked — surface a hint rather than failing silently.
    alert("Please allow pop-ups to view the report.");
    return null;
  }
  setExportBridge(onExportExcel);
  win.document.open();
  win.document.write(buildReportDocument(buildBodyHtml(items, priceByPropertyNo)));
  win.document.close();
  win.focus();
  return win;
}

/**
 * Re-render an already-open report window with fresh data — keeps the report in
 * sync in real time (e.g. after a new accountability is created) with no manual
 * refresh. Uses the popup's own `renderReport` (reliable re-render inside its
 * context); falls back to a full rewrite if it isn't ready yet. No-op if closed.
 */
export function updateAccountabilityReport(
  win: Window,
  items: DirectoryAccountability[],
  priceByPropertyNo: Record<string, string>,
  onExportExcel: () => void | Promise<void>,
): void {
  if (win.closed) return;
  setExportBridge(onExportExcel);
  const body = buildBodyHtml(items, priceByPropertyNo);
  const popup = win as ReportWindow;
  if (typeof popup.renderReport === "function") {
    popup.renderReport(body);
  } else {
    win.document.open();
    win.document.write(buildReportDocument(body));
    win.document.close();
  }
}

const EXPORT_COLUMNS = [
  { key: 'date', label: 'Date', width: 14 },
  { key: 'contentType', label: 'Content Type', width: 16 },
  { key: 'platforms', label: 'Platforms', width: 20 },
  { key: 'pillar', label: 'Pillar', width: 24 },
  { key: 'visualCopy', label: 'Visual Copy', width: 42 },
  { key: 'caption', label: 'Caption', width: 58 },
  { key: 'status', label: 'Status', width: 16 },
  { key: 'reelScript', label: 'Reel Script', width: 58 },
  { key: 'facebookLink', label: 'Facebook Link', width: 34 },
  { key: 'instagramLink', label: 'Instagram Link', width: 34 },
  { key: 'tiktokLink', label: 'TikTok Link', width: 34 },
  { key: 'driveLink', label: 'Drive Link', width: 34 },
  { key: 'approved', label: 'Approved', width: 14 },
];

const MIME_TYPES = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv;charset=utf-8',
  json: 'application/json;charset=utf-8',
};

const pad = (value) => String(value).padStart(2, '0');

export const parseCalendarDate = (value) => {
  if (!value) return null;
  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const date = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfWeek = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const endOfWeek = (date) => {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const getContentCalendarExportPosts = (posts, view, currentDate) => {
  const scopedPosts = view === 'week'
    ? posts.filter((post) => {
      const postDate = parseCalendarDate(post.date);
      return postDate && postDate >= startOfWeek(currentDate) && postDate <= endOfWeek(currentDate);
    })
    : posts;

  return [...scopedPosts].sort((left, right) => {
    const leftTime = parseCalendarDate(left.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightTime = parseCalendarDate(right.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (leftTime !== rightTime) return leftTime - rightTime;
    return (Number(left.sortOrder) || 0) - (Number(right.sortOrder) || 0);
  });
};

export const getContentCalendarPeriodLabel = (view, currentDate) => {
  if (view !== 'week') {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const start = startOfWeek(currentDate);
  const end = endOfWeek(currentDate);
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Week of ${startLabel} - ${endLabel}`;
};

const normalizePlatforms = (platforms) => {
  if (Array.isArray(platforms)) return platforms.join(', ');
  return String(platforms || '');
};

const normalizePost = (post) => ({
  date: parseCalendarDate(post.date) || String(post.date || ''),
  contentType: post.contentType || post.type || '',
  platforms: normalizePlatforms(post.platforms),
  pillar: post.pillar || '',
  visualCopy: post.visualCopy || post.visual || '',
  caption: post.caption || '',
  status: post.status || '',
  reelScript: post.reelScript || '',
  facebookLink: post.fbLink || post.facebookLink || '',
  instagramLink: post.igLink || post.instagramLink || '',
  tiktokLink: post.ttLink || post.tiktokLink || '',
  driveLink: post.driveLink || '',
  approved: post.isChecked ? 'Yes' : 'No',
});

const safeFilenamePart = (value, fallback) => {
  const safeValue = String(value || '')
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return safeValue || fallback;
};

const buildFilename = (clientName, periodLabel, extension) => (
  `${safeFilenamePart(clientName, 'client')}-content-calendar-${safeFilenamePart(periodLabel, 'export')}.${extension}`
);

const triggerBlobDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const escapeXml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const columnName = (index) => {
  let value = index;
  let name = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
};

const excelSerial = (date) => (Date.UTC(
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
) / 86400000) + 25569;

const xlsxCell = (reference, value, style) => {
  if (value instanceof Date) {
    return `<c r="${reference}" s="${style}" t="n"><v>${excelSerial(value)}</v></c>`;
  }
  return `<c r="${reference}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
};

const estimateWrappedLineCount = (value, columnWidth) => {
  if (value instanceof Date) return 1;

  const charactersPerLine = Math.max(8, Math.floor(columnWidth * 0.9));
  return String(value ?? '').split(/\r?\n/).reduce((total, line) => (
    total + Math.max(1, Math.ceil(line.length / charactersPerLine))
  ), 0);
};

export const getContentCalendarXlsxRowHeight = (row) => {
  const lineCount = Math.max(...EXPORT_COLUMNS.map((column) => (
    estimateWrappedLineCount(row[column.key], column.width)
  )));

  return Math.min(408, Math.max(36, (lineCount * 15) + 6));
};

const exportXlsx = async ({ rows, clientName, periodLabel, filename }) => {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const lastColumn = columnName(EXPORT_COLUMNS.length);
  const lastRow = rows.length + 3;
  const createdAt = new Date().toISOString();

  const columnXml = EXPORT_COLUMNS.map((column, index) => (
    `<col min="${index + 1}" max="${index + 1}" width="${column.width}" customWidth="1"/>`
  )).join('');
  const headerCells = EXPORT_COLUMNS.map((column, index) => (
    xlsxCell(`${columnName(index + 1)}3`, column.label, 3)
  )).join('');
  const bodyRows = rows.map((row, rowIndex) => {
    const excelRow = rowIndex + 4;
    const isAlternate = rowIndex % 2 === 1;
    const rowHeight = getContentCalendarXlsxRowHeight(row);
    const cells = EXPORT_COLUMNS.map((column, columnIndex) => {
      const isDate = column.key === 'date' && row[column.key] instanceof Date;
      const style = isDate ? (isAlternate ? 7 : 6) : (isAlternate ? 5 : 4);
      return xlsxCell(`${columnName(columnIndex + 1)}${excelRow}`, row[column.key], style);
    }).join('');
    return `<row r="${excelRow}" ht="${rowHeight}" customHeight="1">${cells}</row>`;
  }).join('');

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`);
  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);
  zip.folder('docProps').file('app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Check Funnel</Application><AppVersion>1.0</AppVersion>
</Properties>`);
  zip.folder('docProps').file('core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(clientName)} Content Calendar</dc:title><dc:creator>Check Funnel</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:modified>
</cp:coreProperties>`);
  zip.folder('xl').file('workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Content Calendar" sheetId="1" r:id="rId1"/></sheets>
  <calcPr calcId="191029" fullCalcOnLoad="1"/>
</workbook>`);
  zip.folder('xl').folder('_rels').file('workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
  zip.folder('xl').file('styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="10"/><name val="Aptos"/><family val="2"/></font>
    <font><b/><sz val="14"/><color rgb="FF0F172A"/><name val="Aptos Display"/></font>
    <font><i/><sz val="10"/><color rgb="FF475569"/><name val="Aptos"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF003870"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF075A9C"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFD9E2EC"/></left><right style="thin"><color rgb="FFD9E2EC"/></right><top style="thin"><color rgb="FFD9E2EC"/></top><bottom style="thin"><color rgb="FFD9E2EC"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="8">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="14" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment vertical="top"/></xf>
    <xf numFmtId="14" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"><alignment vertical="top"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`);
  zip.folder('xl').folder('worksheets').file('sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${columnXml}</cols>
  <sheetData>
    <row r="1" ht="24" customHeight="1">${xlsxCell('A1', `${clientName} Content Calendar`, 1)}</row>
    <row r="2" ht="18" customHeight="1">${xlsxCell('A2', `${periodLabel} | ${rows.length} posts`, 2)}</row>
    <row r="3" ht="24" customHeight="1">${headerCells}</row>
    ${bodyRows}
  </sheetData>
  <autoFilter ref="A3:${lastColumn}${lastRow}"/>
  <mergeCells count="2"><mergeCell ref="A1:${lastColumn}1"/><mergeCell ref="A2:${lastColumn}2"/></mergeCells>
  <pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
  <pageSetup paperSize="8" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`);

  const blob = await zip.generateAsync({ type: 'blob', mimeType: MIME_TYPES.xlsx });
  triggerBlobDownload(blob, filename);
};

const csvSafeValue = (value) => {
  const raw = value instanceof Date
    ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
    : String(value ?? '');
  const protectedValue = /^\s*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${protectedValue.replace(/"/g, '""')}"`;
};

const exportCsv = ({ rows, filename }) => {
  const lines = [
    EXPORT_COLUMNS.map((column) => csvSafeValue(column.label)).join(','),
    ...rows.map((row) => EXPORT_COLUMNS.map((column) => csvSafeValue(row[column.key])).join(',')),
  ];
  triggerBlobDownload(new Blob([`\uFEFF${lines.join('\r\n')}`], { type: MIME_TYPES.csv }), filename);
};

const exportJson = ({ rows, clientName, periodLabel, view, filters, filename }) => {
  const payload = {
    client: clientName,
    period: periodLabel,
    view,
    filters,
    exportedAt: new Date().toISOString(),
    posts: rows.map((row) => ({
      ...row,
      date: row.date instanceof Date
        ? `${row.date.getFullYear()}-${pad(row.date.getMonth() + 1)}-${pad(row.date.getDate())}`
        : row.date,
    })),
  };
  triggerBlobDownload(
    new Blob([JSON.stringify(payload, null, 2)], { type: MIME_TYPES.json }),
    filename,
  );
};

const pdfText = (value) => String(value ?? '')
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201C\u201D]/g, '"')
  .replace(/[\u2013\u2014]/g, '-')
  .replace(/\u2026/g, '...')
  .normalize('NFKD')
  .replace(/[^\x20-\x7E\n\r\t]/g, '');

const PDF_COLUMNS = [
  { key: 'date', label: 'Date', ratio: 0.055 },
  { key: 'contentType', label: 'Content Type', ratio: 0.065 },
  { key: 'platforms', label: 'Platforms', ratio: 0.07 },
  { key: 'pillar', label: 'Pillar', ratio: 0.075 },
  { key: 'visualCopy', label: 'Visual Copy', ratio: 0.105 },
  { key: 'caption', label: 'Caption', ratio: 0.145 },
  { key: 'status', label: 'Status', ratio: 0.055 },
  { key: 'reelScript', label: 'Reel Script', ratio: 0.125 },
  { key: 'facebookLink', label: 'Facebook Link', ratio: 0.065 },
  { key: 'instagramLink', label: 'Instagram Link', ratio: 0.065 },
  { key: 'tiktokLink', label: 'TikTok Link', ratio: 0.065 },
  { key: 'driveLink', label: 'Drive Link', ratio: 0.065 },
  { key: 'approved', label: 'Approved', ratio: 0.045 },
];

const exportPdf = async ({ rows, clientName, periodLabel, filename }) => {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a3', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const contentWidth = pageWidth - (margin * 2);
  const bottomLimit = pageHeight - 30;
  const columnWidths = PDF_COLUMNS.map((column) => contentWidth * column.ratio);
  const tableHeaderHeight = 24;
  const cellPadding = 3;
  const lineHeight = 8;
  let y = 0;

  const drawTableHeader = () => {
    let x = margin;
    pdf.setFillColor(0, 56, 112);
    pdf.setDrawColor(203, 213, 225);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    PDF_COLUMNS.forEach((column, index) => {
      const width = columnWidths[index];
      pdf.setFillColor(0, 56, 112);
      pdf.rect(x, y, width, tableHeaderHeight, 'FD');
      const labelLines = pdf.splitTextToSize(column.label, width - (cellPadding * 2));
      pdf.text(labelLines, x + cellPadding, y + 10, { lineHeightFactor: 1.05 });
      x += width;
    });
    y += tableHeaderHeight;
  };

  const drawPageStart = (addPage = false) => {
    if (addPage) pdf.addPage('a3', 'landscape');
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text(`${pdfText(clientName)} Content Calendar`, margin, 23);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(8);
    pdf.text(`${pdfText(periodLabel)} | ${rows.length} posts`, margin, 39);
    y = 50;
    drawTableHeader();
  };

  const displayValue = (row, key) => {
    if (key === 'date' && row.date instanceof Date) {
      return row.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return row[key];
  };

  drawPageStart();
  rows.forEach((row, rowIndex) => {
    const cellLines = PDF_COLUMNS.map((column, columnIndex) => {
      const text = pdfText(displayValue(row, column.key));
      return pdf.splitTextToSize(text, columnWidths[columnIndex] - (cellPadding * 2));
    });
    const maxLineCount = Math.max(1, ...cellLines.map((lines) => lines.length));
    let lineOffset = 0;

    while (lineOffset < maxLineCount) {
      let availableLines = Math.floor((bottomLimit - y - (cellPadding * 2)) / lineHeight);
      if (availableLines < 1) {
        drawPageStart(true);
        availableLines = Math.floor((bottomLimit - y - (cellPadding * 2)) / lineHeight);
      }

      const chunkLineCount = Math.min(maxLineCount - lineOffset, availableLines);
      const rowHeight = Math.max(18, (chunkLineCount * lineHeight) + (cellPadding * 2));
      let x = margin;
      pdf.setFillColor(rowIndex % 2 === 0 ? 255 : 248, rowIndex % 2 === 0 ? 255 : 250, rowIndex % 2 === 0 ? 255 : 252);
      pdf.setDrawColor(203, 213, 225);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);

      cellLines.forEach((lines, columnIndex) => {
        const width = columnWidths[columnIndex];
        const chunk = lines.slice(lineOffset, lineOffset + chunkLineCount);
        pdf.setFillColor(
          rowIndex % 2 === 0 ? 255 : 248,
          rowIndex % 2 === 0 ? 255 : 250,
          rowIndex % 2 === 0 ? 255 : 252,
        );
        pdf.rect(x, y, width, rowHeight, 'FD');
        if (chunk.length) {
          pdf.text(chunk, x + cellPadding, y + cellPadding + 6, { lineHeightFactor: 1.15 });
        }
        x += width;
      });

      y += rowHeight;
      lineOffset += chunkLineCount;
      if (lineOffset < maxLineCount) drawPageStart(true);
    }
  });

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('Generated by Check Funnel', margin, pageHeight - 10);
    pdf.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }
  pdf.save(filename);
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const printCalendar = ({ rows, clientName, periodLabel }) => {
  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  if (!printWindow) throw new Error('Allow pop-ups to print the calendar.');

  const tableRows = rows.map((row) => `<tr>${EXPORT_COLUMNS.map((column) => {
    const value = row[column.key] instanceof Date
      ? row[column.key].toLocaleDateString('en-US')
      : row[column.key];
    return `<td>${escapeHtml(value).replace(/\r?\n/g, '<br>')}</td>`;
  }).join('')}</tr>`).join('');

  printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(clientName)} Content Calendar</title>
    <style>
      @page { size: A3 landscape; margin: 10mm; }
      body { color: #0f172a; font-family: Arial, sans-serif; margin: 0; }
      h1 { color: #0f172a; font-size: 18px; margin: 0 0 3px; }
      p { color: #64748b; font-size: 10px; margin: 0 0 10px; }
      table { border-collapse: collapse; table-layout: fixed; width: 100%; }
      thead { display: table-header-group; }
      th { background: #003870; color: white; font-size: 7px; padding: 5px; text-align: left; }
      td { border: 1px solid #d9e2ec; font-size: 7px; padding: 5px; vertical-align: top; overflow-wrap: anywhere; }
      tr:nth-child(even) td { background: #f8fafc; }
    </style></head><body>
    <h1>${escapeHtml(clientName)} Content Calendar</h1><p>${escapeHtml(periodLabel)} | ${rows.length} posts</p>
    <table><thead><tr>${EXPORT_COLUMNS.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}</tr></thead>
    <tbody>${tableRows}</tbody></table></body></html>`);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 250);
};

export const exportContentCalendar = async ({
  format,
  posts,
  clientName,
  periodLabel,
  view,
  filters,
}) => {
  const rows = posts.map(normalizePost);
  const filename = buildFilename(clientName, periodLabel, format === 'print' ? 'pdf' : format);
  const payload = { rows, clientName, periodLabel, view, filters, filename };

  if (format === 'xlsx') return exportXlsx(payload);
  if (format === 'pdf') return exportPdf(payload);
  if (format === 'csv') return exportCsv(payload);
  if (format === 'json') return exportJson(payload);
  if (format === 'print') return printCalendar(payload);
  throw new Error(`Unsupported export format: ${format}`);
};

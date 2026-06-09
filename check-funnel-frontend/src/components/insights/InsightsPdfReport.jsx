import { useMemo } from "react";

const PAGE_WIDTH = 1280;
const PAGE_HEIGHT = 905;

const PLATFORM_ORDER = ["facebook", "instagram", "tiktok"];
const PERIODS = [
  { key: "weekly", label: "Last 10 Weeks", dataKey: "weekly" },
  { key: "monthly", label: "Last 6 Months", dataKey: "monthly" },
];
const TIKTOK_PERIODS = [
  { key: "weekly", label: "Last 10 Videos", dataKey: "weekly" },
  { key: "monthly", label: "Last 6 Months", dataKey: "monthly" },
];

const PLATFORM_COLORS = {
  facebook: "#003870",
  instagram: "#4553c1",
  tiktok: "#111827",
};

const BRAND = {
  blue: "#003870",
  blueHover: "#014f99",
  blueDeep: "#002b56",
  night: "#003870",
  ink: "#191c1d",
  muted: "#727782",
  line: "#c2c6d3",
  softLine: "#e7e8e9",
  surface: "#f3f4f5",
  paper: "#f3f4f5",
  panel: "#ffffff",
  brown: "#863802",
  red: "#93000a",
  purple: "#4553c1",
  green: "#10b981",
};

const CHART_CONFIGS = {
  facebook: [
    {
      title: "Content Velocity",
      tab: "Content Counts",
      subtitle: "Content volume trend",
      metrics: [
        { key: "static_posts", label: "Posts", color: "#003870" },
        { key: "no_of_reels", label: "Reels", color: "#863802" },
        { key: "no_of_stories", label: "Stories", color: "#4553c1" },
      ],
    },
    {
      title: "Total Video Views",
      tab: "Total Views",
      subtitle: "Organic vs ads views",
      metrics: [
        { key: "views.organic", label: "Views (Org.)", color: "#003870" },
        { key: "views.ads", label: "Views (Ads)", color: "#10b981" },
      ],
    },
    {
      title: "3s Viewer Retention",
      tab: "Viewer Retention",
      subtitle: "Detailed 3-second views breakdown",
      metrics: [
        { key: "three_second_views.organic", label: "3s Views (Org.)", color: "#003870" },
        { key: "three_second_views.ads", label: "3s Views (Ads)", color: "#f59e0b" },
      ],
    },
    {
      title: "Engagement Overview",
      tab: "Engagement Metrics",
      subtitle: "Total interactions across all content",
      metrics: [
        { key: "content_interactions.interactions_total", label: "Engagements", color: "#003870" },
      ],
    },
    {
      title: "Audience Pulse",
      tab: "Audience Growth",
      subtitle: "New follows and unfollows trend",
      metrics: [
        { key: "new_follows", label: "New Follows", color: "#003870" },
        { key: "unfollows", label: "Unfollows", color: "#93000a" },
      ],
    },
  ],
  instagram: [
    {
      title: "Content Velocity",
      tab: "Content Counts",
      subtitle: "Content volume trend",
      metrics: [
        { key: "no_of_posts", label: "Posts", color: "#003870" },
        { key: "no_of_reels", label: "Reels", color: "#863802" },
        { key: "no_of_stories", label: "Stories", color: "#4553c1" },
      ],
    },
    {
      title: "Total Video Views",
      tab: "Total Views",
      subtitle: "Organic vs ads views",
      metrics: [
        { key: "views.organic", label: "Views (Org.)", color: "#003870" },
        { key: "views.ads", label: "Views (Ads)", color: "#10b981" },
      ],
    },
    {
      title: "Audience Reach",
      tab: "Audience Reach",
      subtitle: "Organic vs ads reach",
      metrics: [
        { key: "reach.organic", label: "Reach (Org.)", color: "#003870" },
        { key: "reach.ads", label: "Reach (Ads)", color: "#93000a" },
      ],
    },
    {
      title: "Engagement Overview",
      tab: "Engagement Metrics",
      subtitle: "Content interactions trend",
      metrics: [
        { key: "content_interactions.total", label: "Interactions", color: "#003870" },
      ],
    },
    {
      title: "Audience Pulse",
      tab: "Audience Growth",
      subtitle: "New follows and unfollows trend",
      metrics: [
        { key: "new_follows", label: "New Follows", color: "#003870" },
        { key: "unfollows", label: "Unfollows", color: "#93000a" },
      ],
    },
  ],
  tiktok: [
    {
      title: "Views Breakdown",
      tab: "Video Breakdown",
      subtitle: "Video views performance",
      metrics: [
        { key: "view_count", label: "Views", color: "#003870" },
      ],
    },
    {
      title: "Likes Breakdown",
      tab: "Video Likes",
      subtitle: "Video likes performance",
      metrics: [
        { key: "like_count", label: "Likes", color: "#003870" },
      ],
    },
  ],
};

const PDF_CANVAS_SCALE = 1.25;
const PDF_IMAGE_QUALITY = 0.9;
const FONT_READY_TIMEOUT_MS = 1200;
const PDF_PAGE_RENDER_TIMEOUT_MS = 12000;

const styles = {
  root: {
    position: "fixed",
    left: "-10000px",
    top: 0,
    width: PAGE_WIDTH,
    background: BRAND.paper,
    color: BRAND.ink,
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    pointerEvents: "none",
  },
  page: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    boxSizing: "border-box",
    background: BRAND.paper,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 0,
    overflow: "hidden",
  },
  card: {
    border: `1px solid ${BRAND.line}`,
    borderRadius: 8,
    background: BRAND.panel,
    boxShadow: "0 18px 44px rgba(6, 24, 45, 0.08)",
  },
};

export async function downloadInsightsPdf(reportData, filename) {
  if (!reportData) throw new Error("PDF report data is not ready.");

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4", compress: true });
  const pages = buildPageDescriptors(reportData);

  pages.forEach((page, index) => {
    if (index > 0) pdf.addPage();
    drawPdfPage(pdf, reportData, page, index + 1, pages.length);
  });

  pdf.save(filename);
}

export async function downloadInsightsPdfFromElement(rootElement, filename) {
  if (rootElement?.platforms) return downloadInsightsPdf(rootElement, filename);
  if (!rootElement) throw new Error("PDF report is not ready.");

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  await waitForFontsReady();

  const pages = Array.from(rootElement.querySelectorAll("[data-pdf-page]"));
  if (!pages.length) throw new Error("No PDF pages were rendered.");

  const previousLeft = rootElement.style.left;
  const previousZIndex = rootElement.style.zIndex;
  rootElement.style.left = "0px";
  rootElement.style.zIndex = "-1";

  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  try {
    for (let index = 0; index < pages.length; index += 1) {
      const canvas = await withPdfTimeout(
        html2canvas(pages[index], {
          backgroundColor: BRAND.paper,
          scale: PDF_CANVAS_SCALE,
          useCORS: true,
          logging: false,
          imageTimeout: 2500,
          windowWidth: PAGE_WIDTH,
          windowHeight: PAGE_HEIGHT,
          scrollX: 0,
          scrollY: 0,
        }),
        PDF_PAGE_RENDER_TIMEOUT_MS,
        `PDF page ${index + 1} took too long to render.`,
      );

      if (index > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", PDF_IMAGE_QUALITY), "JPEG", 0, 0, pdfWidth, pdfHeight);

      await nextFrame();
    }
  } finally {
    rootElement.style.left = previousLeft;
    rootElement.style.zIndex = previousZIndex;
  }

  pdf.save(filename);
}

function drawPdfPage(pdf, reportData, page, pageNumber, totalPages) {
  const m = getPdfMetrics(pdf);
  pdfRect(pdf, m, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, BRAND.paper, null);

  if (page.type === "cover") {
    drawPdfCover(pdf, m, reportData, pageNumber, totalPages);
    return;
  }

  drawPdfHeader(pdf, m, reportData, page);

  if (page.type === "chart") {
    drawPdfChartPage(pdf, m, page);
  } else if (page.type === "breakdown") {
    drawPdfBreakdownPage(pdf, m, page);
  } else {
    drawPdfUnavailablePage(pdf, m, page);
  }

  drawPdfFooter(pdf, m, reportData, pageNumber, totalPages);
}

function drawPdfCover(pdf, m, reportData, pageNumber, totalPages) {
  const bodyHeight = PAGE_HEIGHT - 52;
  const includedPlatforms = getIncludedPlatforms(reportData);
  const platformText = formatPlatformList(includedPlatforms);

  pdfRect(pdf, m, 0, 0, 392, bodyHeight, BRAND.night, null);
  pdfRect(pdf, m, 0, 0, 10, bodyHeight, BRAND.blueHover, null);

  pdfText(pdf, m, "Check Funnel", 42, 72, { size: 35, style: "bold", color: "#ffffff" });
  pdfText(pdf, m, "MARKETING INTELLIGENCE", 42, 98, { size: 13, style: "bold", color: "#c9d7ea" });
  pdfRect(pdf, m, 42, 208, 74, 4, BRAND.brown, null);
  pdfText(pdf, m, "Social insights\nbuilt for\ndecisions.", 42, 290, {
    size: 34,
    style: "bold",
    color: "#ffffff",
    lineHeight: 1.12,
  });

  pdfText(pdf, m, "CONTACT", 42, 622, { size: 11, style: "bold", color: "#9cb7d6" });
  pdfText(pdf, m, "+94 77 780 9062", 42, 650, { size: 16, style: "bold", color: "#ffffff" });
  pdfText(pdf, m, "mail@checkfunnel.com", 42, 675, { size: 16, style: "bold", color: "#ffffff" });
  pdfText(pdf, m, "GENERATED", 42, 762, { size: 11, style: "bold", color: "#9cb7d6" });
  pdfText(pdf, m, formatGeneratedAt(reportData.generatedAt), 42, 792, { size: 16, style: "bold", color: "#ffffff" });

  drawPaletteBlocks(pdf, m, 258, 660, 46, 10);

  pdfText(pdf, m, `${platformText} Insights`, 456, 74, {
    size: 13,
    style: "bold",
    color: BRAND.blue,
  });
  [BRAND.blue, BRAND.brown, BRAND.purple, BRAND.red].forEach((color, index) => {
    pdfRect(pdf, m, 1012 + index * 50, 58, 42, 5, color, null);
  });

  pdfText(pdf, m, "EXECUTIVE SOCIAL PERFORMANCE REPORT", 456, 320, {
    size: 14,
    style: "bold",
    color: BRAND.muted,
  });
  pdfFittedText(pdf, m, reportData.client?.name || "Client", 456, 392, 760, 70, 42, {
    style: "bold",
    color: BRAND.ink,
  });
  pdfText(
    pdf,
    m,
    "Content velocity, reach, engagement, and audience growth analysis\nacross the last 10 weeks and last 6 months.",
    456,
    430,
    { size: 23, style: "bold", color: BRAND.muted, lineHeight: 1.35 },
  );

  let chipX = 456;
  includedPlatforms.forEach((platformKey) => {
    chipX = drawPdfChip(pdf, m, getPlatformLabel(platformKey).toUpperCase(), chipX, 512, 118, PLATFORM_COLORS[platformKey] || BRAND.blue);
  });
  getCoverPeriods(reportData).forEach((period) => {
    chipX = drawPdfChip(pdf, m, period.label, chipX, 512, period.key === "weekly" ? 132 : 138, BRAND.line, BRAND.ink);
  });

  drawPdfFooter(pdf, m, reportData, pageNumber, totalPages);
}

function drawPdfHeader(pdf, m, reportData, page) {
  const viewLabel = page.type === "breakdown" ? "DATA BREAKDOWN" : "CHART VIEW";
  const detailLabel = page.type === "breakdown" ? "Breakdown" : page.tab?.tab;

  pdfRect(pdf, m, 44, 28, 1192, 122, BRAND.blue, null, 8);
  pdfRect(pdf, m, 832, 28, 404, 122, BRAND.blueHover, null, 8);
  pdfRect(pdf, m, 74, 76, 34, 4, "#a8c8ff", null);
  pdfText(pdf, m, "CHECK FUNNEL", 120, 84, { size: 12, style: "bold", color: "#dceaff" });

  pdfText(pdf, m, viewLabel, 1184, 76, { size: 11, style: "bold", color: "#dceaff", align: "right" });
  pdfText(pdf, m, detailLabel, 1184, 106, { size: 13, style: "bold", color: "#ffffff", align: "right" });
  if (page.period) {
    pdfText(pdf, m, page.period.label, 1184, 132, { size: 13, style: "bold", color: "#ffffff", align: "right" });
  }

  pdfFittedText(
    pdf,
    m,
    `${reportData.client?.name || "Client"}: ${getPlatformLabel(page.platformKey)} Insights`,
    74,
    126,
    830,
    28,
    18,
    { style: "bold", color: "#ffffff" },
  );
}

function drawPdfChartPage(pdf, m, page) {
  const color = PLATFORM_COLORS[page.platformKey] || BRAND.blue;
  const card = { x: 44, y: 174, w: 1192, h: 659 };

  drawPdfCard(pdf, m, card.x, card.y, card.w, card.h);
  pdfRect(pdf, m, 74, 202, 6, 58, color, null, 4);
  pdfText(pdf, m, page.tab.title, 96, 226, { size: 32, style: "bold", color: BRAND.ink });
  pdfText(pdf, m, page.tab.subtitle, 96, 252, { size: 15, style: "bold", color: BRAND.muted });
  drawPdfLegend(pdf, m, page.tab.metrics, 760, 202);
  pdfLine(pdf, m, 74, 282, 1206, 282, BRAND.softLine, 1.2);

  drawPdfChart(pdf, m, page.rows || [], page.tab.metrics, {
    x: 74,
    y: 304,
    w: 1132,
    h: 486,
  });
}

function drawPdfBreakdownPage(pdf, m, page) {
  const color = PLATFORM_COLORS[page.platformKey] || BRAND.blue;
  const card = { x: 44, y: 174, w: 1192, h: 659 };
  const rows = page.rows || [];

  drawPdfCard(pdf, m, card.x, card.y, card.w, card.h);
  pdfRect(pdf, m, 74, 202, 6, 58, color, null, 4);
  pdfText(pdf, m, `${getPlatformLabel(page.platformKey)} Breakdown`, 96, 226, { size: 32, style: "bold", color: BRAND.ink });
  pdfText(pdf, m, `Detailed ${page.period.label.toLowerCase()} performance metrics.`, 96, 252, {
    size: 15,
    style: "bold",
    color: BRAND.muted,
  });
  drawPdfChip(pdf, m, `${rows.length} rows`.toUpperCase(), 1072, 216, 112, `${color}33`, color);
  pdfLine(pdf, m, 74, 282, 1206, 282, BRAND.softLine, 1.2);

  drawPdfTable(pdf, m, page.platformKey, page.platform, rows, {
    x: 74,
    y: 306,
    w: 1132,
    h: 492,
  });
}

function drawPdfUnavailablePage(pdf, m, page) {
  drawPdfCard(pdf, m, 44, 174, 1192, 659);
  pdfCircle(pdf, m, 640, 422, 37, "#ffdad6", "#ffdad6", 1);
  pdfText(pdf, m, "!", 640, 434, { size: 34, style: "bold", color: BRAND.red, align: "center" });
  pdfText(pdf, m, `${getPlatformLabel(page.platformKey)} data unavailable`, 640, 488, {
    size: 34,
    style: "bold",
    color: BRAND.ink,
    align: "center",
  });
  pdfText(pdf, m, page.platform.reason || "This platform is not fully configured for the selected client.", 640, 526, {
    size: 17,
    style: "bold",
    color: BRAND.muted,
    align: "center",
    maxWidth: 720,
    lineHeight: 1.35,
  });
}

function drawPdfFooter(pdf, m, reportData, pageNumber, totalPages) {
  pdfText(pdf, m, `${reportData.client?.name || "Client"} Social Insights`, 44, 878, {
    size: 10.5,
    style: "bold",
    color: BRAND.muted,
  });
  pdfLine(pdf, m, 448, 872, 832, 872, BRAND.line, 1);
  pdfText(pdf, m, `Page ${pageNumber} of ${totalPages}`, 1236, 878, {
    size: 10.5,
    style: "bold",
    color: BRAND.muted,
    align: "right",
  });
}

function drawPdfChart(pdf, m, rows, metrics, area) {
  pdfRect(pdf, m, area.x, area.y, area.w, area.h, "#ffffff", BRAND.softLine, 8);

  const plot = {
    left: area.x + 86,
    top: area.y + 54,
    width: area.w - 148,
    height: area.h - 172,
  };
  const baseline = plot.top + plot.height;
  const values = rows.flatMap((row) => metrics.map((metric) => toNumber(getNestedValue(row, metric.key))));
  const maxValue = getNiceMax(Math.max(10, ...values));
  const ticks = getYAxisTicks(maxValue);

  ticks.forEach((tick) => {
    const y = baseline - (tick / maxValue) * plot.height;
    pdfLine(pdf, m, plot.left, y, plot.left + plot.width, y, BRAND.softLine, 0.9, [3, 4]);
    pdfText(pdf, m, compactNumber(tick), plot.left - 18, y + 4, {
      size: 12,
      style: "bold",
      color: BRAND.muted,
      align: "right",
    });
  });

  pdfLine(pdf, m, plot.left, plot.top, plot.left, baseline, BRAND.line, 1);
  pdfLine(pdf, m, plot.left, baseline, plot.left + plot.width, baseline, BRAND.line, 1);

  if (rows.length) {
    const highlightWidth = Math.max(75, plot.width / rows.length);
    pdfRect(pdf, m, plot.left + plot.width - highlightWidth, plot.top, highlightWidth, plot.height, "#f3f7fc", null);
  }

  metrics.forEach((metric) => {
    const points = rows.map((row, index) => {
      const value = toNumber(getNestedValue(row, metric.key));
      return getChartPoint(rows.length, index, value, plot, maxValue);
    });

    for (let index = 1; index < points.length; index += 1) {
      pdfLine(pdf, m, points[index - 1].x, points[index - 1].y, points[index].x, points[index].y, metric.color, 3.2);
    }
  });

  const metricHasPositiveValue = metrics.map((metric) =>
    rows.some((row) => toNumber(getNestedValue(row, metric.key)) > 0),
  );
  const placedValueLabels = [];

  rows.forEach((row, index) => {
    const x = rows.length > 1 ? plot.left + (plot.width / (rows.length - 1)) * index : plot.left + plot.width / 2;
    const labelLines = splitAxisLabel(row.week);

    metrics.forEach((metric, metricIndex) => {
      const value = toNumber(getNestedValue(row, metric.key));
      const point = getChartPoint(rows.length, index, value, plot, maxValue);
      const showValue = shouldShowPointValue(
        value,
        rows.length,
        metrics.length,
        index,
        metricIndex,
        metricHasPositiveValue[metricIndex],
      );

      if (value > 0) {
        pdfCircle(pdf, m, point.x, point.y, 5.5, "#ffffff", metric.color, 2.2);
      }
      if (showValue) {
        placedValueLabels.push(
          placePdfValueLabel(placedValueLabels, compactNumber(value), point, metricIndex, metrics.length, plot, metric.color),
        );
      }
    });

    pdfLine(pdf, m, x, baseline, x, baseline + 7, BRAND.line, 0.8);
    labelLines.forEach((line, lineIndex) => {
      pdfText(pdf, m, line, x, baseline + 29 + lineIndex * 14, {
        size: rows.length > 8 ? 9.5 : 11,
        style: "bold",
        color: index === rows.length - 1 ? BRAND.blue : BRAND.muted,
        align: "center",
      });
    });
  });

  placedValueLabels.forEach((label) => {
    drawPdfValueLabel(pdf, m, label.text, label.x, label.y, label.color);
  });

  if (!rows.length) {
    pdfText(pdf, m, "No data available for this period.", area.x + area.w / 2, area.y + area.h / 2, {
      size: 18,
      style: "bold",
      color: BRAND.muted,
      align: "center",
    });
  }
}

function drawPdfTable(pdf, m, platformKey, platform, rows, area) {
  const columns = getBreakdownColumns(platformKey, rows, platform);
  const headerHeight = 38;
  const rowHeight = Math.min(42, (area.h - headerHeight) / Math.max(rows.length, 1));
  const firstColumnWidth = platformKey === "facebook" ? 154 : 188;
  const otherWidth = (area.w - firstColumnWidth) / Math.max(columns.length - 1, 1);

  pdfRect(pdf, m, area.x, area.y, area.w, area.h, "#ffffff", BRAND.line, 8);
  pdfRect(pdf, m, area.x, area.y, area.w, headerHeight, BRAND.night, null, 8);

  let cursorX = area.x;
  columns.forEach((column, columnIndex) => {
    const width = columnIndex === 0 ? firstColumnWidth : otherWidth;
    const label = fitPdfText(pdf, column.label.toUpperCase(), m.w(width - 16), m.fs(9.8), "bold");
    pdfText(pdf, m, label, cursorX + (column.align === "center" ? width / 2 : 12), area.y + 24, {
      size: 9.8,
      style: "bold",
      color: "#ffffff",
      align: column.align === "center" ? "center" : "left",
    });
    cursorX += width;
  });

  rows.forEach((row, rowIndex) => {
    const rowY = area.y + headerHeight + rowIndex * rowHeight;
    pdfRect(pdf, m, area.x, rowY, area.w, rowHeight, rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc", null);
    pdfLine(pdf, m, area.x, rowY + rowHeight, area.x + area.w, rowY + rowHeight, BRAND.softLine, 0.7);

    cursorX = area.x;
    columns.forEach((column, columnIndex) => {
      const width = columnIndex === 0 ? firstColumnWidth : otherWidth;
      const rawValue = String(column.value(row, platform) ?? "");
      const cellSize = column.primary ? 11.2 : 10.6;
      const value = fitPdfText(pdf, rawValue, m.w(width - 16), m.fs(cellSize), column.primary ? "bold" : "normal");
      pdfText(pdf, m, value, cursorX + (column.align === "center" ? width / 2 : 12), rowY + rowHeight / 2 + 4, {
        size: cellSize,
        style: column.primary ? "bold" : "normal",
        color: column.primary ? BRAND.blue : BRAND.ink,
        align: column.align === "center" ? "center" : "left",
      });
      cursorX += width;
    });
  });

  if (!rows.length) {
    pdfText(pdf, m, "No breakdown rows available.", area.x + area.w / 2, area.y + area.h / 2, {
      size: 18,
      style: "bold",
      color: BRAND.muted,
      align: "center",
    });
  }
}

function drawPdfLegend(pdf, m, metrics, x, y) {
  let cursorX = x;
  let cursorY = y;

  metrics.forEach((metric) => {
    const width = Math.max(118, metric.label.length * 7 + 54);
    if (cursorX + width > 1196) {
      cursorX = x;
      cursorY += 38;
    }

    pdfRect(pdf, m, cursorX, cursorY, width, 30, BRAND.paper, BRAND.softLine, 15);
    pdfRect(pdf, m, cursorX + 14, cursorY + 13, 22, 4, metric.color, null, 2);
    pdfText(pdf, m, metric.label.toUpperCase(), cursorX + 44, cursorY + 20, {
      size: 10,
      style: "bold",
      color: BRAND.ink,
    });
    cursorX += width + 10;
  });
}

function drawPdfValueLabel(pdf, m, text, x, y, color) {
  const label = String(text ?? "");
  pdfText(pdf, m, label, x, y, {
    size: 11.8,
    style: "bold",
    color,
    align: "center",
  });
}

function placePdfValueLabel(existingLabels, text, point, metricIndex, metricCount, plot, color) {
  const label = String(text ?? "");
  const width = Math.max(26, label.length * 7.2);
  const height = 15;
  const candidateOffsets = getValueLabelOffsets(metricIndex, metricCount);

  for (const offset of candidateOffsets) {
    const x = clamp(point.x + offset.x, plot.left + width / 2, plot.left + plot.width - width / 2);
    const y = clamp(point.y + offset.y, plot.top + 12, plot.top + plot.height - 12);
    const box = {
      left: x - width / 2 - 4,
      right: x + width / 2 + 4,
      top: y - height,
      bottom: y + 4,
    };

    if (!existingLabels.some((placed) => boxesOverlap(box, placed.box))) {
      return { text: label, x, y, color, box };
    }
  }

  const fallback = candidateOffsets[candidateOffsets.length - 1];
  const x = clamp(point.x + fallback.x, plot.left + width / 2, plot.left + plot.width - width / 2);
  const y = clamp(point.y + fallback.y, plot.top + 12, plot.top + plot.height - 12);

  return {
    text: label,
    x,
    y,
    color,
    box: {
      left: x - width / 2 - 4,
      right: x + width / 2 + 4,
      top: y - height,
      bottom: y + 4,
    },
  };
}

function getValueLabelOffsets(metricIndex, metricCount) {
  const horizontal = metricCount <= 1 ? 0 : (metricIndex - (metricCount - 1) / 2) * 22;
  const upward = metricCount <= 1 ? -20 : -22 - metricIndex * 16;
  const downward = metricCount <= 1 ? 20 : 22 + metricIndex * 16;

  return [
    { x: horizontal, y: upward },
    { x: horizontal, y: downward },
    { x: horizontal - 18, y: upward - 10 },
    { x: horizontal + 18, y: upward - 10 },
    { x: horizontal - 18, y: downward + 10 },
    { x: horizontal + 18, y: downward + 10 },
  ];
}

function boxesOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function drawPaletteBlocks(pdf, m, x, y, size, gap) {
  [BRAND.blue, BRAND.brown, BRAND.purple, BRAND.red].forEach((color, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    pdfRect(pdf, m, x + column * (size + gap), y + row * (size + gap), size, size, color, null);
  });
}

function drawPdfChip(pdf, m, label, x, y, width, borderColor, textColor = borderColor) {
  const fill = borderColor === BRAND.line || borderColor.startsWith("#c") ? "#ffffff" : "#ffffff";
  pdfRect(pdf, m, x, y, width, 38, fill, borderColor, 19);
  pdfText(pdf, m, label, x + width / 2, y + 24, {
    size: 11,
    style: "bold",
    color: textColor,
    align: "center",
  });
  return x + width + 10;
}

function drawPdfCard(pdf, m, x, y, width, height) {
  pdfRect(pdf, m, x, y, width, height, BRAND.panel, BRAND.line, 8);
}

function pdfRect(pdf, m, x, y, width, height, fillColor, strokeColor, radius = 0) {
  if (fillColor) setPdfFill(pdf, fillColor);
  if (strokeColor) setPdfStroke(pdf, strokeColor);

  const mode = fillColor && strokeColor ? "FD" : fillColor ? "F" : "S";
  if (radius > 0 && typeof pdf.roundedRect === "function") {
    pdf.roundedRect(m.x(x), m.y(y), m.w(width), m.h(height), m.r(radius), m.r(radius), mode);
    return;
  }

  pdf.rect(m.x(x), m.y(y), m.w(width), m.h(height), mode);
}

function pdfLine(pdf, m, x1, y1, x2, y2, color, width = 1, dash = null) {
  setPdfStroke(pdf, color);
  pdf.setLineWidth(m.r(width));
  if (dash) pdf.setLineDashPattern(dash.map((value) => m.r(value)), 0);
  pdf.line(m.x(x1), m.y(y1), m.x(x2), m.y(y2));
  if (dash) pdf.setLineDashPattern([], 0);
}

function pdfCircle(pdf, m, x, y, radius, fillColor, strokeColor, width = 1) {
  if (fillColor) setPdfFill(pdf, fillColor);
  if (strokeColor) setPdfStroke(pdf, strokeColor);
  pdf.setLineWidth(m.r(width));
  pdf.circle(m.x(x), m.y(y), m.r(radius), fillColor && strokeColor ? "FD" : fillColor ? "F" : "S");
}

function pdfText(pdf, m, text, x, y, options = {}) {
  const {
    size = 12,
    style = "normal",
    color = BRAND.ink,
    align = "left",
    maxWidth,
    lineHeight = 1.15,
  } = options;
  const safeText = String(text ?? "");

  pdf.setFont("helvetica", style);
  pdf.setFontSize(m.fs(size));
  setPdfText(pdf, color);

  const textOptions = { align, lineHeightFactor: lineHeight };
  if (maxWidth) {
    const lines = pdf.splitTextToSize(safeText, m.w(maxWidth));
    pdf.text(lines, m.x(x), m.y(y), textOptions);
    return;
  }

  pdf.text(safeText.split("\n"), m.x(x), m.y(y), textOptions);
}

function pdfFittedText(pdf, m, text, x, y, maxWidth, size, minSize, options = {}) {
  let fontSize = size;
  pdf.setFont("helvetica", options.style || "normal");
  pdf.setFontSize(m.fs(fontSize));

  while (fontSize > minSize && pdf.getTextWidth(String(text ?? "")) > m.w(maxWidth)) {
    fontSize -= 1;
    pdf.setFontSize(m.fs(fontSize));
  }

  pdfText(pdf, m, text, x, y, { ...options, size: fontSize });
}

function fitPdfText(pdf, text, maxWidth, size, style = "normal") {
  let value = String(text ?? "");
  pdf.setFont("helvetica", style);
  pdf.setFontSize(size);

  if (pdf.getTextWidth(value) <= maxWidth) return value;

  while (value.length > 4 && pdf.getTextWidth(`${value.slice(0, -1)}...`) > maxWidth) {
    value = value.slice(0, -1);
  }

  return `${value.slice(0, -1)}...`;
}

function getPdfMetrics(pdf) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const sx = pageWidth / PAGE_WIDTH;
  const sy = pageHeight / PAGE_HEIGHT;
  const s = Math.min(sx, sy);

  return {
    x: (value) => value * sx,
    y: (value) => value * sy,
    w: (value) => value * sx,
    h: (value) => value * sy,
    r: (value) => value * s,
    fs: (value) => value * s,
  };
}

function setPdfFill(pdf, color) {
  pdf.setFillColor(...hexToRgb(color));
}

function setPdfStroke(pdf, color) {
  pdf.setDrawColor(...hexToRgb(color));
}

function setPdfText(pdf, color) {
  pdf.setTextColor(...hexToRgb(color));
}

function hexToRgb(color) {
  const normalized = String(color || "#000000").replace("#", "").slice(0, 6);
  const value = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized.padEnd(6, "0");

  return [
    parseInt(value.slice(0, 2), 16) || 0,
    parseInt(value.slice(2, 4), 16) || 0,
    parseInt(value.slice(4, 6), 16) || 0,
  ];
}

async function waitForFontsReady() {
  if (!document.fonts?.ready) return;

  await Promise.race([
    document.fonts.ready,
    new Promise((resolve) => window.setTimeout(resolve, FONT_READY_TIMEOUT_MS)),
  ]);
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function withPdfTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

export function getInsightsPdfFilename(reportData) {
  const clientName = reportData?.client?.name || "client";
  const includedPlatforms = getIncludedPlatforms(reportData);
  const platformPart = includedPlatforms.length === 1 ? `-${includedPlatforms[0]}` : "";
  const safeName = clientName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `${safeName || "client"}${platformPart}-social-insights-${date}.pdf`;
}

export default function InsightsPdfReport({ reportData, reportRef }) {
  const pages = useMemo(() => (reportData ? buildPageDescriptors(reportData) : []), [reportData]);

  if (!reportData) return null;

  return (
    <div ref={reportRef} style={styles.root} aria-hidden="true">
      {pages.map((page, index) => (
        <ReportPage
          key={`${page.type}-${page.platformKey || "cover"}-${page.period?.key || "none"}-${page.tab?.tab || index}`}
          reportData={reportData}
          page={page}
          pageNumber={index + 1}
          totalPages={pages.length}
        />
      ))}
    </div>
  );
}

function buildPageDescriptors(reportData) {
  const pages = [{ type: "cover" }];

  getIncludedPlatforms(reportData).forEach((platformKey) => {
    const platform = reportData.platforms?.[platformKey] || {
      label: getPlatformLabel(platformKey),
      available: false,
      reason: "Platform data is not available.",
    };

    if (!platform.available) {
      pages.push({ type: "unavailable", platformKey, platform });
      return;
    }

    getPeriodsForPlatform(platformKey).forEach((period) => {
      const rows = getRowsForPeriod(reportData, platform, period);
      CHART_CONFIGS[platformKey].forEach((tab) => {
        if (platformKey === "instagram" && tab.title === "Audience Pulse") return;
        pages.push({ type: "chart", platformKey, platform, period, rows, tab });
      });
      pages.push({ type: "breakdown", platformKey, platform, period, rows });
    });
  });

  return pages;
}

function getRowsForPeriod(reportData, platform, period) {
  const hasPeriodRows = Array.isArray(platform?.[period.dataKey]);
  const rows = hasPeriodRows ? platform[period.dataKey] : [];

  if (period.key !== "monthly") return rows;

  if (shouldUseMonthlyBuckets(rows)) {
    const sourceRows = rows.length ? rows : (hasPeriodRows ? [] : platform?.weekly || []);
    return buildMonthlyBuckets(sourceRows, reportData?.generatedAt);
  }

  return rows;
}

function shouldUseMonthlyBuckets(rows) {
  if (!Array.isArray(rows) || !rows.length) return true;

  return rows.some((row) => {
    const label = String(row?.week || "");
    return /(\d{1,2})(st|nd|rd|th)?\s+[A-Za-z]{3,}/i.test(label) && label.includes(" - ");
  });
}

function buildMonthlyBuckets(rows, generatedAt) {
  const baseDate = Number.isNaN(new Date(generatedAt).getTime()) ? new Date() : new Date(generatedAt);
  const buckets = [];
  const bucketMap = new Map();

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = {
      id: key,
      week: date.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
      since: `${key}-01`,
      until: formatMonthEnd(date),
      hasData: false,
    };

    buckets.push(bucket);
    bucketMap.set(key, bucket);
  }

  rows.forEach((row) => {
    const date = getRowBucketDate(row, baseDate);
    if (!date) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = bucketMap.get(key);
    if (!bucket) return;

    bucket.hasData = true;
    mergeNumericFields(bucket, row);
  });

  return buckets.map(({ hasData, ...bucket }) => bucket);
}

function getRowBucketDate(row, baseDate) {
  if (row?.until) {
    const date = new Date(`${row.until}T00:00:00`);
    if (!Number.isNaN(date.getTime())) return date;
  }

  if (row?.since) {
    const date = new Date(`${row.since}T00:00:00`);
    if (!Number.isNaN(date.getTime())) return date;
  }

  return parsePeriodEndDate(row?.week, baseDate);
}

function parsePeriodEndDate(label, baseDate) {
  const parts = String(label || "").split(" - ");
  const dateText = (parts.length > 1 ? parts[parts.length - 1] : parts[0] || "")
    .replace(/(\d+)(st|nd|rd|th)/gi, "$1")
    .trim();
  const parsed = new Date(`${dateText} ${baseDate.getFullYear()}`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatMonthEnd(date) {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
}

function mergeNumericFields(target, source) {
  Object.entries(source || {}).forEach(([key, value]) => {
    if (["id", "week", "since", "until"].includes(key)) return;

    if (typeof value === "number" && Number.isFinite(value)) {
      if (isFollowerField(key)) {
        target[key] = value;
      } else {
        target[key] = (toNumber(target[key]) || 0) + value;
      }
      return;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key])) {
        target[key] = {};
      }
      mergeNumericFields(target[key], value);
    }
  });
}

function isFollowerField(key) {
  const normalized = String(key).toLowerCase();
  return normalized === "followers" || normalized === "total_followers" || normalized === "follower_count";
}

function ReportPage({ reportData, page, pageNumber, totalPages }) {
  return (
    <section data-pdf-page style={styles.page}>
      {page.type === "cover" ? (
        <CoverPage reportData={reportData} pageNumber={pageNumber} totalPages={totalPages} />
      ) : (
        <>
          <PageHeader reportData={reportData} page={page} />
          {page.type === "chart" && <ChartPage page={page} />}
          {page.type === "breakdown" && <BreakdownPage page={page} />}
          {page.type === "unavailable" && <UnavailablePage page={page} />}
          <PageFooter reportData={reportData} pageNumber={pageNumber} totalPages={totalPages} />
        </>
      )}
    </section>
  );
}

function CoverPage({ reportData, pageNumber, totalPages }) {
  const generatedAt = formatGeneratedAt(reportData.generatedAt);
  const includedPlatforms = getIncludedPlatforms(reportData);
  const platformText = formatPlatformList(includedPlatforms);

  return (
    <>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "392px minmax(0, 1fr)", background: BRAND.paper }}>
        <aside style={{ position: "relative", overflow: "hidden", background: BRAND.night, color: "#ffffff", padding: "48px 42px 42px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 10, background: BRAND.blue }} />
          <div style={{ position: "absolute", right: 34, bottom: 92, display: "grid", gridTemplateColumns: "repeat(2, 46px)", gap: 10 }}>
            {[BRAND.blue, BRAND.brown, BRAND.purple, BRAND.red].map((color) => (
              <span key={color} style={{ height: 46, background: color, display: "block" }} />
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 35, fontWeight: 950, letterSpacing: 0 }}>Check Funnel</div>
            <div style={{ fontSize: 13, fontWeight: 850, opacity: 0.72, marginTop: 6, textTransform: "uppercase", letterSpacing: 1.2 }}>Marketing Intelligence</div>
            <div style={{ width: 74, height: 4, background: BRAND.brown, marginTop: 92 }} />
            <div style={{ marginTop: 28, fontSize: 34, lineHeight: 1.12, fontWeight: 950, maxWidth: 260 }}>
              Social insights built for decisions.
            </div>
          </div>
          <div style={{ position: "relative", display: "grid", gap: 26 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 950, textTransform: "uppercase", letterSpacing: 1.6, opacity: 0.64 }}>Contact</div>
              <div style={{ marginTop: 10, display: "grid", gap: 7, fontSize: 15, fontWeight: 900, lineHeight: 1.2 }}>
                <div>+94 77 780 9062</div>
                <div>mail@checkfunnel.com</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 950, textTransform: "uppercase", letterSpacing: 1.6, opacity: 0.64 }}>Generated</div>
              <div style={{ marginTop: 8, fontSize: 16, fontWeight: 900 }}>{generatedAt}</div>
            </div>
          </div>
        </aside>

        <main style={{ padding: "56px 64px 34px", boxSizing: "border-box", display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 28 }}>
            <div style={{ color: BRAND.blue, fontSize: 13, fontWeight: 950, textTransform: "uppercase", letterSpacing: 1.7 }}>
              {platformText} Insights
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 42px)", gap: 8 }}>
              {[BRAND.blue, BRAND.brown, BRAND.purple, BRAND.red].map((color) => (
                <span key={color} style={{ height: 5, background: color, display: "block" }} />
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", minHeight: 0 }}>
            <div style={{ maxWidth: 810 }}>
              <div style={{ color: BRAND.muted, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.4 }}>Executive Social Performance Report</div>
              <h1 style={{ margin: "22px 0 22px", fontSize: 70, lineHeight: 1.01, letterSpacing: 0, fontWeight: 950, color: BRAND.ink }}>
                {reportData.client?.name || "Client"}
              </h1>
              <p style={{ margin: 0, maxWidth: 760, color: BRAND.muted, fontSize: 23, lineHeight: 1.46, fontWeight: 720 }}>
                Content velocity, reach, engagement, and audience growth analysis across the last 10 weeks and last 6 months.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 34 }}>
                {includedPlatforms.map((platformKey) => (
                  <span key={platformKey} style={{ height: 38, borderRadius: 999, border: `1px solid ${PLATFORM_COLORS[platformKey] || BRAND.blue}`, color: PLATFORM_COLORS[platformKey] || BRAND.blue, background: "#ffffff", display: "inline-flex", alignItems: "center", padding: "0 16px", boxSizing: "border-box", fontSize: 12, fontWeight: 950, textTransform: "uppercase", letterSpacing: 1 }}>
                    {getPlatformLabel(platformKey)}
                  </span>
                ))}
                {getCoverPeriods(reportData).map((period) => (
                  <span key={period.key} style={{ height: 38, borderRadius: 999, border: `1px solid ${BRAND.line}`, color: BRAND.ink, background: "#ffffff", display: "inline-flex", alignItems: "center", padding: "0 16px", boxSizing: "border-box", fontSize: 12, fontWeight: 900 }}>
                    {period.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <PageFooter reportData={reportData} pageNumber={pageNumber} totalPages={totalPages} />
    </>
  );
}

function PageHeader({ reportData, page }) {
  const viewLabel = page.type === "breakdown" ? "Data Breakdown" : "Chart View";
  const detailLabel = page.type === "breakdown" ? "Breakdown" : page.tab?.tab;

  return (
    <header style={{ height: 150, background: BRAND.paper, padding: "28px 44px 0", boxSizing: "border-box" }}>
      <div style={{ height: 122, background: `linear-gradient(135deg, ${BRAND.blue} 0%, ${BRAND.blueHover} 100%)`, color: "#ffffff", borderRadius: 8, padding: "18px 30px 18px", boxSizing: "border-box" }}>
        <div style={{ position: "relative", height: 44 }}>
          <div style={{ position: "absolute", left: 0, top: 5, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 34, height: 4, background: "#a8c8ff", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 950, opacity: 0.78, textTransform: "uppercase", letterSpacing: 1.5 }}>Check Funnel</span>
          </div>

          <div style={{ position: "absolute", right: 0, top: 0, textAlign: "right", color: "#ffffff" }}>
            <div style={{ opacity: 0.78, fontSize: 11, fontWeight: 950, lineHeight: "14px", textTransform: "uppercase", letterSpacing: 1.5 }}>
              {viewLabel}
            </div>
            {detailLabel && (
              <div style={{ marginTop: 7, fontSize: 13, fontWeight: 950, lineHeight: "16px" }}>
                {detailLabel}
              </div>
            )}
            {page.period && (
              <div style={{ marginTop: 5, fontSize: 13, fontWeight: 950, lineHeight: "16px" }}>
                {page.period.label}
              </div>
            )}
          </div>
        </div>

        <h2 style={{ margin: "0", color: "#ffffff", fontSize: 24, fontWeight: 950, lineHeight: "30px", whiteSpace: "nowrap" }}>
          {reportData.client?.name || "Client"}: {getPlatformLabel(page.platformKey)} Insights
        </h2>
      </div>
    </header>
  );
}

function ChartPage({ page }) {
  const color = PLATFORM_COLORS[page.platformKey] || BRAND.blue;

  return (
    <main style={{ flex: 1, minHeight: 0, padding: "24px 44px 20px", boxSizing: "border-box", display: "flex" }}>
      <div style={{ ...styles.card, flex: 1, minHeight: 0, padding: "26px 30px 22px", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 26, paddingBottom: 18, borderBottom: `1px solid ${BRAND.softLine}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 15, minWidth: 0 }}>
            <span style={{ width: 6, height: 58, borderRadius: 4, background: color, flex: "0 0 auto" }} />
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 32, fontWeight: 950, color: BRAND.ink, lineHeight: 1.05 }}>{page.tab.title}</h3>
              <p style={{ margin: "8px 0 0", fontSize: 15, color: BRAND.muted, fontWeight: 760 }}>{page.tab.subtitle}</p>
            </div>
          </div>
          <Legend metrics={page.tab.metrics} />
        </div>

        <div style={{ flex: 1, marginTop: 16, minHeight: 0, borderRadius: 8, overflow: "hidden", background: "#ffffff" }}>
          <ReportChart rows={page.rows} metrics={page.tab.metrics} />
        </div>
      </div>
    </main>
  );
}

function BreakdownPage({ page }) {
  const columns = getBreakdownColumns(page.platformKey, page.rows, page.platform);
  const color = PLATFORM_COLORS[page.platformKey] || BRAND.blue;

  return (
    <main style={{ flex: 1, padding: "24px 44px 20px", display: "flex", minHeight: 0, boxSizing: "border-box" }}>
      <div style={{ ...styles.card, flex: 1, minHeight: 0, padding: "26px 30px 22px", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, marginBottom: 18, borderBottom: `1px solid ${BRAND.softLine}`, paddingBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15, minWidth: 0 }}>
            <span style={{ width: 6, height: 58, borderRadius: 4, background: color, flex: "0 0 auto" }} />
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 32, fontWeight: 950, color: BRAND.ink, lineHeight: 1.05 }}>
                {getPlatformLabel(page.platformKey)} Breakdown
              </h3>
              <p style={{ margin: "8px 0 0", fontSize: 15, color: BRAND.muted, fontWeight: 760 }}>
                Detailed {page.period.label.toLowerCase()} performance metrics.
              </p>
            </div>
          </div>
          <div style={{ borderRadius: 999, background: `${color}14`, border: `1px solid ${color}33`, color, padding: "10px 15px", fontSize: 12, fontWeight: 950, textTransform: "uppercase", letterSpacing: 1.2, whiteSpace: "nowrap" }}>
            {page.rows.length} rows
          </div>
        </div>

        <div style={{ overflow: "hidden", borderRadius: 8, border: `1px solid ${BRAND.line}`, flex: 1, background: "#ffffff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: BRAND.night }}>
                {columns.map((column) => (
                  <th key={column.label} style={{ padding: "14px 10px", color: "#ffffff", fontSize: 9.5, fontWeight: 950, textTransform: "uppercase", letterSpacing: 0.8, textAlign: column.align || "left", borderBottom: `1px solid ${BRAND.blue}` }}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {page.rows.map((row, index) => (
                <tr key={`${row.week}-${index}`} style={{ background: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                  {columns.map((column) => (
                    <td key={column.label} style={{ padding: "12px 10px", color: column.primary ? BRAND.blue : BRAND.ink, fontSize: 11, fontWeight: column.primary ? 950 : 760, textAlign: column.align || "left", borderBottom: `1px solid ${BRAND.softLine}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {column.value(row, page.platform)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function UnavailablePage({ page }) {
  return (
    <main style={{ flex: 1, padding: "24px 44px 20px", boxSizing: "border-box", display: "flex" }}>
      <div style={{ ...styles.card, flex: 1, padding: 46, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ width: 74, height: 74, borderRadius: 999, background: "#ffdad6", color: "#93000a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 950 }}>
          !
        </div>
        <h3 style={{ margin: "28px 0 12px", fontSize: 34, fontWeight: 950, color: BRAND.ink }}>
          {getPlatformLabel(page.platformKey)} data unavailable
        </h3>
        <p style={{ margin: 0, maxWidth: 680, fontSize: 18, lineHeight: 1.5, color: BRAND.muted, fontWeight: 650 }}>
          {page.platform.reason || "This platform is not fully configured for the selected client."}
        </p>
      </div>
    </main>
  );
}

function PageFooter({ reportData, pageNumber, totalPages }) {
  return (
    <footer style={{ height: 52, padding: "0 44px", boxSizing: "border-box", background: BRAND.paper, display: "grid", gridTemplateColumns: "1fr 360px 1fr", alignItems: "center", columnGap: 22, color: BRAND.muted, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.2 }}>
      <span>{reportData.client?.name || "Client"} Social Insights</span>
      <span style={{ height: 1, background: BRAND.line, display: "block" }} />
      <span style={{ justifySelf: "end" }}>Page {pageNumber} of {totalPages}</span>
    </footer>
  );
}

function Legend({ metrics }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "8px 10px", maxWidth: 610 }}>
      {metrics.map((metric) => (
        <div key={metric.key} style={{ height: 30, display: "flex", alignItems: "center", gap: 8, color: BRAND.ink, padding: "0 11px", borderRadius: 999, border: `1px solid ${BRAND.softLine}`, background: BRAND.paper, boxSizing: "border-box", fontSize: 10.5, fontWeight: 950, textTransform: "uppercase", letterSpacing: 1.05 }}>
          <span style={{ width: 22, height: 4, borderRadius: 999, background: metric.color, display: "inline-block" }} />
          {metric.label}
        </div>
      ))}
    </div>
  );
}

function ReportChart({ rows, metrics }) {
  const width = 1120;
  const height = 560;
  const plot = { left: 90, top: 54, width: 980, height: 360 };
  const values = rows.flatMap((row) => metrics.map((metric) => toNumber(getNestedValue(row, metric.key))));
  const maxValue = getNiceMax(Math.max(10, ...values));
  const ticks = getYAxisTicks(maxValue);
  const baseline = plot.top + plot.height;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width={width} height={height} fill="#ffffff" />

      {ticks.map((tick) => {
        const y = baseline - (tick / maxValue) * plot.height;
        return (
          <g key={tick}>
            <line x1={plot.left} y1={y} x2={plot.left + plot.width} y2={y} stroke={BRAND.softLine} strokeDasharray="5 7" strokeWidth="1.4" />
            <text x={plot.left - 18} y={y + 4} textAnchor="end" fontSize="12" fontWeight="900" fill={BRAND.muted}>
              {compactNumber(tick)}
            </text>
          </g>
        );
      })}

      <line x1={plot.left} y1={plot.top} x2={plot.left} y2={baseline} stroke={BRAND.line} strokeWidth="1.4" />
      <line x1={plot.left} y1={baseline} x2={plot.left + plot.width} y2={baseline} stroke={BRAND.line} strokeWidth="1.4" />

      <rect
        x={plot.left + plot.width - Math.max(75, plot.width / Math.max(rows.length, 1))}
        y={plot.top}
        width={Math.max(75, plot.width / Math.max(rows.length, 1))}
        height={plot.height}
        fill="rgba(0,56,112,0.06)"
      />

      {metrics.map((metric) => {
        const points = buildChartPoints(rows, metric.key, plot, maxValue);
        const areaPoints = `${points} ${plot.left + plot.width},${baseline} ${plot.left},${baseline}`;
        return (
          <g key={metric.key}>
            <polygon points={areaPoints} fill={metric.color} opacity="0.08" />
            <polyline points={points} fill="none" stroke={metric.color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}

      {rows.map((row, index) => {
        const x = rows.length > 1 ? plot.left + (plot.width / (rows.length - 1)) * index : plot.left + plot.width / 2;
        const labelLines = splitAxisLabel(row.week);
        return (
          <g key={`${row.week}-${index}`}>
            {metrics.map((metric, metricIndex) => {
              const value = toNumber(getNestedValue(row, metric.key));
              const point = getChartPoint(rows.length, index, value, plot, maxValue);
              const showValue = shouldShowPointValue(value, rows.length, metrics.length, index, metricIndex);
              const labelY = getValueLabelY(point.y, metricIndex, plot);
              return (
                <g key={metric.key}>
                  {value > 0 && <circle cx={point.x} cy={point.y} r="5.5" fill="#ffffff" stroke={metric.color} strokeWidth="3" />}
                  {showValue && (
                    <text
                      x={point.x}
                      y={labelY}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="950"
                      fill={metric.color}
                      stroke="#ffffff"
                      strokeWidth="6"
                      paintOrder="stroke"
                    >
                      {compactNumber(value)}
                    </text>
                  )}
                </g>
              );
            })}
            <line x1={x} y1={baseline} x2={x} y2={baseline + 7} stroke={BRAND.line} strokeWidth="1.2" />
            <text x={x} y={baseline + 27} textAnchor="middle" fontSize={rows.length > 8 ? "10" : "11.5"} fontWeight={index === rows.length - 1 ? "950" : "800"} fill={index === rows.length - 1 ? BRAND.blue : BRAND.muted}>
              {labelLines.map((line, lineIndex) => (
                <tspan key={line} x={x} dy={lineIndex === 0 ? 0 : 13}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function buildChartPoints(rows, key, plot, maxValue) {
  if (!rows.length) return `${plot.left},${plot.top + plot.height}`;

  return rows
    .map((row, index) => {
      const value = toNumber(getNestedValue(row, key));
      const point = getChartPoint(rows.length, index, value, plot, maxValue);
      return `${point.x},${point.y}`;
    })
    .join(" ");
}

function getChartPoint(rowCount, index, value, plot, maxValue) {
  const x = rowCount > 1 ? plot.left + (plot.width / (rowCount - 1)) * index : plot.left + plot.width / 2;
  const y = plot.top + plot.height - (value / maxValue) * plot.height;
  return { x, y };
}

function getNiceMax(value) {
  if (!Number.isFinite(value) || value <= 10) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

function getYAxisTicks(maxValue) {
  return [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map((value) => Math.round(value));
}

function getValueLabelX(x, metricIndex, metricCount, plot) {
  if (metricCount <= 1) return x;

  const offset = (metricIndex - (metricCount - 1) / 2) * 18;
  return Math.min(plot.left + plot.width - 16, Math.max(plot.left + 16, x + offset));
}

function getValueLabelY(y, metricIndex, metricCount, plot) {
  if (!plot) {
    plot = metricCount;
    metricCount = 1;
  }

  const offset = metricCount <= 1 ? 20 : 24 + metricIndex * 28;
  if (y - offset < plot.top + 14) return Math.min(plot.top + plot.height - 14, y + offset + 10);
  return y - offset;
}

function shouldShowPointValue(value, rowCount, metricCount, index, metricIndex, metricHasPositiveValue = true) {
  if (value > 0) return true;
  return !metricHasPositiveValue && index === rowCount - 1;
}

function getBreakdownColumns(platformKey, rows = [], platform) {
  if (platformKey === "tiktok") {
    const followers = platform?.user?.follower_count;

    if (isTiktokVideoRows(rows)) {
      return [
        { label: "Upload Date", value: (row) => row.week || formatTiktokUploadDate(row.create_time) },
        { label: "Views", value: (row) => formatNumber(row.view_count), align: "center", primary: true },
        { label: "Likes", value: (row) => formatNumber(row.like_count), align: "center" },
        { label: "Comments", value: (row) => formatNumber(row.comment_count), align: "center" },
        { label: "Shares", value: (row) => formatNumber(row.share_count), align: "center" },
        { label: "ER %", value: (row) => getTiktokEr(row), align: "center", primary: true },
        { label: "Followers", value: () => formatNumber(followers), align: "center" },
      ];
    }

    return [
      { label: "Period", value: (row) => row.week },
      { label: "Videos", value: (row) => formatNumber(row.video_count), align: "center" },
      { label: "Views", value: (row) => formatNumber(row.view_count), align: "center", primary: true },
      { label: "Likes", value: (row) => formatNumber(row.like_count), align: "center" },
      { label: "Comments", value: (row) => formatNumber(row.comment_count), align: "center" },
      { label: "Shares", value: (row) => formatNumber(row.share_count), align: "center" },
      { label: "ER %", value: (row) => getTiktokEr(row), align: "center", primary: true },
      { label: "Followers", value: () => formatNumber(followers), align: "center" },
    ];
  }

  if (platformKey === "instagram") {
    return [
      { label: "Period", value: (row) => row.week },
      { label: "Posts", value: (row) => formatNumber(row.no_of_posts), align: "center" },
      { label: "Reels", value: (row) => formatNumber(row.no_of_reels), align: "center" },
      { label: "Views Org.", value: (row) => formatNumber(row.views?.organic), align: "center" },
      { label: "Views Ads", value: (row) => formatNumber(row.views?.ads), align: "center" },
      { label: "Reach Org.", value: (row) => formatNumber(row.reach?.organic), align: "center" },
      { label: "Reach Ads", value: (row) => formatNumber(row.reach?.ads), align: "center" },
      { label: "Interactions", value: (row) => formatNumber(row.content_interactions?.total), align: "center", primary: true },
      { label: "Followers", value: (row) => formatNumber(row.total_followers), align: "center" },
    ];
  }

  return [
    { label: "Period", value: (row) => row.week },
    { label: "Posts", value: (row) => formatNumber(row.static_posts), align: "center" },
    { label: "Reels", value: (row) => formatNumber(row.no_of_reels), align: "center" },
    { label: "Views Org.", value: (row) => formatNumber(row.views?.organic), align: "center" },
    { label: "Views Ads", value: (row) => formatNumber(row.views?.ads), align: "center" },
    { label: "3s Org.", value: (row) => formatNumber(row.three_second_views?.organic), align: "center" },
    { label: "3s Ads", value: (row) => formatNumber(row.three_second_views?.ads), align: "center" },
    { label: "Engagements", value: (row) => formatNumber(row.content_interactions?.interactions_total), align: "center", primary: true },
    { label: "New Follows", value: (row) => formatNumber(row.new_follows), align: "center" },
    { label: "Unfollows", value: (row) => formatNumber(row.unfollows), align: "center" },
    { label: "Followers", value: (row) => formatNumber(row.total_followers), align: "center" },
  ];
}

function isTiktokVideoRows(rows = []) {
  return rows.some((row) => row?.create_time && row?.video_count === undefined);
}

function formatTiktokUploadDate(createTime) {
  const timestamp = Number(createTime);
  if (!timestamp) return "N/A";
  return new Date(timestamp * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function getTiktokEr(row) {
  const views = toNumber(row.view_count);
  const engagement = toNumber(row.like_count) + toNumber(row.comment_count) + toNumber(row.share_count);
  return views > 0 ? `${((engagement * 100) / views).toFixed(2)}%` : "0.00%";
}

function getNestedValue(obj, path) {
  if (!obj || !path) return 0;
  return path.split(".").reduce((value, key) => value?.[key], obj);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
  if (value === "N/A" || value === undefined || value === null) return "N/A";
  return toNumber(value).toLocaleString();
}

function compactNumber(value) {
  const number = toNumber(value);
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}m`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}k`;
  return String(number);
}

function splitAxisLabel(label) {
  if (!label || typeof label !== "string") return [""];
  const parts = label.split(" - ");
  if (parts.length === 2) return parts;
  return [label];
}

function getPlatformLabel(platformKey) {
  if (platformKey === "instagram") return "Instagram";
  if (platformKey === "tiktok") return "TikTok";
  return "Facebook";
}

function getIncludedPlatforms(reportData) {
  const requested = Array.isArray(reportData?.includedPlatforms)
    ? reportData.includedPlatforms
    : PLATFORM_ORDER;

  const valid = requested.filter((platformKey) => PLATFORM_ORDER.includes(platformKey));
  return valid.length ? valid : PLATFORM_ORDER;
}

function getPeriodsForPlatform(platformKey) {
  return platformKey === "tiktok" ? TIKTOK_PERIODS : PERIODS;
}

function getCoverPeriods(reportData) {
  const includedPlatforms = getIncludedPlatforms(reportData);
  return includedPlatforms.length === 1 && includedPlatforms[0] === "tiktok" ? TIKTOK_PERIODS : PERIODS;
}

function formatPlatformList(platformKeys) {
  const labels = platformKeys.map(getPlatformLabel);
  if (labels.length <= 1) return labels[0] || "Social";
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function formatGeneratedAt(value) {
  if (!value) return new Date().toLocaleString("en-GB");
  return new Date(value).toLocaleString("en-GB");
}

const eyebrowStyle = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: 1.4,
};

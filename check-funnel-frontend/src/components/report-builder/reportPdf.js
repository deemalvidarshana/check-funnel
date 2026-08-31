async function renderReportSlides(previewElement) {
  if (!previewElement) throw new Error("Report preview is not ready.");
  const pages = [...previewElement.querySelectorAll("[data-report-page]")];
  if (!pages.length) throw new Error("No report pages are available.");
  await document.fonts?.ready;
  const { toCanvas } = await import("html-to-image");
  const canvases = [];
  for (const page of pages) {
    const scaledWrapper = page.parentElement;
    const previousTransform = scaledWrapper?.style.transform;
    try {
      if (scaledWrapper) scaledWrapper.style.transform = "none";
      canvases.push(
        await toCanvas(page, {
          width: 1000,
          height: 562.5,
          canvasWidth: 2000,
          canvasHeight: 1125,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          cacheBust: true,
          skipAutoScale: true,
        }),
      );
    } finally {
      if (scaledWrapper) scaledWrapper.style.transform = previousTransform;
    }
  }
  return canvases;
}

export async function downloadReportPdf(previewElement, filename) {
  const canvases = await renderReportSlides(previewElement);
  const { jsPDF } = await import("jspdf");
  const slideWidth = 297;
  const slideHeight = 167.0625;
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [slideWidth, slideHeight],
    compress: true,
  });
  canvases.forEach((canvas, index) => {
    if (index > 0) pdf.addPage([slideWidth, slideHeight], "landscape");
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.94),
      "JPEG",
      0,
      0,
      slideWidth,
      slideHeight,
      undefined,
      "FAST",
    );
  });
  pdf.save(filename);
}

export async function downloadReportPptx(previewElement, filename) {
  const canvases = await renderReportSlides(previewElement);
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Check Funnel";
  pptx.subject = "Marketing performance report";
  pptx.title = filename.replace(/\.pptx$/i, "");
  canvases.forEach((canvas) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addImage({
      data: canvas.toDataURL("image/png"),
      x: 0,
      y: 0,
      w: 13.333,
      h: 7.5,
    });
  });
  await pptx.writeFile({ fileName: filename });
}

export function reportFilename(clientName, month, extension = "pdf") {
  const safe = String(clientName || "client")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${safe || "client"}-marketing-report-${month}.${extension}`;
}

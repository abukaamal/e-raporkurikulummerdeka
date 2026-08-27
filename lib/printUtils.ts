'use client';

import jsPDF from 'jspdf';
import { toJpeg, toPng } from 'html-to-image';

/**
 * Downloads a DOM element directly as a high-fidelity PDF file.
 * To ensure 100% consistent desktop A4 layout across Mobile, Tablet, and Desktop,
 * this function captures the content inside a standardized desktop-width staging container.
 */
export async function downloadElementAsPdf(
  elementId: string,
  fileName: string = 'Dokumen_Rapor'
): Promise<boolean> {
  const originalElement = document.getElementById(elementId);
  if (!originalElement) {
    console.error(`Element with id "${elementId}" not found for PDF export.`);
    window.print();
    return false;
  }

  const prevCursor = document.body.style.cursor;
  document.body.style.cursor = 'wait';

  // Create an off-screen staging sandbox with standard Desktop A4 width (794px at 96 DPI)
  // This guarantees that whether on mobile, tablet, or desktop, the layout and font scaling remain identical!
  const stagingContainer = document.createElement('div');
  stagingContainer.setAttribute('id', 'pdf-render-staging-container');
  stagingContainer.style.position = 'fixed';
  stagingContainer.style.left = '-10000px';
  stagingContainer.style.top = '0';
  stagingContainer.style.width = '794px';
  stagingContainer.style.minWidth = '794px';
  stagingContainer.style.maxWidth = '794px';
  stagingContainer.style.zIndex = '-9999';
  stagingContainer.style.background = '#ffffff';
  stagingContainer.style.opacity = '1';
  stagingContainer.style.pointerEvents = 'none';

  // Clone original element into staging
  const clonedElement = originalElement.cloneNode(true) as HTMLElement;
  clonedElement.style.width = '794px';
  clonedElement.style.margin = '0';
  clonedElement.style.padding = '0';
  stagingContainer.appendChild(clonedElement);
  document.body.appendChild(stagingContainer);

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 210; // mm
    const pdfHeight = 297; // mm
    const margin = 8; // mm margin
    const contentWidth = pdfWidth - margin * 2; // 194 mm
    const pageAvailableHeight = pdfHeight - margin * 2; // 281 mm

    // Check if the container has dedicated individual pages marked with .pdf-page
    const pageElements = Array.from(clonedElement.querySelectorAll<HTMLElement>('.pdf-page'));

    if (pageElements.length > 0) {
      // Capture each discrete page cleanly onto its own PDF page
      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];
        pageEl.style.width = '794px';
        pageEl.style.minWidth = '794px';
        pageEl.style.boxSizing = 'border-box';

        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        let imgData: string;
        try {
          imgData = await toJpeg(pageEl, {
            quality: 0.98,
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            cacheBust: true,
            width: 794,
          });
        } catch {
          imgData = await toPng(pageEl, {
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            cacheBust: true,
            width: 794,
          });
        }

        const img = new Image();
        img.src = imgData;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const imgWidthPx = img.naturalWidth || 794 * 2;
        const imgHeightPx = img.naturalHeight || pageEl.scrollHeight * 2;
        const renderedHeight = (imgHeightPx * contentWidth) / imgWidthPx;

        // Fit onto current page
        const finalHeight = Math.min(renderedHeight, pageAvailableHeight);
        pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, finalHeight);
      }
    } else {
      // Single continuous element capture
      clonedElement.style.width = '794px';
      clonedElement.style.minWidth = '794px';

      let imgData: string;
      try {
        imgData = await toJpeg(clonedElement, {
          quality: 0.98,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          cacheBust: true,
          width: 794,
          filter: (node) => {
            if (node instanceof HTMLElement) {
              return !node.classList.contains('print:hidden') && !node.classList.contains('no-pdf');
            }
            return true;
          },
        });
      } catch {
        imgData = await toPng(clonedElement, {
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          cacheBust: true,
          width: 794,
        });
      }

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidthPx = img.naturalWidth || 794 * 2;
      const imgHeightPx = img.naturalHeight || clonedElement.scrollHeight * 2;
      const contentHeight = (imgHeightPx * contentWidth) / imgWidthPx;

      if (contentHeight <= pageAvailableHeight) {
        pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
      } else {
        let remainingHeight = contentHeight;
        let position = 0;
        let pageNumber = 1;

        while (remainingHeight > 0) {
          if (pageNumber > 1) {
            pdf.addPage('a4', 'portrait');
          }

          pdf.addImage(
            imgData,
            'JPEG',
            margin,
            margin - position,
            contentWidth,
            contentHeight
          );

          position += pageAvailableHeight;
          remainingHeight -= pageAvailableHeight;
          pageNumber++;
        }
      }
    }

    const sanitizedFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    pdf.save(sanitizedFileName);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    triggerPrint(elementId, fileName);
    return false;
  } finally {
    document.body.style.cursor = prevCursor;
    if (document.body.contains(stagingContainer)) {
      document.body.removeChild(stagingContainer);
    }
  }
}

/**
 * Utility for robust, high-fidelity printing in Next.js / Tailwind.
 */
export function triggerPrint(elementId?: string, documentTitle?: string): void {
  if (elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      window.print();
      return;
    }

    try {
      const printIframe = document.createElement('iframe');
      printIframe.setAttribute(
        'style',
        'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
      );
      printIframe.setAttribute('id', 'print-engine-frame');
      document.body.appendChild(printIframe);

      const frameDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
      if (frameDoc) {
        frameDoc.open();

        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
          .map((el) => el.outerHTML)
          .join('\n');

        frameDoc.write(`
          <!DOCTYPE html>
          <html lang="id">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>${documentTitle || 'Dokumen Rapor Kurikulum Merdeka'}</title>
              ${styles}
              <style>
                @page {
                  size: A4 portrait;
                  margin: 10mm 12mm;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  box-sizing: border-box;
                }
                html, body {
                  background-color: #ffffff !important;
                  color: #0f172a !important;
                  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .pdf-page {
                  page-break-after: always !important;
                  break-after: page !important;
                  margin-bottom: 20px;
                  width: 794px !important;
                }
                .pdf-page:last-child {
                  page-break-after: auto !important;
                  break-after: auto !important;
                }
                .print\\:hidden {
                  display: none !important;
                }
                .print\\:border-none {
                  border: none !important;
                }
                .print\\:shadow-none {
                  box-shadow: none !important;
                }
                .print\\:p-0 {
                  padding: 0 !important;
                }
              </style>
            </head>
            <body class="bg-white text-slate-900">
              <div style="width: 794px; margin: 0 auto; padding: 10px;">
                ${element.outerHTML}
              </div>
            </body>
          </html>
        `);
        frameDoc.close();

        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch (err) {
            console.warn('Iframe print failed, falling back to window.print():', err);
            window.print();
          } finally {
            setTimeout(() => {
              try {
                if (document.body.contains(printIframe)) {
                  document.body.removeChild(printIframe);
                }
              } catch {}
            }, 3000);
          }
        }, 400);
        return;
      }
    } catch (e) {
      console.warn('Error initiating isolated print frame:', e);
    }
  }

  try {
    window.print();
  } catch (e) {
    console.error('window.print error:', e);
    alert('Gunakan pintasan keyboard Ctrl + P (Windows) atau Cmd + P (Mac) untuk mencetak/menyimpan PDF.');
  }
}

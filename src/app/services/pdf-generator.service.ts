import { Injectable, inject } from '@angular/core';
import jsPDF from 'jspdf';
import { I18nService } from './i18n.service';
import { Currency, QuoteCalculation } from '../interfaces/quote';

export interface ProjectTypeInfo {
  id: string;
  name: string;
  description: string;
}

export interface EnhancementInfo {
  id: string;
  name: string;
  price: number;
}

export interface QuotePDFData {
  projectType: ProjectTypeInfo;
  modulesCount: number;
  unitLabel: string;
  selectedEnhancements: EnhancementInfo[];
  calculation: QuoteCalculation;
  currency: Currency;
  formattedBasePrice: string;
  formattedModulesPrice: string;
  formattedTotal: string;
}

@Injectable({
  providedIn: 'root',
})
export class PdfGeneratorService {
  private readonly i18nService = inject(I18nService);

  generateQuotePDF(data: QuotePDFData): void {
    console.log(data);
    const t = this.i18nService.t();
    const locale = this.i18nService.getLocale();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Francisco Moreno', 20, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Senior Web UI Engineer', 20, 28);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(t('quote.pdf.header.email'), 20, 34);
    doc.text(t('quote.pdf.header.phone'), 20, 40);

    yPosition = 55;

    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(t('quote.title'), 20, yPosition);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);

    const subtitleLines = doc.splitTextToSize(t('quote.subtitle'), pageWidth - 40);
    doc.text(subtitleLines, 20, yPosition + 8);
    yPosition += 8 + subtitleLines.length * 5;

    // Date
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(currentDate, 20, yPosition);
    yPosition += 15;

    // Project Type Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(t('quote.steps.projectType'), 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.projectType.name}`, 20, yPosition);
    yPosition += 5;

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(data.projectType.description, 20, yPosition);
    yPosition += 12;

    // Calculate breakdown content height
    let breakdownContentHeight = 10; // Title
    if (data.calculation.basePrice > 0) breakdownContentHeight += 7;
    if (data.modulesCount > 0) breakdownContentHeight += 7;

    if (data.selectedEnhancements.length > 0) {
      breakdownContentHeight += 7; // "ADICIONALES" header
      breakdownContentHeight += data.selectedEnhancements.length * 7;
    } else {
      breakdownContentHeight += 3;
    }

    breakdownContentHeight += 10; // Delivery
    breakdownContentHeight += 15; // Total

    const boxPadding = 10; // 5px top + 5px bottom requested, using 10 for better visual spacing
    const totalBoxHeight = breakdownContentHeight + boxPadding * 2;

    // Check if we need a new page
    if (yPosition + totalBoxHeight + 40 > doc.internal.pageSize.getHeight()) {
      doc.addPage();
      yPosition = 20;
    }

    // Price Breakdown Box
    yPosition += 10;
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPosition - boxPadding, pageWidth - 30, totalBoxHeight, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(t('quote.summary.title'), 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Base Price
    if (data.calculation.basePrice > 0) {
      doc.text(t('quote.summary.baseService'), 20, yPosition);
      doc.text(data.formattedBasePrice, pageWidth - 20, yPosition, {
        align: 'right',
      });
      yPosition += 7;
    }

    // Modules Price
    if (data.modulesCount > 0) {
      doc.text(`${data.modulesCount} x ${data.unitLabel}`, 20, yPosition);
      doc.text(data.formattedModulesPrice, pageWidth - 20, yPosition, {
        align: 'right',
      });
      yPosition += 7;
    }

    // Enhancements Breakdown
    if (data.selectedEnhancements.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(t('quote.summary.additionals').toUpperCase(), 20, yPosition);
      yPosition += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      data.selectedEnhancements.forEach((enh) => {
        doc.text(enh.name, 20, yPosition);
        const priceStr =
          data.currency === 'USD'
            ? `+$${enh.price.toLocaleString('en-US', { minimumFractionDigits: 0 })} USD`
            : `+$${enh.price.toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN`;

        doc.text(priceStr, pageWidth - 20, yPosition, { align: 'right' });
        yPosition += 7;
      });
    } else {
      yPosition += 3;
    }

    // Delivery Time
    doc.setTextColor(100, 100, 100);
    doc.text(
      `${t('quote.summary.delivery')}: ~${data.calculation.deliveryDays} ${t('quote.summary.days')}`,
      20,
      yPosition,
    );
    yPosition += 10;

    // Total
    doc.setDrawColor(0, 0, 0);
    doc.line(20, yPosition - 5, pageWidth - 20, yPosition - 5);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(t('quote.summary.total'), 20, yPosition);
    doc.text(data.formattedTotal, pageWidth - 20, yPosition, {
      align: 'right',
    });
    yPosition += 15;

    // Disclaimer
    yPosition += 5; // Add some space after the box
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 120);
    const disclaimerLines = doc.splitTextToSize(t('quote.summary.disclaimer'), pageWidth - 40);
    doc.text(disclaimerLines, 20, yPosition);

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Francisco Moreno - Senior Web UI Engineer - ${new Date().getFullYear()}`,
      pageWidth / 2,
      footerY,
      { align: 'center' },
    );

    // Save PDF
    // Save PDF
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const safeProjectName = data.projectType.name.replaceAll(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Quote_${safeProjectName}_${dateStr}.pdf`;

    // Robust download method
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}

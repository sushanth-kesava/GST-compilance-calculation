package com.smartretail360.util;

import com.smartretail360.model.Invoice;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;

public class PdfInvoiceGenerator {

    public static byte[] generateInvoicePdf(Invoice invoice) throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                // Header Banner
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 22);
                contentStream.setLeading(24);
                contentStream.newLineAtOffset(50, 740);
                contentStream.showText("SMARTRETAIL 360");
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA, 10);
                contentStream.newLineAtOffset(50, 725);
                contentStream.showText("GSTIN: 29AAAAA1111A1Z1 | State: Karnataka");
                contentStream.newLineAtOffset(0, -12);
                contentStream.showText("Email: support@smartretail360.com");
                contentStream.endText();

                // Invoice Meta Info
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
                contentStream.newLineAtOffset(400, 740);
                contentStream.showText("TAX INVOICE");
                contentStream.setFont(PDType1Font.HELVETICA, 10);
                contentStream.newLineAtOffset(0, -15);
                contentStream.showText("Invoice No: " + invoice.getInvoiceNumber());
                contentStream.newLineAtOffset(0, -12);
                contentStream.showText("Date: " + invoice.getCreatedAt().toString());
                contentStream.endText();

                // Draw a separator line
                contentStream.setLineWidth(1f);
                contentStream.moveTo(50, 680);
                contentStream.lineTo(550, 680);
                contentStream.stroke();

                // Customer Details Section
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 11);
                contentStream.newLineAtOffset(50, 660);
                contentStream.showText("BILLED TO:");
                contentStream.setFont(PDType1Font.HELVETICA, 10);
                contentStream.newLineAtOffset(0, -15);
                contentStream.showText("Name: " + invoice.getCustomerName());
                contentStream.newLineAtOffset(0, -12);
                contentStream.showText("Phone: " + invoice.getCustomerPhone());
                contentStream.newLineAtOffset(0, -12);
                contentStream.showText("State: " + invoice.getCustomerState());
                contentStream.endText();

                // Draw Table Header
                int yPosition = 590;
                contentStream.moveTo(50, yPosition);
                contentStream.lineTo(550, yPosition);
                contentStream.stroke();

                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 9);
                contentStream.newLineAtOffset(55, yPosition - 12);
                contentStream.showText("Item Name");
                contentStream.newLineAtOffset(180, 0);
                contentStream.showText("HSN");
                contentStream.newLineAtOffset(60, 0);
                contentStream.showText("Qty");
                contentStream.newLineAtOffset(60, 0);
                contentStream.showText("MRP");
                contentStream.newLineAtOffset(60, 0);
                contentStream.showText("GST %");
                contentStream.newLineAtOffset(80, 0);
                contentStream.showText("Amount");
                contentStream.endText();

                contentStream.moveTo(50, yPosition - 18);
                contentStream.lineTo(550, yPosition - 18);
                contentStream.stroke();

                yPosition -= 32;

                // Render Table Items
                contentStream.setFont(PDType1Font.HELVETICA, 9);
                for (Invoice.InvoiceItem item : invoice.getItems()) {
                    contentStream.beginText();
                    contentStream.newLineAtOffset(55, yPosition);
                    
                    // Truncate long names to fit in the column space
                    String name = item.getProductName();
                    if (name.length() > 28) {
                        name = name.substring(0, 25) + "...";
                    }
                    contentStream.showText(name);
                    
                    contentStream.newLineAtOffset(180, 0);
                    contentStream.showText(item.getHsnCode());
                    contentStream.newLineAtOffset(60, 0);
                    contentStream.showText(String.valueOf(item.getQuantity()));
                    contentStream.newLineAtOffset(60, 0);
                    contentStream.showText(item.getMrp().toString());
                    contentStream.newLineAtOffset(60, 0);
                    contentStream.showText(item.getGstPercentage().toString() + "%");
                    contentStream.newLineAtOffset(80, 0);
                    contentStream.showText("INR " + item.getTotalAmount().toString());
                    contentStream.endText();
                    
                    yPosition -= 15;
                }

                // Separator line
                contentStream.moveTo(50, yPosition);
                contentStream.lineTo(550, yPosition);
                contentStream.stroke();

                yPosition -= 20;

                // Summary Block
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA, 9);
                contentStream.newLineAtOffset(350, yPosition);
                
                contentStream.showText("Subtotal: INR " + invoice.getSubtotal().toString());
                contentStream.newLineAtOffset(0, -12);
                contentStream.showText("Item Discount: INR " + invoice.getItemDiscount().toString());
                contentStream.newLineAtOffset(0, -12);
                contentStream.showText("Combo Discount: INR " + invoice.getComboDiscount().toString());
                contentStream.newLineAtOffset(0, -12);
                contentStream.showText("Membership Disc: INR " + invoice.getMembershipDiscount().toString());
                contentStream.newLineAtOffset(0, -12);
                contentStream.showText("Coupon / Promo: INR " + invoice.getCouponDiscount().add(invoice.getStorePromotionDiscount()).toString());
                contentStream.newLineAtOffset(0, -12);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 9);
                contentStream.showText("Taxable Value: INR " + invoice.getTaxableValue().toString());
                contentStream.newLineAtOffset(0, -12);
                
                if (invoice.getIgst().compareTo(BigDecimal.ZERO) > 0) {
                    contentStream.showText("IGST: INR " + invoice.getIgst().toString());
                } else {
                    contentStream.showText("CGST: INR " + invoice.getCgst().toString());
                    contentStream.newLineAtOffset(0, -12);
                    contentStream.showText("SGST: INR " + invoice.getSgst().toString());
                }
                
                contentStream.newLineAtOffset(0, -12);
                contentStream.setFont(PDType1Font.HELVETICA, 9);
                contentStream.showText("Round Off: INR " + invoice.getRoundOff().toString());
                contentStream.newLineAtOffset(0, -15);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
                contentStream.showText("Net Payable: INR " + invoice.getFinalAmount().toString());
                contentStream.endText();

                // Payment Info
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 9);
                contentStream.newLineAtOffset(50, yPosition);
                contentStream.showText("Payment Mode: " + invoice.getPaymentMethod());
                if (invoice.getSplitDetails() != null && !invoice.getSplitDetails().isEmpty()) {
                    contentStream.newLineAtOffset(0, -12);
                    contentStream.setFont(PDType1Font.HELVETICA, 8);
                    contentStream.showText("Breakdown: " + invoice.getSplitDetails().toString());
                }
                contentStream.endText();

                // Digital Signature Placeholder
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 9);
                contentStream.newLineAtOffset(50, 100);
                contentStream.showText("Digitally Signed By:");
                contentStream.setFont(PDType1Font.HELVETICA, 8);
                contentStream.newLineAtOffset(0, -12);
                contentStream.showText("SMARTRETAIL360 ERP ENGINE");
                contentStream.newLineAtOffset(0, -12);
                contentStream.showText("Authorized Signatory");
                contentStream.endText();
            }

            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            document.save(byteArrayOutputStream);
            return byteArrayOutputStream.toByteArray();
        }
    }
}

package com.smartretail360.controller;

import com.smartretail360.dto.ApiResponse;
import com.smartretail360.dto.BillingRequest;
import com.smartretail360.model.Invoice;
import com.smartretail360.repository.InvoiceRepository;
import com.smartretail360.service.BillingService;
import com.smartretail360.util.PdfInvoiceGenerator;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired
    private BillingService billingService;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<Invoice>> checkout(@Valid @RequestBody BillingRequest request) {
        Invoice invoice = billingService.calculateAndSaveInvoice(request);
        return ResponseEntity.ok(ApiResponse.success(invoice, "Invoice generated successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Invoice>>> getAllInvoices() {
        List<Invoice> invoices = invoiceRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Invoice>> getInvoiceById(@PathVariable("id") String id) {
        Invoice invoice = invoiceRepository.findById(id)
                .or(() -> invoiceRepository.findByInvoiceNumber(id))
                .orElseThrow(() -> new com.smartretail360.exception.CustomException("Invoice not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable("id") String id) throws IOException {
        Invoice invoice = invoiceRepository.findById(id)
                .or(() -> invoiceRepository.findByInvoiceNumber(id))
                .orElseThrow(() -> new com.smartretail360.exception.CustomException("Invoice not found", HttpStatus.NOT_FOUND));

        byte[] pdfBytes = PdfInvoiceGenerator.generateInvoicePdf(invoice);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", invoice.getInvoiceNumber() + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @PostMapping("/{id}/email")
    public ResponseEntity<ApiResponse<Void>> emailInvoice(@PathVariable("id") String id, @RequestParam("email") String email) {
        Invoice invoice = invoiceRepository.findById(id)
                .or(() -> invoiceRepository.findByInvoiceNumber(id))
                .orElseThrow(() -> new com.smartretail360.exception.CustomException("Invoice not found", HttpStatus.NOT_FOUND));

        // Send email mock
        System.out.println("====== EMAIL INVOICE SIMULATION ======");
        System.out.println("To: " + email);
        System.out.println("Subject: Tax Invoice - " + invoice.getInvoiceNumber());
        System.out.println("Attachment: " + invoice.getInvoiceNumber() + ".pdf");
        System.out.println("Body: Hello " + invoice.getCustomerName() + ", please find attached your receipt.");
        System.out.println("======================================");

        return ResponseEntity.ok(ApiResponse.success(null, "Invoice email sent successfully to " + email));
    }
}

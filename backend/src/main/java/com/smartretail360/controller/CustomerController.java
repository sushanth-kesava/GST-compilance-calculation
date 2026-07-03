package com.smartretail360.controller;

import com.smartretail360.dto.ApiResponse;
import com.smartretail360.exception.CustomException;
import com.smartretail360.model.Customer;
import com.smartretail360.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Customer>>> getAllCustomers() {
        return ResponseEntity.ok(ApiResponse.success(customerRepository.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Customer>> getCustomerById(@PathVariable("id") String id) {
        Customer customer = customerRepository.findById(id)
                .or(() -> customerRepository.findByPhone(id))
                .orElseThrow(() -> new CustomException("Customer not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.success(customer));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Customer>> createCustomer(@RequestBody Customer customer) {
        if (customer.getPhone() == null || customer.getPhone().isEmpty()) {
            throw new CustomException("Phone number is required", HttpStatus.BAD_REQUEST);
        }
        if (customerRepository.findByPhone(customer.getPhone()).isPresent()) {
            throw new CustomException("Customer with this phone number already exists", HttpStatus.BAD_REQUEST);
        }
        Customer saved = customerRepository.save(customer);
        return ResponseEntity.ok(ApiResponse.success(saved, "Customer created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Customer>> updateCustomer(@PathVariable("id") String id, @RequestBody Customer details) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new CustomException("Customer not found", HttpStatus.NOT_FOUND));

        customer.setName(details.getName());
        customer.setEmail(details.getEmail());
        customer.setPhone(details.getPhone());
        customer.setState(details.getState());
        customer.setAddress(details.getAddress());

        Customer updated = customerRepository.save(customer);
        return ResponseEntity.ok(ApiResponse.success(updated, "Customer updated successfully"));
    }

    @PostMapping("/{id}/wallet")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Customer>> topUpWallet(@PathVariable("id") String id, @RequestParam("amount") BigDecimal amount) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new CustomException("Customer not found", HttpStatus.NOT_FOUND));

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException("Amount must be greater than zero", HttpStatus.BAD_REQUEST);
        }

        BigDecimal balance = customer.getWalletBalance() != null ? customer.getWalletBalance() : BigDecimal.ZERO;
        customer.setWalletBalance(balance.add(amount));

        Customer updated = customerRepository.save(customer);
        return ResponseEntity.ok(ApiResponse.success(updated, "Wallet topped up successfully by INR " + amount));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable("id") String id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new CustomException("Customer not found", HttpStatus.NOT_FOUND));
        customerRepository.delete(customer);
        return ResponseEntity.ok(ApiResponse.success(null, "Customer profile deleted successfully"));
    }
}

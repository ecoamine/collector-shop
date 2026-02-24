package com.collectorshop.controller;

import com.collectorshop.dto.CreateItemRequest;
import com.collectorshop.dto.ItemListingResponse;
import com.collectorshop.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seller/items")
@RequiredArgsConstructor
public class SellerItemController {

    private final ItemService itemService;

    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ItemListingResponse createItem(Authentication authentication,
                                          @Valid @RequestBody CreateItemRequest request) {
        String username = authentication.getName();
        return itemService.createItemForSeller(request, username);
    }
}


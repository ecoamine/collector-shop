package com.collectorshop.controller;

import com.collectorshop.dto.ItemListingResponse;
import com.collectorshop.service.ItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @GetMapping
    public List<ItemListingResponse> getItems() {
        return itemService.getAllItems();
    }

    @GetMapping("/{id}")
    public ItemListingResponse getItemById(@PathVariable Long id) {
        return itemService.getItemById(id);
    }
}


package com.collectorshop.mapper;

import com.collectorshop.domain.Category;
import com.collectorshop.domain.ItemListing;
import com.collectorshop.dto.ItemListingResponse;

public final class ItemListingMapper {

    private ItemListingMapper() {
    }

    public static ItemListingResponse toResponse(ItemListing item) {
        if (item == null) {
            return null;
        }
        return ItemListingResponse.builder()
                .id(item.getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .price(item.getPrice())
                .imageUrl(item.getImageUrl())
                .createdAt(item.getCreatedAt())
                .sellerId(item.getSellerId())
                .category(CategoryMapper.toDto(item.getCategory()))
                .build();
    }

    /** Utilise la catégorie déjà chargée pour éviter LazyInitializationException après save(). */
    public static ItemListingResponse toResponse(ItemListing item, Category category) {
        if (item == null) {
            return null;
        }
        return ItemListingResponse.builder()
                .id(item.getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .price(item.getPrice())
                .imageUrl(item.getImageUrl())
                .createdAt(item.getCreatedAt())
                .sellerId(item.getSellerId())
                .category(CategoryMapper.toDto(category))
                .build();
    }
}


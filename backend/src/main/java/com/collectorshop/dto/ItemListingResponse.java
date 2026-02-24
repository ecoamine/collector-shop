package com.collectorshop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
public class ItemListingResponse {

    private final Long id;
    private final String title;
    private final String description;
    private final BigDecimal price;
    private final String imageUrl;
    private final OffsetDateTime createdAt;
    private final Long sellerId;
    private final CategoryDto category;
}


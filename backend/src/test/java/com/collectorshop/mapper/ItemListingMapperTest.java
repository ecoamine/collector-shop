package com.collectorshop.mapper;

import com.collectorshop.domain.Category;
import com.collectorshop.domain.ItemListing;
import com.collectorshop.dto.ItemListingResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class ItemListingMapperTest {

    @Test
    void toResponse_whenItemNull_returnsNull() {
        assertThat(ItemListingMapper.toResponse(null)).isNull();
        assertThat(ItemListingMapper.toResponse(null, new Category())).isNull();
    }

    @Test
    void toResponse_withCategoryParam_mapsFields() {
        Category category = Category.builder().id(1L).name("Cards").build();
        ItemListing item = ItemListing.builder()
                .id(10L)
                .title("Title")
                .description("Desc")
                .price(BigDecimal.TEN)
                .imageUrl("http://img")
                .createdAt(OffsetDateTime.now())
                .sellerId(5L)
                .category(category)
                .build();

        ItemListingResponse response = ItemListingMapper.toResponse(item, category);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getTitle()).isEqualTo("Title");
        assertThat(response.getDescription()).isEqualTo("Desc");
        assertThat(response.getPrice()).isEqualByComparingTo(BigDecimal.TEN);
        assertThat(response.getImageUrl()).isEqualTo("http://img");
        assertThat(response.getSellerId()).isEqualTo(5L);
        assertThat(response.getCategory()).isNotNull();
        assertThat(response.getCategory().getName()).isEqualTo("Cards");
    }
}

package com.collectorshop.mapper;

import com.collectorshop.domain.Category;
import com.collectorshop.dto.CategoryDto;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CategoryMapperTest {

    @Test
    void toDto_whenNull_returnsNull() {
        assertThat(CategoryMapper.toDto(null)).isNull();
    }

    @Test
    void toDto_mapsFields() {
        Category category = Category.builder().id(1L).name("Cards").build();

        CategoryDto dto = CategoryMapper.toDto(category);

        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getName()).isEqualTo("Cards");
    }
}

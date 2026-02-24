package com.collectorshop.mapper;

import com.collectorshop.domain.Category;
import com.collectorshop.dto.CategoryDto;

public final class CategoryMapper {

    private CategoryMapper() {
    }

    public static CategoryDto toDto(Category category) {
        if (category == null) {
            return null;
        }
        return new CategoryDto(category.getId(), category.getName());
    }
}


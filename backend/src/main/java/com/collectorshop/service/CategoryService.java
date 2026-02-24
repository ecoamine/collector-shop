package com.collectorshop.service;

import com.collectorshop.domain.Category;
import com.collectorshop.dto.CategoryDto;
import com.collectorshop.dto.CreateCategoryRequest;
import com.collectorshop.exception.NotFoundException;
import com.collectorshop.mapper.CategoryMapper;
import com.collectorshop.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .map(CategoryMapper::toDto)
                .toList();
    }

    @Transactional
    public CategoryDto createCategory(CreateCategoryRequest request) {
        categoryRepository.findByName(request.getName())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Category with this name already exists");
                });

        Category category = Category.builder()
                .name(request.getName())
                .build();

        Category saved = categoryRepository.save(category);
        return CategoryMapper.toDto(saved);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new NotFoundException("Category not found with id " + id);
        }
        categoryRepository.deleteById(id);
    }
}


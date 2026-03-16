package com.collectorshop.service;

import com.collectorshop.domain.Category;
import com.collectorshop.dto.CategoryDto;
import com.collectorshop.dto.CreateCategoryRequest;
import com.collectorshop.exception.NotFoundException;
import com.collectorshop.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    void getAllCategories_returnsDtos() {
        Category category = Category.builder()
                .id(1L)
                .name("Cards")
                .build();
        when(categoryRepository.findAll()).thenReturn(List.of(category));

        List<CategoryDto> dtos = categoryService.getAllCategories();

        assertThat(dtos).hasSize(1);
        assertThat(dtos.getFirst().getName()).isEqualTo("Cards");
    }

    @Test
    void createCategory_whenNameExists_throws() {
        CreateCategoryRequest request = new CreateCategoryRequest();
        request.setName("Cards");

        when(categoryRepository.findByName("Cards")).thenReturn(Optional.of(new Category()));

        assertThrows(IllegalArgumentException.class, () -> categoryService.createCategory(request));
    }

    @Test
    void createCategory_success_returnsDto() {
        CreateCategoryRequest request = new CreateCategoryRequest();
        request.setName("NewCat");
        when(categoryRepository.findByName("NewCat")).thenReturn(Optional.empty());
        Category saved = Category.builder().id(10L).name("NewCat").build();
        when(categoryRepository.save(any(Category.class))).thenReturn(saved);

        CategoryDto result = categoryService.createCategory(request);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getName()).isEqualTo("NewCat");
        verify(categoryRepository).flush();
    }

    @Test
    void createCategory_whenNameEmpty_throws() {
        CreateCategoryRequest request = new CreateCategoryRequest();
        request.setName("   ");

        assertThrows(IllegalArgumentException.class, () -> categoryService.createCategory(request));
    }

    @Test
    void deleteCategory_whenMissing_throwsNotFound() {
        when(categoryRepository.existsById(99L)).thenReturn(false);

        assertThrows(NotFoundException.class, () -> categoryService.deleteCategory(99L));
    }

    @Test
    void deleteCategory_whenExists_deletes() {
        when(categoryRepository.existsById(1L)).thenReturn(true);

        categoryService.deleteCategory(1L);

        verify(categoryRepository).deleteById(1L);
    }
}


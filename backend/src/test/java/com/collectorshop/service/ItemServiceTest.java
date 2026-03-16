package com.collectorshop.service;

import com.collectorshop.domain.Category;
import com.collectorshop.domain.ItemListing;
import com.collectorshop.domain.User;
import com.collectorshop.dto.CreateItemRequest;
import com.collectorshop.dto.ItemListingResponse;
import com.collectorshop.exception.NotFoundException;
import com.collectorshop.repository.CategoryRepository;
import com.collectorshop.repository.ItemListingRepository;
import com.collectorshop.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ItemServiceTest {

    @Mock
    private ItemListingRepository itemListingRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ItemService itemService;

    private Category category;

    @BeforeEach
    void setUp() {
        category = Category.builder()
                .id(1L)
                .name("Cards")
                .build();
    }

    @Test
    void getAllItems_mapsToDtos() {
        ItemListing item = ItemListing.builder()
                .id(1L)
                .title("Test Item")
                .price(BigDecimal.TEN)
                .category(category)
                .build();

        when(itemListingRepository.findAll()).thenReturn(List.of(item));

        List<ItemListingResponse> result = itemService.getAllItems();

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getTitle()).isEqualTo("Test Item");
    }

    @Test
    void getItemById_whenNotFound_throws() {
        when(itemListingRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> itemService.getItemById(99L));
    }

    @Test
    void getItemById_whenFound_returnsDto() {
        ItemListing item = ItemListing.builder()
                .id(1L)
                .title("Item")
                .price(BigDecimal.ONE)
                .sellerId(10L)
                .createdAt(OffsetDateTime.now())
                .category(category)
                .build();
        when(itemListingRepository.findById(1L)).thenReturn(Optional.of(item));

        ItemListingResponse result = itemService.getItemById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Item");
    }

    @Test
    void createItemForSeller_persistsNewItem() {
        User seller = User.builder()
                .id(10L)
                .username("seller")
                .password("encoded")
                .build();

        when(userRepository.findByUsername("seller")).thenReturn(Optional.of(seller));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(itemListingRepository.saveAndFlush(any(ItemListing.class)))
                .thenAnswer(invocation -> {
                    ItemListing toSave = invocation.getArgument(0);
                    toSave.setId(123L);
                    return toSave;
                });

        CreateItemRequest request = new CreateItemRequest();
        request.setTitle("New Item");
        request.setPrice(BigDecimal.ONE);
        request.setCategoryId(1L);

        ItemListingResponse response = itemService.createItemForSeller(request, "seller");

        assertThat(response.getId()).isEqualTo(123L);
        assertThat(response.getSellerId()).isEqualTo(10L);
        assertThat(response.getCategory().getName()).isEqualTo("Cards");
    }
}


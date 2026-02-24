package com.collectorshop.service;

import com.collectorshop.domain.Category;
import com.collectorshop.domain.ItemListing;
import com.collectorshop.domain.User;
import com.collectorshop.dto.CreateItemRequest;
import com.collectorshop.dto.ItemListingResponse;
import com.collectorshop.exception.NotFoundException;
import com.collectorshop.mapper.ItemListingMapper;
import com.collectorshop.repository.CategoryRepository;
import com.collectorshop.repository.ItemListingRepository;
import com.collectorshop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItemService {

    private final ItemListingRepository itemListingRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<ItemListingResponse> getAllItems() {
        return itemListingRepository.findAll()
                .stream()
                .map(ItemListingMapper::toResponse)
                .toList();
    }

    public ItemListingResponse getItemById(Long id) {
        ItemListing item = itemListingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Item not found with id " + id));
        return ItemListingMapper.toResponse(item);
    }

    @Transactional
    public ItemListingResponse createItemForSeller(CreateItemRequest request, String sellerUsername) {
        User seller = userRepository.findByUsername(sellerUsername)
                .orElseThrow(() -> new NotFoundException("Seller not found"));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new NotFoundException("Category not found with id " + request.getCategoryId()));

        ItemListing item = ItemListing.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .createdAt(OffsetDateTime.now())
                .sellerId(seller.getId())
                .category(category)
                .build();

        ItemListing saved = itemListingRepository.save(item);
        return ItemListingMapper.toResponse(saved);
    }
}


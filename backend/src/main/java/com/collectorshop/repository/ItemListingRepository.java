package com.collectorshop.repository;

import com.collectorshop.domain.ItemListing;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemListingRepository extends JpaRepository<ItemListing, Long> {
}


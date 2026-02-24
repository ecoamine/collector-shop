package com.collectorshop.repository;

import com.collectorshop.config.BasePostgresContainerTest;
import com.collectorshop.domain.ItemListing;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ItemListingRepositoryIT extends BasePostgresContainerTest {

    @Autowired
    private ItemListingRepository itemListingRepository;

    @Test
    void findAll_returnsSeededItemFromFlyway() {
        List<ItemListing> items = itemListingRepository.findAll();
        assertThat(items).isNotEmpty();
    }
}


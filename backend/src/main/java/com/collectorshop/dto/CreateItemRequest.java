package com.collectorshop.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateItemRequest {

    @NotBlank
    @Size(max = 200)
    private String title;

    @Size(max = 10_000)
    private String description;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    @Setter(AccessLevel.NONE)
    private BigDecimal price;

    /** Accepte Number (JSON number) ou BigDecimal pour compatibilité frontend et Jackson. */
    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public void setPrice(Number price) {
        this.price = price == null ? null : BigDecimal.valueOf(price.doubleValue());
    }

    @Size(max = 500)
    private String imageUrl;

    @NotNull
    private Long categoryId;
}


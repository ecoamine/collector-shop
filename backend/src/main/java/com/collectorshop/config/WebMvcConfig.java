package com.collectorshop.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.List;

/**
 * Accepts Content-Type "application/json;charset=UTF-8" in addition to "application/json".
 * Some clients (e.g. axios, browsers) send the charset parameter and Spring rejects it by default.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void extendMessageConverters(List<org.springframework.http.converter.HttpMessageConverter<?>> converters) {
        for (org.springframework.http.converter.HttpMessageConverter<?> converter : converters) {
            if (converter instanceof MappingJackson2HttpMessageConverter jsonConverter) {
                List<MediaType> supported = new ArrayList<>(jsonConverter.getSupportedMediaTypes());
                supported.add(MediaType.parseMediaType("application/json;charset=UTF-8"));
                jsonConverter.setSupportedMediaTypes(supported);
                break;
            }
        }
    }
}

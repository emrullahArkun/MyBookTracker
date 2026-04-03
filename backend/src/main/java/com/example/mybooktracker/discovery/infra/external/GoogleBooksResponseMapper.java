package com.example.mybooktracker.discovery.infra.external;

import com.example.mybooktracker.discovery.domain.DiscoveryBook;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Maps Google Books API responses to domain objects.
 * Package-private: only used by {@link GoogleBooksClient}.
 */
class GoogleBooksResponseMapper {

    private static final int MAX_CATEGORIES = 3;
    private static final Pattern PUBLISHED_YEAR_PATTERN = Pattern.compile("^(\\d{4})");

    List<DiscoveryBook> mapBooks(List<GoogleBookItem> items) {
        if (items == null) {
            return Collections.emptyList();
        }

        return items.stream()
                .map(GoogleBookItem::volumeInfo)
                .filter(volumeInfo -> volumeInfo != null && hasCover(volumeInfo))
                .map(this::mapToBook)
                .toList();
    }

    private boolean hasCover(GoogleVolumeInfo volumeInfo) {
        return StringUtils.hasText(extractCoverUrl(volumeInfo));
    }

    private DiscoveryBook mapToBook(GoogleVolumeInfo volumeInfo) {
        List<String> categories = volumeInfo.categories();
        if (categories != null && categories.size() > MAX_CATEGORIES) {
            categories = categories.subList(0, MAX_CATEGORIES);
        }

        return new DiscoveryBook(
                volumeInfo.title(),
                volumeInfo.authors(),
                categories,
                extractPublishYear(volumeInfo.publishedDate()),
                volumeInfo.pageCount(),
                extractIsbn(volumeInfo.industryIdentifiers()),
                extractCoverUrl(volumeInfo));
    }

    private Integer extractPublishYear(String publishedDate) {
        if (!StringUtils.hasText(publishedDate)) {
            return null;
        }

        Matcher matcher = PUBLISHED_YEAR_PATTERN.matcher(publishedDate);
        return matcher.find() ? Integer.valueOf(matcher.group(1)) : null;
    }

    private String extractIsbn(List<IndustryIdentifier> identifiers) {
        if (identifiers == null || identifiers.isEmpty()) {
            return null;
        }

        return identifiers.stream()
                .filter(identifier -> "ISBN_13".equals(identifier.type()) && StringUtils.hasText(identifier.identifier()))
                .map(IndustryIdentifier::identifier)
                .findFirst()
                .or(() -> identifiers.stream()
                        .filter(identifier -> "ISBN_10".equals(identifier.type()) && StringUtils.hasText(identifier.identifier()))
                        .map(IndustryIdentifier::identifier)
                        .findFirst())
                .orElseGet(() -> identifiers.stream()
                        .map(IndustryIdentifier::identifier)
                        .filter(StringUtils::hasText)
                        .findFirst()
                        .orElse(null));
    }

    private String extractCoverUrl(GoogleVolumeInfo volumeInfo) {
        if (volumeInfo.imageLinks() == null) {
            return null;
        }

        String rawUrl = firstNonBlank(
                volumeInfo.imageLinks().extraLarge(),
                volumeInfo.imageLinks().large(),
                volumeInfo.imageLinks().medium(),
                volumeInfo.imageLinks().small(),
                volumeInfo.imageLinks().thumbnail(),
                volumeInfo.imageLinks().smallThumbnail());

        if (!StringUtils.hasText(rawUrl)) {
            return null;
        }

        return enhanceGoogleBooksImageUrl(rawUrl);
    }

    private String enhanceGoogleBooksImageUrl(String rawUrl) {
        String normalizedUrl = rawUrl.replace("http://", "https://");

        if (!normalizedUrl.contains("books.google") || !normalizedUrl.contains("?")) {
            return normalizedUrl;
        }

        try {
            var builder = UriComponentsBuilder.fromUriString(normalizedUrl);
            String zoom = builder.build().getQueryParams().getFirst("zoom");
            if (!StringUtils.hasText(zoom) || Integer.parseInt(zoom) < 3) {
                builder.replaceQueryParam("zoom", 3);
            }
            return builder.build(true).toUriString();
        } catch (RuntimeException e) {
            return normalizedUrl;
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }

    // --- Google Books API response DTOs ---

    record GoogleBooksResponse(
            @JsonProperty("totalItems") Integer totalItems,
            List<GoogleBookItem> items
    ) {}

    record GoogleBookItem(
            @JsonProperty("volumeInfo") GoogleVolumeInfo volumeInfo
    ) {}

    record GoogleVolumeInfo(
            String title,
            List<String> authors,
            List<String> categories,
            @JsonProperty("publishedDate") String publishedDate,
            @JsonProperty("pageCount") Integer pageCount,
            @JsonProperty("industryIdentifiers") List<IndustryIdentifier> industryIdentifiers,
            @JsonProperty("imageLinks") ImageLinks imageLinks
    ) {}

    record IndustryIdentifier(
            String type,
            String identifier
    ) {}

    record ImageLinks(
            @JsonProperty("extraLarge") String extraLarge,
            String large,
            String medium,
            String small,
            String thumbnail,
            @JsonProperty("smallThumbnail") String smallThumbnail
    ) {}
}

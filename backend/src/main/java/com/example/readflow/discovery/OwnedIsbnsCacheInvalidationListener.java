package com.example.readflow.discovery;

import com.example.readflow.books.BookCollectionChangedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class OwnedIsbnsCacheInvalidationListener {

    private final CacheManager cacheManager;

    // Observer pattern: this listener reacts to book collection changes and keeps discovery caches coherent.
    @EventListener
    public void handleBookCollectionChanged(BookCollectionChangedEvent event) {
        Cache cache = cacheManager.getCache("ownedIsbns");
        if (cache != null) {
            cache.evict(event.userId());
        }
    }
}

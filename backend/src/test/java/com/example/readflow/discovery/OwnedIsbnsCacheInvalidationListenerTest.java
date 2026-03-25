package com.example.readflow.discovery;

import com.example.readflow.books.BookCollectionChangedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OwnedIsbnsCacheInvalidationListenerTest {

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache cache;

    @InjectMocks
    private OwnedIsbnsCacheInvalidationListener listener;

    @Test
    void handleBookCollectionChanged_ShouldEvictOwnedIsbnsCacheEntry() {
        when(cacheManager.getCache("ownedIsbns")).thenReturn(cache);

        listener.handleBookCollectionChanged(new BookCollectionChangedEvent(42L));

        verify(cache).evict(42L);
    }
}

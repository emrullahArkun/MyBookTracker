package com.example.readflow.discovery;

import java.util.List;
import java.util.Set;

record DiscoverySnapshot(
        Set<String> ownedIsbns,
        List<String> topAuthors,
        List<String> topCategories,
        List<String> recentSearches
) {}

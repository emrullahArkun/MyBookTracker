package com.example.readflow.books;

import com.example.readflow.books.dto.BookDto;
import com.example.readflow.books.dto.CreateBookRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface BookMapper {

    @Mapping(target = "authorName", source = "author")
    @Mapping(target = "readingGoalProgress", ignore = true)
    BookDto toDto(Book book);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "author", source = "authorName")
    @Mapping(target = "currentPage", ignore = true)
    @Mapping(target = "startDate", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "completed", ignore = true)
    @Mapping(target = "readingGoalType", ignore = true)
    @Mapping(target = "readingGoalPages", ignore = true)
    @Mapping(target = "readingSessions", ignore = true)
    Book toEntity(CreateBookRequest request);

}

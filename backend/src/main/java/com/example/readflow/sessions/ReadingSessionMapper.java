package com.example.readflow.sessions;

import com.example.readflow.sessions.dto.ReadingSessionDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface ReadingSessionMapper {

    @Mapping(target = "bookId", source = "book.id")
    ReadingSessionDto toDto(ReadingSession session);
}

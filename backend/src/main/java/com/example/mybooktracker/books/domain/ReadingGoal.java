package com.example.mybooktracker.books.domain;

import com.example.mybooktracker.shared.exception.DomainValidationException;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor
@EqualsAndHashCode
public class ReadingGoal {

    @Enumerated(EnumType.STRING)
    @Column(name = "reading_goal_type")
    private ReadingGoalType type;

    @Column(name = "reading_goal_pages")
    private Integer pages;

    private ReadingGoal(ReadingGoalType type, Integer pages) {
        this.type = type;
        this.pages = pages;
    }

    public static ReadingGoal of(ReadingGoalType type, Integer pages) {
        if (type == null && pages != null) {
            throw new DomainValidationException("Reading goal pages require a reading goal type");
        }
        if (pages != null && pages <= 0) {
            throw new DomainValidationException("Reading goal pages must be positive");
        }
        return new ReadingGoal(type, pages);
    }

    public static ReadingGoal none() {
        return new ReadingGoal(null, null);
    }

    public boolean isSet() {
        return type != null;
    }
}

package com.example.readflow;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

@AnalyzeClasses(packages = "com.example.readflow", importOptions = { ImportOption.DoNotIncludeTests.class })
public class ArchitectureTest {

        @ArchTest
        static final ArchRule controllers_should_not_access_repositories = noClasses().that()
                        .haveSimpleNameEndingWith("Controller")
                        .should().dependOnClassesThat().haveSimpleNameEndingWith("Repository");

        @ArchTest
        static final ArchRule services_should_be_annotated_with_Service = classes().that()
                        .haveSimpleNameEndingWith("Service")
                        .and().areNotInterfaces()
                        .should().beAnnotatedWith(org.springframework.stereotype.Service.class);

        @ArchTest
        static final ArchRule controllers_should_be_annotated_with_RestController = classes().that()
                        .haveSimpleNameEndingWith("Controller")
                        .should().beAnnotatedWith(org.springframework.web.bind.annotation.RestController.class);

        @ArchTest
        static final ArchRule shared_should_not_depend_on_books = noClasses().that()
                        .resideInAPackage("..shared..")
                        .should().dependOnClassesThat()
                        .resideInAnyPackage("..books..", "..sessions..", "..discovery..");
}

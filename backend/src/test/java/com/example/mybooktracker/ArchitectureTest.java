package com.example.mybooktracker;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

@AnalyzeClasses(packages = "com.example.mybooktracker", importOptions = { ImportOption.DoNotIncludeTests.class })
public class ArchitectureTest {

        @ArchTest
        static final ArchRule controllers_should_not_access_repositories = noClasses().that()
                        .haveSimpleNameEndingWith("Controller")
                        .should().dependOnClassesThat().haveSimpleNameEndingWith("Repository");

        @ArchTest
        static final ArchRule controllers_should_live_in_api_packages = classes().that()
                        .haveSimpleNameEndingWith("Controller")
                        .should().resideInAPackage("..api");

        @ArchTest
        static final ArchRule controllers_should_be_annotated_with_RestController = classes().that()
                        .haveSimpleNameEndingWith("Controller")
                        .should().beAnnotatedWith(org.springframework.web.bind.annotation.RestController.class);

        @ArchTest
        static final ArchRule services_should_be_annotated_with_Service = classes().that()
                        .haveSimpleNameEndingWith("Service")
                        .and().areNotInterfaces()
                        .should().beAnnotatedWith(org.springframework.stereotype.Service.class);

        @ArchTest
        static final ArchRule repositories_should_live_in_infra_persistence_packages = classes().that()
                        .haveSimpleNameEndingWith("Repository")
                        .should().resideInAPackage("..infra.persistence");

        @ArchTest
        static final ArchRule feature_dtos_should_live_in_api_dto_packages = classes().that()
                        .areTopLevelClasses()
                        .and().resideOutsideOfPackage("..shared.dto..")
                        .and().haveSimpleNameEndingWith("Dto")
                        .should().resideInAPackage("..api.dto..");

        @ArchTest
        static final ArchRule feature_requests_should_live_in_api_dto_packages = classes().that()
                        .areTopLevelClasses()
                        .and().haveSimpleNameEndingWith("Request")
                        .should().resideInAPackage("..api.dto..");

        @ArchTest
        static final ArchRule feature_responses_should_live_in_api_dto_packages = classes().that()
                        .areTopLevelClasses()
                        .and().resideOutsideOfPackage("..shared.dto..")
                        .and().haveSimpleNameEndingWith("Response")
                        .should().resideInAPackage("..api.dto..");

        @ArchTest
        static final ArchRule non_security_shared_packages_should_not_depend_on_feature_packages = noClasses().that()
                        .resideInAnyPackage("..shared.config..", "..shared.dto..", "..shared.exception..", "..shared.time..")
                        .should().dependOnClassesThat()
                        .resideInAnyPackage("..auth..", "..books..", "..discovery..", "..sessions..", "..stats..");

        @ArchTest
        static final ArchRule shared_security_should_only_depend_on_auth_feature = noClasses().that()
                        .resideInAPackage("..shared.security..")
                        .should().dependOnClassesThat()
                        .resideInAnyPackage("..books..", "..discovery..", "..sessions..", "..stats..");

        @ArchTest
        static final ArchRule application_should_not_depend_on_api_packages = noClasses().that()
                        .resideInAPackage("..application..")
                        .should().dependOnClassesThat()
                        .resideInAnyPackage("..api..", "..api.dto..");

        @ArchTest
        static final ArchRule cross_feature_application_should_not_depend_on_sessions_infra = noClasses().that()
                        .resideInAnyPackage("..books.application..", "..stats.application..")
                        .should().dependOnClassesThat()
                        .resideInAnyPackage("..sessions.infra..", "..sessions.infra.persistence..");

        @ArchTest
        static final ArchRule cross_feature_application_should_not_depend_on_books_infra = noClasses().that()
                        .resideInAnyPackage("..sessions.application..", "..stats.application..", "..discovery.application..")
                        .should().dependOnClassesThat()
                        .resideInAnyPackage("..books.infra..", "..books.infra.persistence..");

        @ArchTest
        static final ArchRule cross_feature_application_should_not_depend_on_stats_infra = noClasses().that()
                        .resideInAnyPackage("..books.application..", "..sessions.application..", "..discovery.application..")
                        .should().dependOnClassesThat()
                        .resideInAnyPackage("..stats.infra..", "..stats.infra.persistence..");

        @ArchTest
        static final ArchRule domain_should_not_depend_on_api_or_infra_packages = noClasses().that()
                        .resideInAPackage("..domain..")
                        .should().dependOnClassesThat()
                        .resideInAnyPackage("..api..", "..api.dto..", "..infra..", "..infra.persistence..", "..infra.external..", "..infra.cache..");
}

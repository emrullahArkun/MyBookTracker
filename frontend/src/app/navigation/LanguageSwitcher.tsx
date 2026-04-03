import { Flex, Button, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ variant = 'default', ...props }) => {
    const { i18n } = useTranslation();
    const isDe = i18n.resolvedLanguage === 'de';

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    if (variant === 'auth') {
        return (
            <Flex
                gap={1}
                position="absolute"
                top={4}
                right={4}
                p={1}
                borderRadius="md"
                bg="linear-gradient(180deg, rgba(38, 29, 23, 0.96) 0%, rgba(25, 20, 16, 0.98) 100%)"
                border="1px solid"
                borderColor="rgba(217, 188, 146, 0.14)"
                boxShadow="0 14px 30px rgba(8, 6, 4, 0.2)"
                {...props}
            >
                <Button
                    size="sm"
                    variant="ghost"
                    color={!isDe ? "#f4ead7" : "rgba(217, 204, 182, 0.58)"}
                    bg={!isDe ? "rgba(197, 154, 92, 0.14)" : "transparent"}
                    _hover={{ bg: 'rgba(248, 236, 214, 0.08)', color: '#f4ead7' }}
                    borderRadius="sm"
                    onClick={() => changeLanguage('en')}
                    minW="42px"
                    px={3}
                >
                    EN
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    color={isDe ? "#f4ead7" : "rgba(217, 204, 182, 0.58)"}
                    bg={isDe ? "rgba(197, 154, 92, 0.14)" : "transparent"}
                    _hover={{ bg: 'rgba(248, 236, 214, 0.08)', color: '#f4ead7' }}
                    borderRadius="sm"
                    onClick={() => changeLanguage('de')}
                    minW="42px"
                    px={3}
                >
                    DE
                </Button>
            </Flex>
        );
    }

    if (variant === 'navbar' || variant === 'default') {
        return (
            <Flex
                align="center"
                gap={1}
                px={1}
                py={1}
                borderRadius="md"
                bg="rgba(248, 236, 214, 0.03)"
                border="1px solid"
                borderColor="rgba(217, 188, 146, 0.08)"
                {...props}
            >
                <Button
                    variant="ghost"
                    size="sm"
                    fontWeight={!isDe ? "semibold" : "medium"}
                    color={!isDe ? "#f4ead7" : "rgba(217, 204, 182, 0.58)"}
                    bg={!isDe ? "rgba(197, 154, 92, 0.14)" : "transparent"}
                    _hover={{ color: "#f4ead7", bg: "rgba(248, 236, 214, 0.06)" }}
                    borderRadius="sm"
                    onClick={() => changeLanguage('en')}
                    minW="40px"
                    h="34px"
                    px={3}
                >
                    EN
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    fontWeight={isDe ? "semibold" : "medium"}
                    color={isDe ? "#f4ead7" : "rgba(217, 204, 182, 0.58)"}
                    bg={isDe ? "rgba(197, 154, 92, 0.14)" : "transparent"}
                    _hover={{ color: "#f4ead7", bg: "rgba(248, 236, 214, 0.06)" }}
                    borderRadius="sm"
                    onClick={() => changeLanguage('de')}
                    minW="40px"
                    h="34px"
                    px={3}
                >
                    DE
                </Button>
            </Flex>
        );
    }

    return (
        <Text color="rgba(217, 204, 182, 0.58)" fontSize="sm" {...props}>
            {isDe ? 'DE' : 'EN'}
        </Text>
    );
};

export default LanguageSwitcher;

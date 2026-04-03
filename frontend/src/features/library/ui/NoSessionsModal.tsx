import {
    Button,
    Flex,
    Icon,
    Modal,
    ModalBody,
    ModalContent,
    ModalOverlay,
    Text,
} from '@chakra-ui/react';
import { FaBookReader } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/router/routes';
import { useThemeTokens } from '../../../shared/theme/useThemeTokens';

const NoSessionsModal = ({ bookId, isOpen }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const {
        textColor,
        overlayBg,
        modalBg,
        modalBorder,
        modalSubtleBg,
        modalMutedText,
        modalShadow,
        brandColor,
    } = useThemeTokens();

    return (
        <Modal isOpen={isOpen} onClose={() => navigate(ROUTES.MY_BOOKS)} isCentered>
            <ModalOverlay bg={overlayBg} backdropFilter="blur(10px)" />
            <ModalContent
                bg={modalBg}
                border="1px solid"
                borderColor={modalBorder}
                borderRadius="2xl"
                mx={4}
                boxShadow={modalShadow}
                overflow="hidden"
            >
                <ModalBody py={10} px={8} textAlign="center">
                    <Flex justify="center" mb={5}>
                        <Flex
                            w={16}
                            h={16}
                            borderRadius="full"
                            bg={modalSubtleBg}
                            align="center"
                            justify="center"
                            border="1px solid"
                            borderColor={modalBorder}
                            boxShadow="0 0 30px rgba(243, 199, 133, 0.16)"
                        >
                            <Icon as={FaBookReader} boxSize={7} color={brandColor} />
                        </Flex>
                    </Flex>
                    <Text fontSize="lg" fontWeight="700" color={textColor} mb={2}>
                        {t('bookStats.noSessions.title')}
                    </Text>
                    <Text fontSize="sm" color={modalMutedText} mb={6}>
                        {t('bookStats.noSessions.desc')}
                    </Text>
                    <Flex direction="column" gap={3} align="center">
                        <Button
                            size="lg"
                            borderRadius="xl"
                            px={10}
                            color="#fff8ef"
                            bg="linear-gradient(180deg, rgba(243, 199, 133, 0.96) 0%, rgba(167, 127, 92, 0.94) 100%)"
                            _hover={{
                                bg: 'linear-gradient(180deg, rgba(249, 209, 148, 0.98) 0%, rgba(182, 138, 101, 0.96) 100%)',
                                transform: 'translateY(-1px)',
                            }}
                            onClick={() => navigate(ROUTES.BOOK_SESSION(bookId))}
                        >
                            {t('bookStats.noSessions.button')}
                        </Button>
                        <Button
                            bg={modalSubtleBg}
                            color={modalMutedText}
                            size="sm"
                            border="1px solid"
                            borderColor={modalBorder}
                            borderRadius="xl"
                            onClick={() => navigate(ROUTES.MY_BOOKS)}
                            _hover={{ bg: 'rgba(255, 248, 239, 0.12)', color: textColor }}
                        >
                            {t('common.back')}
                        </Button>
                    </Flex>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default NoSessionsModal;

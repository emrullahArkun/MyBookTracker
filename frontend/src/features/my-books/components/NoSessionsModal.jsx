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
import { ROUTES } from '../../../app/routes';

const NoSessionsModal = ({ bookId, isOpen }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <Modal isOpen={isOpen} onClose={() => navigate(ROUTES.MY_BOOKS)} isCentered>
            <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
            <ModalContent bg="gray.900" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" mx={4}>
                <ModalBody py={10} px={8} textAlign="center">
                    <Flex justify="center" mb={5}>
                        <Flex w={16} h={16} borderRadius="full" bg="whiteAlpha.100" align="center" justify="center">
                            <Icon as={FaBookReader} boxSize={7} color="teal.200" />
                        </Flex>
                    </Flex>
                    <Text fontSize="lg" fontWeight="700" color="white" mb={2}>
                        {t('bookStats.noSessions.title')}
                    </Text>
                    <Text fontSize="sm" color="gray.400" mb={6}>
                        {t('bookStats.noSessions.desc')}
                    </Text>
                    <Flex direction="column" gap={3} align="center">
                        <Button
                            colorScheme="teal"
                            size="lg"
                            borderRadius="xl"
                            px={10}
                            onClick={() => navigate(ROUTES.BOOK_SESSION(bookId))}
                        >
                            {t('bookStats.noSessions.button')}
                        </Button>
                        <Button
                            variant="ghost"
                            color="gray.400"
                            size="sm"
                            onClick={() => navigate(ROUTES.MY_BOOKS)}
                            _hover={{ color: 'white' }}
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

import { Box, Button, Center, Icon, Text } from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/router/routes';

function LibraryEmptyState() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <Center flexDirection="column" py={16}>
            <Box
                textAlign="center"
                py={12}
                px={8}
                bg="linear-gradient(180deg, rgba(40, 30, 23, 0.96) 0%, rgba(24, 19, 16, 0.98) 100%)"
                borderRadius="2xl"
                border="1px dashed"
                borderColor="rgba(217, 188, 146, 0.24)"
                boxShadow="0 22px 40px rgba(8, 6, 4, 0.2)"
                maxW="440px"
            >
                <Icon as={FaSearch} color="#c59a5c" boxSize={10} mb={4} />
                <Text color="#f4ead7" fontSize="xl" fontFamily="heading" mb={2}>{t('myBooks.empty.line1')}</Text>
                <Text color="rgba(217, 204, 182, 0.74)" fontSize="sm" mb={5} lineHeight="1.8">{t('myBooks.empty.line2')}</Text>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(ROUTES.SEARCH)}
                >
                    {t('search.button')}
                </Button>
            </Box>
        </Center>
    );
}

export default LibraryEmptyState;

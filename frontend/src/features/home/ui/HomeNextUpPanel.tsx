import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Button,
    Flex,
    Heading,
    SimpleGrid,
    Text,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../app/router/routes';

interface QueuedBook {
    id: number;
    title: string;
    authorName: string;
    currentPage?: number | null;
    pageCount?: number | null;
}

interface HomeNextUpPanelProps {
    queuedBooks: QueuedBook[];
    panelStyles: Record<string, unknown>;
    insetStyles: Record<string, unknown>;
    textColor: string;
    subTextColor: string;
    mutedTextColor: string;
    borderColor: string;
}

const HomeNextUpPanel = ({
    queuedBooks,
    panelStyles,
    insetStyles,
    textColor,
    subTextColor,
    mutedTextColor,
    borderColor,
}: HomeNextUpPanelProps) => {
    const { t } = useTranslation();

    return (
        <Box {...panelStyles} p={5} h="100%">
            <Flex justify="space-between" align="flex-start" mb={4} gap={3}>
                <Box>
                    <Text fontSize="0.68rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.16em" fontWeight="700" mb={1}>
                        {t('home.nextUp')}
                    </Text>
                    <Text color={subTextColor} fontSize="sm">
                        {t('home.nextUpHint')}
                    </Text>
                </Box>
                <Button
                    as={RouterLink}
                    to={ROUTES.MY_BOOKS}
                    size="xs"
                    variant="ghost"
                    flexShrink={0}
                >
                    {t('home.viewLibrary')}
                </Button>
            </Flex>

            {queuedBooks.length === 0 ? (
                <Text color={subTextColor} fontSize="sm">{t('home.queueEmpty')}</Text>
            ) : (
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    {queuedBooks.map((book) => (
                        <Box
                            key={book.id}
                            as={RouterLink}
                            to={ROUTES.BOOK_STATS(book.id)}
                            {...insetStyles}
                            p={4}
                            _hover={{ bg: 'rgba(248, 236, 214, 0.06)', borderColor: borderColor, transform: 'translateY(-1px)' }}
                            transition="all 0.2s"
                        >
                            <Text fontSize="0.66rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.14em" mb={2}>
                                {t('home.continueReadingLabel')}
                            </Text>
                            <Heading size="md" color={textColor} mb={1} noOfLines={2}>
                                {book.title}
                            </Heading>
                            <Text color={subTextColor} fontSize="sm" mb={3} noOfLines={1}>
                                {book.authorName}
                            </Text>
                            <Text color={mutedTextColor} fontSize="xs">
                                {book.currentPage || 0}
                                {book.pageCount ? ` / ${book.pageCount} ${t('bookStats.pages')}` : ''}
                            </Text>
                        </Box>
                    ))}
                </SimpleGrid>
            )}
        </Box>
    );
};

export default HomeNextUpPanel;

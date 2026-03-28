import {
    Box,
    Badge,
    Heading,
    Text,
    Flex,
    Card,
    VStack,
    Progress
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import BookCover from '../../../shared/ui/BookCover';
import type { Book } from '../../../shared/types/books';

const MotionBox = motion(Box);

type SessionBookSidebarProps = {
    book: Book;
    textColor: string;
    subTextColor: string;
};

const SessionBookSidebar = ({ book, textColor, subTextColor }: SessionBookSidebarProps) => {
    const { t } = useTranslation();
    const pagesLeft = book.pageCount ? Math.max(book.pageCount - (book.currentPage || 0), 0) : null;
    const progressPercent = book.pageCount ? Math.round(((book.currentPage || 0) / book.pageCount) * 100) : 0;

    return (
        <MotionBox
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28 }}
        >
            <Card
                boxShadow="none"
                p={5}
                bg="transparent"
                border="none"
            >
                <VStack spacing={5} align="center" w="full">
                    <Badge alignSelf="flex-start" bg="rgba(197, 154, 92, 0.12)" color="#d9bc92">
                        {t('readingSession.currentBook')}
                    </Badge>

                    <Box
                        borderRadius="lg"
                        overflow="hidden"
                        boxShadow="0 18px 28px rgba(8, 6, 4, 0.26)"
                        maxW="180px"
                        w="100%"
                    >
                        <BookCover
                            book={book}
                            w="100%"
                            h="auto"
                            objectFit="cover"
                            borderRadius="lg"
                        />
                    </Box>

                    <Box textAlign="center" w="full">
                        <Heading size="md" mb={1} color={textColor} fontWeight="600" lineHeight="1.1" fontFamily="heading">
                            {book.title}
                        </Heading>
                        <Text fontSize="sm" color={subTextColor}>
                            {book.authorName}
                        </Text>
                    </Box>

                    <Box w="full" h="1px" bg="rgba(217, 188, 146, 0.1)" />

                    <Box w="full">
                        <Flex justify="space-between" mb={2} fontSize="0.68rem" fontWeight="700" color="rgba(217, 204, 182, 0.56)" textTransform="uppercase" letterSpacing="0.14em">
                            <Text>{t('readingSession.metrics.progress')}</Text>
                            <Text>{book.pageCount ? `${progressPercent}%` : '—'}</Text>
                        </Flex>
                        <Progress
                            value={book.pageCount ? ((book.currentPage || 0) / book.pageCount) * 100 : 0}
                            size="xs"
                            borderRadius="full"
                            bg="rgba(248, 236, 214, 0.08)"
                        />
                    </Box>

                    <Flex w="full" gap={3}>
                        <Box flex="1" bg="rgba(248, 236, 214, 0.05)" borderRadius="xl" p={3} border="1px solid" borderColor="rgba(217, 188, 146, 0.1)">
                            <Text fontSize="0.66rem" color="rgba(217, 204, 182, 0.56)" textTransform="uppercase" letterSpacing="0.14em" mb={1}>
                                {t('bookStats.currentPage')}
                            </Text>
                            <Text color={textColor} fontWeight="700" fontSize="2xl" fontFamily="heading">
                                {book.currentPage || 0}
                            </Text>
                        </Box>
                        <Box flex="1" bg="rgba(248, 236, 214, 0.05)" borderRadius="xl" p={3} border="1px solid" borderColor="rgba(217, 188, 146, 0.1)">
                            <Text fontSize="0.66rem" color="rgba(217, 204, 182, 0.56)" textTransform="uppercase" letterSpacing="0.14em" mb={1}>
                                {t('readingSession.metrics.pagesLeft')}
                            </Text>
                            <Text color={textColor} fontWeight="700" fontSize="2xl" fontFamily="heading">
                                {pagesLeft ?? '—'}
                            </Text>
                        </Box>
                    </Flex>

                    <Box w="full" bg="rgba(248, 236, 214, 0.05)" borderRadius="xl" p={4} border="1px solid" borderColor="rgba(217, 188, 146, 0.1)">
                        <Text fontSize="sm" color={subTextColor} lineHeight="1.7">
                            {t('readingSession.sidebarHint')}
                        </Text>
                    </Box>
                </VStack>
            </Card>
        </MotionBox>
    );
};

export default SessionBookSidebar;

import {
    Box,
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
    cardBg: string;
    textColor: string;
    subTextColor: string;
};

const SessionBookSidebar = ({ book, cardBg, textColor, subTextColor }: SessionBookSidebarProps) => {
    const { t } = useTranslation();

    return (
        <MotionBox
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card
                bg={cardBg}
                borderRadius="2xl"
                border="1px solid"
                borderColor="whiteAlpha.100"
                boxShadow="none"
                p={5}
            >
                <VStack spacing={5} align="center" w="full">
                    <Box
                        borderRadius="xl"
                        overflow="hidden"
                        boxShadow="lg"
                        maxW="180px"
                        w="100%"
                    >
                        <BookCover
                            book={book}
                            w="100%"
                            h="auto"
                            objectFit="cover"
                            borderRadius="xl"
                        />
                    </Box>

                    <Box textAlign="center" w="full">
                        <Heading size="sm" mb={1} color={textColor} fontWeight="700" lineHeight="1.3">
                            {book.title}
                        </Heading>
                        <Text fontSize="xs" color={subTextColor}>
                            {book.authorName}
                        </Text>
                    </Box>

                    <Box w="full" h="1px" bg="whiteAlpha.100" />

                    <Box w="full">
                        <Flex justify="space-between" mb={2} fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase" letterSpacing="wider">
                            <Text>{t('bookStats.currentPage')}</Text>
                            <Text>{book.currentPage || 0}</Text>
                        </Flex>
                        <Progress
                            value={book.pageCount ? ((book.currentPage || 0) / book.pageCount) * 100 : 0}
                            size="xs"
                            colorScheme="teal"
                            borderRadius="full"
                            bg="whiteAlpha.100"
                        />
                    </Box>
                </VStack>
            </Card>
        </MotionBox>
    );
};

export default SessionBookSidebar;

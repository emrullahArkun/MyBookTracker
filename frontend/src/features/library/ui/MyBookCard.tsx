import { useTranslation } from 'react-i18next';
import {
    Box,
    Badge,
    Progress,
    Checkbox,
    Center,
} from '@chakra-ui/react';
import BookCover from '../../../shared/ui/BookCover';
import MyBookCardMeta from './MyBookCardMeta';
import MyBookCardOverlay from './MyBookCardOverlay';
import type { Book } from '../../../shared/types/books';

type MyBookCardProps = {
    book: Book;
    isSelected: boolean;
    onToggleSelect: (id: number) => void;
    onUpdateProgress?: (id: number, currentPage: number) => void;
};

const MyBookCard = ({
    book,
    isSelected,
    onToggleSelect,
}: MyBookCardProps) => {
    const { t } = useTranslation();
    const info = (book as Book & { volumeInfo?: Book }).volumeInfo || book;
    const authors = (info as Book & { authors?: string[] | string | null }).authors || info.authorName;
    const authorText = Array.isArray(authors) ? authors[0] : authors;
    const progressPercent = (book.pageCount || 0) > 0 ? (((book.currentPage || 0) / (book.pageCount || 1)) * 100) : 0;

    return (
        <Box
            position="relative"
            transition="transform 0.2s"
            _hover={{ transform: 'translateY(-2px)' }}
            w="100%"
            role="group"
            tabIndex={0}
            p={2}
            borderRadius="20px"
            bg="linear-gradient(180deg, rgba(40, 30, 23, 0.92) 0%, rgba(24, 19, 16, 0.98) 100%)"
            border="1px solid"
            borderColor="rgba(217, 188, 146, 0.12)"
            boxShadow="0 16px 28px rgba(8, 6, 4, 0.18)"
        >
            <Box
                position="absolute"
                top="12px"
                right="12px"
                zIndex="20"
                opacity={isSelected ? 1 : 0}
                _groupHover={{ opacity: 1 }}
                transition="opacity 0.15s"
            >
                <Checkbox
                    isChecked={isSelected}
                    onChange={() => onToggleSelect(book.id)}
                    size="lg"
                    colorScheme="orange"
                    bg="rgba(244, 234, 215, 0.92)"
                    rounded="sm"
                    aria-label="Select book"
                />
            </Box>

            <Box
                h="280px"
                position="relative"
                overflow="hidden"
                borderRadius="12px"
                boxShadow="0 10px 22px rgba(8, 6, 4, 0.28)"
            >
                <BookCover
                    book={book}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                    borderRadius="12px"
                />

                {book.completed && (
                    <Center
                        position="absolute"
                        top="0"
                        left="0"
                        w="100%"
                        h="100%"
                        bg="rgba(20, 15, 12, 0.54)"
                        borderRadius="12px"
                        alignItems="flex-end"
                        pb="16px"
                    >
                        <Badge
                            bg="rgba(244, 234, 215, 0.9)"
                            color="#1d1612"
                            fontSize="0.7rem"
                            px="3"
                            py="1"
                            borderRadius="sm"
                        >
                            {t('bookCard.finished')}
                        </Badge>
                    </Center>
                )}

                {(book.pageCount || 0) > 0 && !book.completed && (
                    <Box position="absolute" bottom="0" left="0" right="0">
                        <Progress
                            value={progressPercent}
                            size="xs"
                            bg="rgba(20, 15, 12, 0.44)"
                            borderRadius="0"
                        />
                    </Box>
                )}

                <MyBookCardOverlay bookId={book.id} />
            </Box>

            <MyBookCardMeta
                title={info.title}
                authorText={authorText}
                currentPage={book.currentPage}
                pageCount={book.pageCount}
            />
        </Box>
    );
};

export default MyBookCard;

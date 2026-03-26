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
            _hover={{ transform: 'translateY(-4px)' }}
            w="100%"
            role="group"
            tabIndex={0}
        >
            <Box
                position="absolute"
                top="6px"
                right="6px"
                zIndex="20"
                opacity={isSelected ? 1 : 0}
                _groupHover={{ opacity: 1 }}
                transition="opacity 0.15s"
            >
                <Checkbox
                    isChecked={isSelected}
                    onChange={() => onToggleSelect(book.id)}
                    size="lg"
                    colorScheme="blue"
                    bg="white"
                    rounded="md"
                    aria-label="Select book"
                />
            </Box>

            <Box
                h="280px"
                position="relative"
                overflow="hidden"
                borderRadius="10px"
                boxShadow="0 2px 8px rgba(0,0,0,0.3)"
            >
                <BookCover
                    book={book}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                    borderRadius="10px"
                />

                {book.completed && (
                    <Center
                        position="absolute"
                        top="0"
                        left="0"
                        w="100%"
                        h="100%"
                        bg="rgba(0, 0, 0, 0.4)"
                        borderRadius="10px"
                        alignItems="flex-end"
                        pb="16px"
                    >
                        <Badge
                            bg="white"
                            color="black"
                            fontSize="0.8rem"
                            px="3"
                            py="1"
                            borderRadius="md"
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
                            colorScheme="green"
                            bg="blackAlpha.500"
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

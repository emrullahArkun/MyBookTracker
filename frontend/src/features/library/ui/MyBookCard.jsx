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

const MyBookCard = ({
    book,
    isSelected,
    onToggleSelect
}) => {
    const { t } = useTranslation();
    const info = book.volumeInfo || book;
    const authors = info.authors || info.authorName;
    const authorText = Array.isArray(authors) ? authors[0] : authors;
    const progressPercent = book.pageCount > 0 ? ((book.currentPage || 0) / book.pageCount) * 100 : 0;

    return (
        <Box
            position="relative"
            transition="transform 0.2s"
            _hover={{ transform: 'translateY(-4px)' }}
            w="100%"
            role="group"
            tabIndex={0}
        >
            {/* Checkbox - visible on hover or when selected */}
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

            {/* Cover */}
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

                {/* Finished Badge */}
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

                {/* Progress bar integrated into cover bottom */}
                {book.pageCount > 0 && !book.completed && (
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

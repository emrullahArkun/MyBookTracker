import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaChartBar } from 'react-icons/fa';
import {
    Box,
    Text,
    Badge,
    Progress,
    Checkbox,
    VStack,
    Center,
    Flex
} from '@chakra-ui/react';
import BookCover from '../../../ui/BookCover';
import UpdateProgressModal from './UpdateProgressModal';


const MyBookCard = ({
    book,
    isSelected,
    onUpdateProgress,
    onToggleSelect
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleUpdate = (id, page) => {
        onUpdateProgress(id, page);
        setIsModalOpen(false);
    };

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
                    fallbackIconSize={24}
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

                {/* Hover Overlay */}
                <Flex
                    position="absolute"
                    inset="0"
                    bg="blackAlpha.600"
                    opacity="0"
                    _groupHover={{ opacity: 1 }}
                    transition="all 0.25s ease"
                    direction="column"
                    justify="space-between"
                    align="center"
                    zIndex="10"
                    borderRadius="10px"
                >
                    {/* Play button */}
                    <Center
                        flex="1"
                        w="100%"
                        cursor="pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/books/${book.id}/session`);
                        }}
                        _hover={{}}
                    >
                        <VStack spacing={1}>
                            <Box
                                color="white"
                                p={3}
                                borderRadius="full"
                                bg="whiteAlpha.200"
                                transition="all 0.2s"
                                _hover={{ bg: "whiteAlpha.400", transform: "scale(1.1)" }}
                            >
                                <FaPlay size="20px" />
                            </Box>
                            <Text color="whiteAlpha.800" fontSize="xs" fontWeight="500">
                                {t('readingSession.start')}
                            </Text>
                        </VStack>
                    </Center>

                    {/* Stats button */}
                    <Box
                        as="button"
                        w="100%"
                        py={2}
                        bg="whiteAlpha.100"
                        color="whiteAlpha.800"
                        fontSize="xs"
                        fontWeight="500"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap={2}
                        cursor="pointer"
                        transition="all 0.15s"
                        _hover={{ bg: "whiteAlpha.200", color: "white" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/books/${book.id}/stats`);
                        }}
                        borderBottomRadius="10px"
                    >
                        <FaChartBar size="12px" />
                        {t('navbar.stats')}
                    </Box>
                </Flex>
            </Box>

            {/* Book info below cover */}
            <VStack align="start" spacing={0} mt={2} px={1}>
                <Text
                    fontSize="sm"
                    fontWeight="600"
                    color="white"
                    noOfLines={1}
                    lineHeight="1.3"
                >
                    {book.title}
                </Text>
                {authorText && (
                    <Text fontSize="xs" color="gray.500" noOfLines={1}>
                        {authorText}
                    </Text>
                )}
                {book.pageCount > 0 && (
                    <Text fontSize="xs" color="gray.400" mt={0.5}>
                        {book.currentPage || 0} / {book.pageCount} {t('bookStats.pages')}
                    </Text>
                )}
            </VStack>

            {isModalOpen && (
                <UpdateProgressModal
                    book={book}
                    onClose={() => setIsModalOpen(false)}
                    onUpdate={handleUpdate}
                />
            )}
        </Box>
    );
};

export default MyBookCard;

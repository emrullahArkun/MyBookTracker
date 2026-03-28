import { Flex, IconButton, Text } from '@chakra-ui/react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

function LibraryPagination({
    page,
    totalPages,
    onPreviousPage,
    onNextPage,
}) {
    const { t } = useTranslation();
    const totalPageCount = Math.max(totalPages, 1);
    const currentPage = Math.min(page + 1, totalPageCount);

    return (
        <Flex justify="center" align="center" gap={4} minW="140px">
            <IconButton
                icon={<FaChevronLeft />}
                onClick={onPreviousPage}
                isDisabled={page === 0 || totalPages <= 1}
                color="rgba(244, 234, 215, 0.86)"
                variant="ghost"
                fontSize="lg"
                aria-label={t('common.previousPage')}
                _hover={{ bg: 'rgba(248, 236, 214, 0.06)' }}
            />
            <Text color="rgba(217, 204, 182, 0.58)" fontSize="sm" textTransform="uppercase" letterSpacing="0.12em">
                {currentPage} / {totalPageCount}
            </Text>
            <IconButton
                icon={<FaChevronRight />}
                onClick={onNextPage}
                isDisabled={page >= totalPages - 1 || totalPages <= 1}
                color="rgba(244, 234, 215, 0.86)"
                variant="ghost"
                fontSize="lg"
                aria-label={t('common.nextPage')}
                _hover={{ bg: 'rgba(248, 236, 214, 0.06)' }}
            />
        </Flex>
    );
}

export default LibraryPagination;

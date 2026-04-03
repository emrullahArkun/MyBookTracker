import { Button, Flex } from '@chakra-ui/react';
import { FaTrash, FaTrashAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

function LibraryActionsBar({
    selectedCount,
    onDeleteSelected,
    onDeleteAll,
}) {
    const { t } = useTranslation();

    return (
        <Flex justify="flex-end" align="center" mb={6} wrap="wrap" gap={3}>
            {selectedCount > 0 && (
                <Button
                    size="sm"
                    leftIcon={<FaTrash />}
                    onClick={onDeleteSelected}
                    bg="rgba(207, 109, 88, 0.12)"
                    color="#f2b09e"
                    border="1px solid"
                    borderColor="rgba(207, 109, 88, 0.3)"
                    _hover={{ bg: 'rgba(207, 109, 88, 0.18)', borderColor: 'rgba(207, 109, 88, 0.42)' }}
                    _active={{ bg: 'rgba(207, 109, 88, 0.2)' }}
                >
                    {t('myBooks.deleteSelectedCount', { count: selectedCount })}
                </Button>
            )}
            <Button
                size="sm"
                leftIcon={<FaTrashAlt />}
                onClick={onDeleteAll}
                variant="outline"
                _hover={{ color: '#f2b09e', borderColor: 'rgba(207, 109, 88, 0.3)', bg: 'rgba(207, 109, 88, 0.05)' }}
                _active={{ bg: 'rgba(248, 236, 214, 0.08)' }}
            >
                {t('myBooks.deleteAll')}
            </Button>
        </Flex>
    );
}

export default LibraryActionsBar;

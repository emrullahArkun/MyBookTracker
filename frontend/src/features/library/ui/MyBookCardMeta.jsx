import { Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

function MyBookCardMeta({ title, authorText, currentPage, pageCount }) {
    const { t } = useTranslation();

    return (
        <VStack align="start" spacing={0} mt={3} px={1}>
            <Text
                fontSize="lg"
                fontWeight="600"
                color="#f4ead7"
                noOfLines={1}
                lineHeight="1.3"
                fontFamily="heading"
                letterSpacing="-0.02em"
            >
                {title}
            </Text>
            {authorText && (
                <Text fontSize="sm" color="rgba(217, 204, 182, 0.68)" noOfLines={1}>
                    {authorText}
                </Text>
            )}
            {pageCount > 0 && (
                <Text fontSize="xs" color="rgba(217, 204, 182, 0.54)" mt={1} textTransform="uppercase" letterSpacing="0.12em">
                    {t('bookStats.pageProgress', {
                        current: currentPage ?? 0,
                        total: pageCount,
                    })}
                </Text>
            )}
        </VStack>
    );
}

export default MyBookCardMeta;

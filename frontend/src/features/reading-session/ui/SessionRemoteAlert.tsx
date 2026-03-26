import { Alert, AlertIcon, Box, Button, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

type SessionRemoteAlertProps = {
    takeControl: () => void;
};

function SessionRemoteAlert({ takeControl }: SessionRemoteAlertProps) {
    const { t } = useTranslation();

    return (
        <Alert status="warning" borderRadius="md" variant="solid" bg="orange.500">
            <AlertIcon />
            <Box flex="1">
                <Text fontWeight="bold">{t('readingSession.remote.title')}</Text>
                <Text fontSize="sm">{t('readingSession.remote.desc')}</Text>
            </Box>
            <Button colorScheme="whiteAlpha" size="sm" onClick={takeControl}>
                {t('readingSession.remote.takeControl')}
            </Button>
        </Alert>
    );
}

export default SessionRemoteAlert;

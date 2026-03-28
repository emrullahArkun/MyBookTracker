import { Alert, AlertIcon, Box, Button, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

type SessionRemoteAlertProps = {
    takeControl: () => void;
};

function SessionRemoteAlert({ takeControl }: SessionRemoteAlertProps) {
    const { t } = useTranslation();

    return (
        <Alert status="warning" borderRadius="lg" variant="subtle" bg="rgba(197, 154, 92, 0.12)" border="1px solid" borderColor="rgba(197, 154, 92, 0.24)">
            <AlertIcon />
            <Box flex="1">
                <Text fontWeight="bold" color="#f4ead7">{t('readingSession.remote.title')}</Text>
                <Text fontSize="sm" color="rgba(217, 204, 182, 0.74)">{t('readingSession.remote.desc')}</Text>
            </Box>
            <Button size="sm" onClick={takeControl}>
                {t('readingSession.remote.takeControl')}
            </Button>
        </Alert>
    );
}

export default SessionRemoteAlert;

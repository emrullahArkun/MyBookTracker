import type { ReactElement } from 'react';
import { Button, Flex, Text } from '@chakra-ui/react';

type PageErrorStateProps = {
    title: string;
    onRetry?: () => void;
    retryLabel?: string;
};

const PageErrorState = ({ title, onRetry, retryLabel }: PageErrorStateProps): ReactElement => (
    <Flex direction="column" align="center" justify="center" h="calc(100vh - 80px)" gap={4}>
        <Text color="gray.400">{title}</Text>
        {onRetry && (
            <Button onClick={onRetry} colorScheme="teal" variant="solid">
                {retryLabel}
            </Button>
        )}
    </Flex>
);

export default PageErrorState;

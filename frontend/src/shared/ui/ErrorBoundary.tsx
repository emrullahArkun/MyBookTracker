import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { withTranslation, type WithTranslation } from 'react-i18next';

type ErrorBoundaryProps = WithTranslation & {
    children: ReactNode;
};

type ErrorBoundaryState = {
    hasError: boolean;
    error: Error | null;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    // TODO: Add componentDidCatch to report errors to an external logging service (e.g. Sentry)
    componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        const { t } = this.props;

        if (this.state.hasError) {
            return (
                <Box minH="100dvh" display="flex" alignItems="center" justifyContent="center" bg="transparent">
                    <VStack spacing={4} textAlign="center" p={8}>
                        <Heading size="lg" color="white">
                            {t('error.title')}
                        </Heading>
                        <Text color="gray.300">{this.state.error?.message}</Text>
                        <Button colorScheme="teal" onClick={this.handleReset}>
                            {t('error.retry')}
                        </Button>
                    </VStack>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default withTranslation()(ErrorBoundary);

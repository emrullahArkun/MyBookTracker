import { Component } from 'react';
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import i18n from '../../i18n';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    // TODO: Add componentDidCatch to report errors to an external logging service (e.g. Sentry)
    // componentDidCatch(error, errorInfo) {
    //     Sentry.captureException(error, { extra: errorInfo });
    // }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box minH="100dvh" display="flex" alignItems="center" justifyContent="center" bg="transparent">
                    <VStack spacing={4} textAlign="center" p={8}>
                        <Heading size="lg" color="white">
                            {i18n.t('error.title')}
                        </Heading>
                        <Text color="gray.300">{this.state.error?.message}</Text>
                        <Button colorScheme="teal" onClick={this.handleReset}>
                            {i18n.t('error.retry')}
                        </Button>
                    </VStack>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

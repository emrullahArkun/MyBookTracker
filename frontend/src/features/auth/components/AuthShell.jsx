import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import LanguageSwitcher from '../../../shared/components/LanguageSwitcher';

const MotionBox = motion.create(Box);

function AuthShell({ children }) {
    return (
        <Flex
            minH="100dvh"
            align="flex-start"
            justify="center"
            bgGradient="linear(to-br, teal.50, gray.100)"
            overflowY="auto"
            pt={{ base: "15vh", md: "12vh" }}
            pb={8}
        >
            <LanguageSwitcher variant="auth" />

            <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                w="full"
                maxW="md"
                bg="white"
                p={8}
                borderRadius="xl"
                boxShadow="2xl"
                border="1px"
                borderColor="gray.100"
            >
                {children}
            </MotionBox>
        </Flex>
    );
}

export default AuthShell;

import { Box, Text } from '@chakra-ui/react';

const KpiBox = ({ value, label, valueColor, borderColor = 'whiteAlpha.100', children }) => (
    <Box
        bg="whiteAlpha.100"
        borderRadius="xl"
        py={4}
        border="1px solid"
        borderColor={borderColor}
        textAlign="center"
    >
        {children || (
            <Text fontSize="2xl" fontWeight="bold" color={valueColor}>{value}</Text>
        )}
        <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="bold">
            {label}
        </Text>
    </Box>
);

export default KpiBox;

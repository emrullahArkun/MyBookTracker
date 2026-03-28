import type { ReactNode } from 'react';
import { Box, Text } from '@chakra-ui/react';

type KpiBoxProps = {
    value?: string | number;
    label: string;
    valueColor?: string;
    borderColor?: string;
    children?: ReactNode;
};

const KpiBox = ({ value, label, valueColor, borderColor = 'whiteAlpha.100', children }: KpiBoxProps) => (
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

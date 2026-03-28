import type { ReactNode } from 'react';
import {
    Card,
    CardBody,
    Flex,
    Icon,
    Text,
    Stat,
    StatNumber,
    StatHelpText,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import type { IconType } from 'react-icons';

const MotionCard = motion(Card);

type StatsCardProps = {
    icon: IconType;
    label: string;
    value: ReactNode;
    subLabel?: string;
    color?: string;
    delay?: number;
    bg?: string;
    textColor?: string;
    compact?: boolean;
};

const StatsCard = ({ icon, label, value, subLabel, color, delay, bg, textColor, compact = false }: StatsCardProps) => {
    return (
        <MotionCard
            bg={bg}
            borderRadius="xl"
            boxShadow="none"
            border="1px solid"
            borderColor="rgba(217, 188, 146, 0.14)"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay }}
            overflow="hidden"
        >
            <CardBody p={compact ? 3 : 5}>
                <Flex align="center" mb={compact ? 2 : 4}>
                    <Flex
                        justify="center"
                        align="center"
                        w={compact ? 7 : 9}
                        h={compact ? 7 : 9}
                        borderRadius="md"
                        bg="rgba(197, 154, 92, 0.12)"
                        color={color}
                        mr={compact ? 2 : 3}
                        border="1px solid"
                        borderColor="rgba(217, 188, 146, 0.14)"
                    >
                        <Icon as={icon} boxSize={compact ? 3 : 4} />
                    </Flex>
                    <Text fontSize="0.68rem" fontWeight="700" color="rgba(217, 204, 182, 0.56)" textTransform="uppercase" letterSpacing="0.14em">
                        {label}
                    </Text>
                </Flex>
                <Stat>
                    <StatNumber fontSize={compact ? 'xl' : '3xl'} fontWeight="700" color={textColor} lineHeight="1" fontFamily="heading" letterSpacing="-0.03em">
                        {value}
                    </StatNumber>
                    <StatHelpText m={0} mt={compact ? 1 : 1.5} fontSize="xs" color="rgba(217, 204, 182, 0.64)" fontWeight="medium" lineHeight="1.6">
                        {subLabel}
                    </StatHelpText>
                </Stat>
            </CardBody>
        </MotionCard>
    );
};

export default StatsCard;

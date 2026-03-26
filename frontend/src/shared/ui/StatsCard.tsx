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
};

const StatsCard = ({ icon, label, value, subLabel, color, delay, bg, textColor }: StatsCardProps) => {
    return (
        <MotionCard
            bg={bg}
            borderRadius="2xl"
            boxShadow="none"
            border="1px solid"
            borderColor="whiteAlpha.100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            overflow="hidden"
        >
            <CardBody p={5}>
                <Flex align="center" mb={3}>
                    <Flex
                        justify="center"
                        align="center"
                        w={8}
                        h={8}
                        borderRadius="lg"
                        bg="whiteAlpha.100"
                        color={color}
                        mr={3}
                    >
                        <Icon as={icon} boxSize={4} />
                    </Flex>
                    <Text fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase" letterSpacing="wide">
                        {label}
                    </Text>
                </Flex>
                <Stat>
                    <StatNumber fontSize="3xl" fontWeight="700" color={textColor} lineHeight="1.1">
                        {value}
                    </StatNumber>
                    <StatHelpText m={0} mt={1} fontSize="xs" color="gray.500" fontWeight="medium">
                        {subLabel}
                    </StatHelpText>
                </Stat>
            </CardBody>
        </MotionCard>
    );
};

export default StatsCard;

import { useEffect, useState } from 'react';
import { Box, SimpleGrid, Card, Text, Flex, Icon, Skeleton, Badge } from '@chakra-ui/react';
import {
    FaBookOpen, FaBookReader, FaBuilding, FaScroll,
    FaRunning, FaSun, FaMoon, FaCalendarCheck,
    FaCalendarAlt, FaBolt
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import { useThemeTokens } from '../shared/hooks/useThemeTokens';
import statsApi from '../features/stats/api/statsApi';

const ACHIEVEMENT_META = {
    FIRST_SESSION: { icon: FaBookOpen, color: 'teal.200' },
    BOOKWORM: { icon: FaBookReader, color: 'green.300' },
    LIBRARY_BUILDER: { icon: FaBuilding, color: 'blue.200' },
    PAGE_TURNER: { icon: FaScroll, color: 'orange.200' },
    MARATHON: { icon: FaRunning, color: 'red.300' },
    EARLY_BIRD: { icon: FaSun, color: 'yellow.300' },
    NIGHT_OWL: { icon: FaMoon, color: 'purple.300' },
    WEEK_STREAK: { icon: FaCalendarCheck, color: 'teal.200' },
    MONTH_STREAK: { icon: FaCalendarAlt, color: 'blue.300' },
    SPEED_READER: { icon: FaBolt, color: 'yellow.200' },
};

const AchievementCard = ({ achievement, cardBg, textColor }) => {
    const { t } = useTranslation();
    const meta = ACHIEVEMENT_META[achievement.id] || { icon: FaBookOpen, color: 'gray.400' };
    const unlocked = achievement.unlocked;

    return (
        <Card
            bg={cardBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={unlocked ? 'whiteAlpha.300' : 'whiteAlpha.100'}
            boxShadow="none"
            p={5}
            opacity={unlocked ? 1 : 0.55}
        >
            <Flex align="center" gap={4}>
                <Flex
                    justify="center"
                    align="center"
                    w={12}
                    h={12}
                    borderRadius="xl"
                    bg={unlocked ? 'whiteAlpha.200' : 'whiteAlpha.100'}
                    color={unlocked ? meta.color : 'gray.600'}
                    flexShrink={0}
                >
                    <Icon as={meta.icon} boxSize={5} />
                </Flex>
                <Box flex={1} minW={0}>
                    <Flex align="center" gap={2} mb={0.5}>
                        <Text fontSize="sm" fontWeight="700" color={unlocked ? textColor : 'gray.400'} noOfLines={1}>
                            {t(`stats.achievements.${achievement.id}.name`)}
                        </Text>
                        {unlocked && (
                            <Badge colorScheme="teal" variant="subtle" fontSize="9px" borderRadius="full">
                                {t('stats.achievements.unlocked')}
                            </Badge>
                        )}
                    </Flex>
                    <Text fontSize="xs" color="gray.300" noOfLines={1} textAlign="left">
                        {t(`stats.achievements.${achievement.id}.desc`)}
                    </Text>
                    {achievement.unlockedDetail && (
                        <Text fontSize="xs" color={unlocked ? 'teal.200' : 'gray.400'} mt={0.5}>
                            {achievement.unlockedDetail}
                        </Text>
                    )}
                </Box>
            </Flex>
        </Card>
    );
};

const AchievementsPage = () => {
    const { t } = useTranslation();
    const { cardBg, textColor } = useThemeTokens();

    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        statsApi.getAchievements()
            .then(setAchievements)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Box px={{ base: 4, md: 10 }} py={8} maxW="900px" mx="auto">
                <Flex align="baseline" gap={3} mb={6}>
                    <Skeleton h={3} w="80px" startColor="whiteAlpha.100" endColor="whiteAlpha.200" borderRadius="md" />
                </Flex>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} bg={cardBg} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" boxShadow="none" p={5}>
                            <Flex align="center" gap={4}>
                                <Skeleton w={12} h={12} borderRadius="xl" startColor="whiteAlpha.100" endColor="whiteAlpha.200" />
                                <Box flex={1}>
                                    <Skeleton h={4} w="60%" mb={2} startColor="whiteAlpha.100" endColor="whiteAlpha.200" borderRadius="md" />
                                    <Skeleton h={3} w="80%" startColor="whiteAlpha.100" endColor="whiteAlpha.200" borderRadius="md" />
                                </Box>
                            </Flex>
                        </Card>
                    ))}
                </SimpleGrid>
            </Box>
        );
    }

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <Box px={{ base: 4, md: 10 }} py={8} maxW="900px" mx="auto">
            <Flex align="baseline" gap={3} mb={6}>
                <Text fontSize="xs" color="gray.400" fontWeight="600" textTransform="uppercase" letterSpacing="wider">
                    {t('stats.achievements.title')}
                </Text>
                <Text fontSize="xs" color="teal.200">
                    {unlockedCount}/{achievements.length}
                </Text>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {achievements.map((a) => (
                    <AchievementCard
                        key={a.id}
                        achievement={a}
                        cardBg={cardBg}
                        textColor={textColor}
                    />
                ))}
            </SimpleGrid>
        </Box>
    );
};

export default AchievementsPage;

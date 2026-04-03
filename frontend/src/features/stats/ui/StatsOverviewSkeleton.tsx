import { Box, SimpleGrid, Grid, GridItem, Card, Flex, Skeleton } from '@chakra-ui/react';
import { useThemeTokens } from '../../../shared/theme/useThemeTokens';

const skeletonColors = { startColor: 'rgba(248, 236, 214, 0.05)', endColor: 'rgba(248, 236, 214, 0.1)' };

const StatsOverviewSkeleton = () => {
    const { cardBg, borderColor, panelShadow } = useThemeTokens();
    const panelStyles = { bg: cardBg, borderRadius: 'xl' as const, border: '1px solid', borderColor, boxShadow: panelShadow };

    return (
        <Box px={{ base: 4, md: 8 }} py={8} maxW="1180px" mx="auto">
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                {[0, 1, 2, 3].map((i) => (
                    <Card key={i} {...panelStyles} p={5}>
                        <Flex align="center" mb={3} gap={3}>
                            <Skeleton w={8} h={8} borderRadius="md" {...skeletonColors} />
                            <Skeleton h={3} w="60%" {...skeletonColors} borderRadius="sm" />
                        </Flex>
                        <Skeleton h={8} w="50%" mb={2} {...skeletonColors} borderRadius="sm" />
                        <Skeleton h={3} w="70%" {...skeletonColors} borderRadius="sm" />
                    </Card>
                ))}
            </SimpleGrid>
            <Card {...panelStyles} p={5} mb={6}>
                <Skeleton h={3} w="120px" mb={4} {...skeletonColors} borderRadius="sm" />
                <Skeleton h="130px" w="100%" {...skeletonColors} borderRadius="md" />
            </Card>
            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
                {[0, 1].map((i) => (
                    <GridItem key={i}>
                        <Card {...panelStyles} p={5}>
                            <Skeleton h={3} w="120px" mb={4} {...skeletonColors} borderRadius="sm" />
                            <Skeleton h="160px" w="100%" {...skeletonColors} borderRadius="md" />
                        </Card>
                    </GridItem>
                ))}
            </Grid>
        </Box>
    );
};

export default StatsOverviewSkeleton;

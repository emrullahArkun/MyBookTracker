import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Button,
    Flex,
    Icon,
    Stack,
    Text,
} from '@chakra-ui/react';
import { FaBullseye, FaForward } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../app/router/routes';
import GoalCard from '../../../shared/ui/GoalCard';

interface ActiveGoalBook {
    id: number;
    title: string;
    readingGoalProgress?: number | null;
    readingGoalPages?: number | null;
    readingGoalType?: string | null;
    author?: string;
}

interface HomeGoalsPanelProps {
    activeGoalBooks: ActiveGoalBook[];
    panelStyles: Record<string, unknown>;
    insetStyles: Record<string, unknown>;
    brandColor: string;
    subTextColor: string;
    mutedTextColor: string;
}

const HomeGoalsPanel = ({
    activeGoalBooks,
    panelStyles,
    insetStyles,
    brandColor,
    subTextColor,
    mutedTextColor,
}: HomeGoalsPanelProps) => {
    const { t } = useTranslation();

    return (
        <Box {...panelStyles} p={5} h="100%">
            <Flex justify="space-between" align="flex-start" mb={4} gap={3}>
                <Box>
                    <Text fontSize="0.68rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.16em" fontWeight="700" mb={1}>
                        {t('home.activeGoals')}
                    </Text>
                    <Text color={subTextColor} fontSize="sm">
                        {t('home.goalSectionHint')}
                    </Text>
                </Box>
                <Button
                    as={RouterLink}
                    to={ROUTES.GOALS}
                    size="xs"
                    variant="ghost"
                    rightIcon={<FaForward />}
                    flexShrink={0}
                >
                    {t('home.viewGoals')}
                </Button>
            </Flex>

            {activeGoalBooks.length === 0 ? (
                <Box
                    textAlign="center"
                    py={10}
                    {...insetStyles}
                    borderRadius="xl"
                    borderStyle="dashed"
                >
                    <Icon as={FaBullseye} color={brandColor} boxSize={8} mb={3} />
                    <Text color={subTextColor} fontSize="sm">{t('home.noGoals')}</Text>
                </Box>
            ) : (
                <Stack spacing={4}>
                    {activeGoalBooks.map((book, index) => (
                        <GoalCard key={book.id} book={book} index={index} linkTo={ROUTES.BOOK_STATS(book.id)} />
                    ))}
                </Stack>
            )}
        </Box>
    );
};

export default HomeGoalsPanel;

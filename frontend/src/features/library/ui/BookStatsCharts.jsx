import {
    Box,
    Card,
    Flex,
    Heading,
    Text,
    Icon,
    Button
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { FaChartLine } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ReadingCalendar from './ReadingCalendar';

const MotionCard = motion(Card);

const BookStatsCharts = ({
    stats,
    sessions,
    bookId,
    cardBg,
    textColor,
    subTextColor,
    mutedTextColor,
    borderColor,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <MotionCard
            bg={cardBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="0 22px 40px rgba(8, 6, 4, 0.2)"
            p={5}
            flex="1"
            minH="0"
            display="flex"
            flexDirection="column"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.12 }}
        >
            <Flex justify="space-between" align="center" mb={3} flexShrink={0}>
                <Box>
                    <Text fontSize="0.68rem" fontWeight="700" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.14em" mb={2}>
                        {t('bookStats.chart.kicker')}
                    </Text>
                    <Heading size="md" fontWeight="600" color={textColor} mb={0.5} fontFamily="heading">
                        {t('bookStats.chart.title')}
                    </Heading>
                    <Text fontSize="sm" color={subTextColor}>{t('bookStats.chart.subTitle')}</Text>
                </Box>
                <Flex align="center">
                    <ReadingCalendar sessions={sessions} />
                </Flex>
            </Flex>

            <Box flex="1" minH="160px" minW={0} w="full">
                {stats.graphData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.graphData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                            <defs>
                                <linearGradient id="colorPage" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#c59a5c" stopOpacity={0.22} />
                                    <stop offset="95%" stopColor="#c59a5c" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(217, 188, 146, 0.08)" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'rgba(217, 204, 182, 0.54)', fontSize: 11, fontWeight: 500 }}
                                dy={15}
                            />
                            <YAxis
                                hide
                                domain={[0, stats.totalPages || 'auto']}
                            />
                            <Tooltip
                                cursor={{ stroke: '#c59a5c', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{
                                    backgroundColor: '#201814',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(217, 188, 146, 0.16)',
                                    boxShadow: '0 8px 16px rgba(8, 6, 4, 0.24)',
                                    padding: '10px 14px',
                                    color: '#f4ead7'
                                }}
                                itemStyle={{ color: '#d9bc92', fontWeight: 'bold', fontSize: '13px' }}
                                labelStyle={{ color: 'rgba(217, 204, 182, 0.58)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="page"
                                name={t('bookStats.pages')}
                                stroke="#d9bc92"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorPage)"
                                activeDot={{ r: 5, strokeWidth: 3, stroke: '#201814' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <Flex h="100%" justify="center" align="center" direction="column" color={subTextColor} bg="rgba(248, 236, 214, 0.05)" borderRadius="xl" border="1px solid" borderColor="rgba(217, 188, 146, 0.1)">
                        <Icon as={FaChartLine} w={10} h={10} mb={4} opacity={0.2} />
                        <Text fontSize="md" fontWeight="medium" color={subTextColor}>{t('bookStats.chart.noData')}</Text>
                        <Button mt={4} variant="ghost" size="sm" onClick={() => navigate(`/books/${bookId}/session`)}>
                            {t('bookStats.chart.readNow')}
                        </Button>
                    </Flex>
                )}
            </Box>
        </MotionCard>
    );
};

export default BookStatsCharts;

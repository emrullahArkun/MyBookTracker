import { useMemo, useRef, useEffect } from 'react';
import { Box, Text, Flex, Tooltip } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const CELL_SIZE = 13;
const CELL_GAP = 3;
const WEEKS = 52;

const getColor = (pages, max) => {
    if (!pages || pages === 0) return 'rgba(255,255,255,0.04)';
    const ratio = pages / max;
    if (ratio < 0.25) return 'rgba(129,230,217,0.2)';
    if (ratio < 0.5) return 'rgba(129,230,217,0.4)';
    if (ratio < 0.75) return 'rgba(129,230,217,0.6)';
    return 'rgba(129,230,217,0.85)';
};

const ReadingHeatmap = ({ dailyActivity = [] }) => {
    const { t } = useTranslation();

    const { grid, maxPages, months } = useMemo(() => {
        const map = {};
        let maxP = 1;
        for (const entry of dailyActivity) {
            map[entry.date] = entry.pagesRead;
            if (entry.pagesRead > maxP) maxP = entry.pagesRead;
        }

        const today = new Date();
        const dayOfWeek = today.getDay();
        // Start from (WEEKS) weeks ago, aligned to Sunday
        const start = new Date(today);
        start.setDate(today.getDate() - (WEEKS * 7) - dayOfWeek);

        const cols = [];
        const monthLabels = [];
        let lastMonth = -1;
        const d = new Date(start);

        for (let w = 0; w <= WEEKS; w++) {
            const week = [];
            for (let dow = 0; dow < 7; dow++) {
                const dateStr = d.toISOString().split('T')[0];
                const isAfterToday = d > today;
                week.push({
                    date: dateStr,
                    pages: isAfterToday ? 0 : (map[dateStr] || 0),
                    future: isAfterToday,
                });

                if (dow === 0 && d.getMonth() !== lastMonth && !isAfterToday) {
                    lastMonth = d.getMonth();
                    monthLabels.push({ week: w, label: d.toLocaleDateString(undefined, { month: 'short' }) });
                }
                d.setDate(d.getDate() + 1);
            }
            cols.push(week);
        }

        return { grid: cols, maxPages: maxP, months: monthLabels };
    }, [dailyActivity]);

    const totalWidth = (WEEKS + 1) * (CELL_SIZE + CELL_GAP);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [grid]);

    return (
        <Box ref={scrollRef} w="full" overflowX="auto">
            {/* Month labels */}
            <Flex ml="0px" mb={1} position="relative" h="16px" minW={`${totalWidth}px`}>
                {months.map((m, i) => (
                    <Text
                        key={i}
                        position="absolute"
                        left={`${m.week * (CELL_SIZE + CELL_GAP)}px`}
                        fontSize="10px"
                        color="gray.500"
                        userSelect="none"
                    >
                        {m.label}
                    </Text>
                ))}
            </Flex>

            {/* Grid */}
            <Flex gap={`${CELL_GAP}px`} minW={`${totalWidth}px`}>
                {grid.map((week, wi) => (
                    <Flex key={wi} direction="column" gap={`${CELL_GAP}px`}>
                        {week.map((day) => (
                            <Tooltip
                                key={day.date}
                                label={day.future ? '' : `${day.pages} ${t('stats.heatmap.pages')} — ${day.date}`}
                                placement="top"
                                hasArrow
                                bg="gray.900"
                                color="white"
                                fontSize="xs"
                                isDisabled={day.future}
                            >
                                <Box
                                    w={`${CELL_SIZE}px`}
                                    h={`${CELL_SIZE}px`}
                                    borderRadius="3px"
                                    bg={day.future ? 'transparent' : getColor(day.pages, maxPages)}
                                    transition="background 0.15s"
                                    _hover={day.future ? {} : { outline: '1px solid', outlineColor: 'teal.200' }}
                                />
                            </Tooltip>
                        ))}
                    </Flex>
                ))}
            </Flex>

            {/* Legend */}
            <Flex align="center" justify="flex-end" mt={2} gap={1}>
                <Text fontSize="10px" color="gray.500" mr={1}>{t('stats.heatmap.less')}</Text>
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                    <Box
                        key={i}
                        w="10px"
                        h="10px"
                        borderRadius="2px"
                        bg={getColor(ratio * 100, 100)}
                    />
                ))}
                <Text fontSize="10px" color="gray.500" ml={1}>{t('stats.heatmap.more')}</Text>
            </Flex>
        </Box>
    );
};

export default ReadingHeatmap;

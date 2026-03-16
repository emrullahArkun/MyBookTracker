import {
    Flex,
    Icon,
    Text,
    Textarea,
    Card
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaStickyNote } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const MotionCard = motion(Card);

const SessionNotesCard = ({ note, setNote, cardBg }) => {
    const { t } = useTranslation();

    return (
        <MotionCard
            bg={cardBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor="whiteAlpha.100"
            boxShadow="none"
            p={6}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            <Flex align="center" mb={4} color="gray.400">
                <Icon as={FaStickyNote} mr={2} boxSize={3.5} />
                <Text fontWeight="600" textTransform="uppercase" fontSize="xs" letterSpacing="wider">
                    {t('readingSession.notes.title')}
                </Text>
            </Flex>
            <Textarea
                placeholder={t('readingSession.notes.placeholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="whiteAlpha.100"
                color="white"
                _placeholder={{ color: "gray.400" }}
                _focus={{ borderColor: "whiteAlpha.300", boxShadow: "none" }}
                resize="none"
                rows={4}
            />
            <Flex justify="flex-end" mt={2}>
                <Text fontSize="xs" color="gray.600">{t('readingSession.notes.helper')}</Text>
            </Flex>
        </MotionCard>
    );
};

export default SessionNotesCard;

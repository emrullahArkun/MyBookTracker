import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    VStack,
    FormControl,
    FormLabel,
    RadioGroup,
    Stack,
    Radio,
    Input
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useThemeTokens } from '../../../shared/theme/useThemeTokens';

const BookGoalModal = ({
    isOpen,
    onClose,
    goalType,
    setGoalType,
    goalPages,
    setGoalPages,
    handleSaveGoal,
    isSavingGoal
}) => {
    const { t } = useTranslation();
    const {
        textColor,
        overlayBg,
        modalBg,
        modalBorder,
        modalSubtleBg,
        modalMutedText,
        modalShadow,
        brandColor,
    } = useThemeTokens();

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay bg={overlayBg} backdropFilter="blur(10px)" />
            <ModalContent
                bg={modalBg}
                color={textColor}
                border="1px solid"
                borderColor={modalBorder}
                borderRadius="2xl"
                boxShadow={modalShadow}
                mx={4}
            >
                <ModalHeader pb={2}>{t('bookStats.goal.modal.title')}</ModalHeader>
                <ModalCloseButton color={modalMutedText} />
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl>
                            <FormLabel color={modalMutedText}>{t('bookStats.goal.modal.period')}</FormLabel>
                            <RadioGroup value={goalType} onChange={setGoalType}>
                                <Stack
                                    direction={{ base: 'column', sm: 'row' }}
                                    spacing={3}
                                    bg={modalSubtleBg}
                                    border="1px solid"
                                    borderColor={modalBorder}
                                    borderRadius="xl"
                                    p={3}
                                >
                                    <Radio value="WEEKLY" colorScheme="orange" color={textColor}>{t('bookStats.goal.modal.weekly')}</Radio>
                                    <Radio value="MONTHLY" colorScheme="orange" color={textColor}>{t('bookStats.goal.modal.monthly')}</Radio>
                                </Stack>
                            </RadioGroup>
                        </FormControl>
                        <FormControl>
                            <FormLabel color={modalMutedText}>{t('bookStats.goal.modal.pages')}</FormLabel>
                            <Input
                                type="number"
                                value={goalPages}
                                onChange={(e) => setGoalPages(e.target.value)}
                                placeholder="e.g. 50"
                                bg={modalSubtleBg}
                                border="1px solid"
                                borderColor={modalBorder}
                                color={textColor}
                                _placeholder={{ color: modalMutedText }}
                                _hover={{ borderColor: 'rgba(255, 238, 214, 0.18)' }}
                                _focus={{
                                    borderColor: brandColor,
                                    boxShadow: `0 0 0 1px ${brandColor}`,
                                }}
                            />
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter gap={3}>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        color={modalMutedText}
                        bg={modalSubtleBg}
                        border="1px solid"
                        borderColor={modalBorder}
                        borderRadius="xl"
                        _hover={{ bg: 'rgba(255, 248, 239, 0.12)', color: textColor }}
                    >
                        {t('bookStats.goal.modal.cancel')}
                    </Button>
                    <Button
                        onClick={handleSaveGoal}
                        isLoading={isSavingGoal}
                        borderRadius="xl"
                        color="#fff8ef"
                        bg="linear-gradient(180deg, rgba(243, 199, 133, 0.96) 0%, rgba(167, 127, 92, 0.94) 100%)"
                        _hover={{
                            bg: 'linear-gradient(180deg, rgba(249, 209, 148, 0.98) 0%, rgba(182, 138, 101, 0.96) 100%)',
                            transform: 'translateY(-1px)',
                        }}
                    >
                        {t('bookStats.goal.modal.save')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default BookGoalModal;

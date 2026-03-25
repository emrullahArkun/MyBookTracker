import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BookGoalModal from './BookGoalModal';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
    }),
}));

describe('BookGoalModal', () => {
    let onClose, setGoalType, setGoalPages, handleSaveGoal;

    beforeEach(() => {
        onClose = vi.fn();
        setGoalType = vi.fn();
        setGoalPages = vi.fn();
        handleSaveGoal = vi.fn();
    });

    const renderModal = (props = {}) => {
        return render(
            <BookGoalModal
                isOpen={true}
                onClose={onClose}
                goalType="WEEKLY"
                setGoalType={setGoalType}
                goalPages={50}
                setGoalPages={setGoalPages}
                handleSaveGoal={handleSaveGoal}
                isSavingGoal={false}
                {...props}
            />
        );
    };

    it('should render modal with title and fields', () => {
        renderModal();
        expect(screen.getByText('bookStats.goal.modal.title')).toBeInTheDocument();
        expect(screen.getByText('bookStats.goal.modal.weekly')).toBeInTheDocument();
        expect(screen.getByText('bookStats.goal.modal.monthly')).toBeInTheDocument();
        expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    });

    it('should call onClose when cancel button is clicked', () => {
        renderModal();
        fireEvent.click(screen.getByText('bookStats.goal.modal.cancel'));
        expect(onClose).toHaveBeenCalled();
    });

    it('should call handleSaveGoal when save button is clicked', () => {
        renderModal();
        fireEvent.click(screen.getByText('bookStats.goal.modal.save'));
        expect(handleSaveGoal).toHaveBeenCalled();
    });

    it('should call setGoalPages on input change', () => {
        renderModal();
        fireEvent.change(screen.getByPlaceholderText('e.g. 50'), { target: { value: '100' } });
        expect(setGoalPages).toHaveBeenCalledWith('100');
    });

    it('should call setGoalType when selecting a different radio', () => {
        renderModal();
        const monthlyRadio = screen.getByLabelText('bookStats.goal.modal.monthly');
        fireEvent.click(monthlyRadio);
        expect(setGoalType).toHaveBeenCalledWith('MONTHLY');
    });

    it('should not render when isOpen is false', () => {
        renderModal({ isOpen: false });
        expect(screen.queryByText('bookStats.goal.modal.title')).toBeNull();
    });
});

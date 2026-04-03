import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SessionStopConfirm from './SessionStopConfirm';

// ── i18n ──────────────────────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// ── Theme ─────────────────────────────────────────────────────────────────────
vi.mock('../../../shared/theme/useThemeTokens', () => ({
    useThemeTokens: () => ({
        textColor: '#f4ead7',
        overlayBg: 'rgba(11,9,7,0.72)',
        modalBg: '#1b1511',
        modalBorder: 'rgba(217,188,146,0.16)',
        modalSubtleBg: 'rgba(248,236,214,0.05)',
        modalMutedText: 'rgba(217,204,182,0.72)',
        modalShadow: '0 28px 70px rgba(8,6,4,0.36)',
        brandColor: '#c59a5c',
    }),
}));

// ── Chakra UI ─────────────────────────────────────────────────────────────────
vi.mock('@chakra-ui/react', async () => {
    const React = await import('react');

    return {
        AlertDialog: ({ children, isOpen }: {
            children: React.ReactNode;
            isOpen: boolean;
            leastDestructiveRef: React.RefObject<HTMLButtonElement>;
            onClose: () => void;
            isCentered?: boolean;
        }) => isOpen ? <div role="alertdialog">{children}</div> : null,

        AlertDialogOverlay: ({ children }: { children: React.ReactNode; [key: string]: unknown }) => (
            <div>{children}</div>
        ),

        AlertDialogContent: ({ children }: { children: React.ReactNode; [key: string]: unknown }) => (
            <div>{children}</div>
        ),

        AlertDialogHeader: ({ children }: { children: React.ReactNode; [key: string]: unknown }) => (
            <header>{children}</header>
        ),

        AlertDialogBody: ({ children }: { children: React.ReactNode; [key: string]: unknown }) => (
            <div>{children}</div>
        ),

        AlertDialogFooter: ({ children }: { children: React.ReactNode; [key: string]: unknown }) => (
            <footer>{children}</footer>
        ),

        Button: React.forwardRef(({ children, onClick, ...rest }: {
            children: React.ReactNode;
            onClick?: () => void;
            [key: string]: unknown;
        }, ref: React.Ref<HTMLButtonElement>) => (
            <button
                ref={ref}
                type="button"
                onClick={onClick}
                {...Object.fromEntries(
                    Object.entries(rest).filter(([k]) =>
                        !['bg', 'color', 'border', 'borderColor', 'borderRadius',
                          'px', '_hover', 'boxShadow', 'transform'].includes(k)
                    )
                )}
            >
                {children}
            </button>
        )),

        Flex: ({ children }: { children: React.ReactNode; [key: string]: unknown }) => (
            <div>{children}</div>
        ),

        FormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,

        FormLabel: ({ children, ...rest }: { children: React.ReactNode; [key: string]: unknown }) => (
            <label {...Object.fromEntries(
                Object.entries(rest).filter(([k]) => !['color', 'fontSize'].includes(k))
            )}>
                {children}
            </label>
        ),

        Icon: ({ as: IconComponent }: { as?: React.ComponentType }) =>
            IconComponent ? <span data-testid="icon"><IconComponent /></span> : null,

        Input: React.forwardRef(({ onChange, onKeyDown, placeholder, value, type, ...rest }: {
            onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
            onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
            placeholder?: string;
            value?: string;
            type?: string;
            [key: string]: unknown;
        }, ref: React.Ref<HTMLInputElement>) => (
            <input
                ref={ref}
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                onKeyDown={onKeyDown}
                {...Object.fromEntries(
                    Object.entries(rest).filter(([k]) =>
                        !['bg', 'border', 'borderColor', 'borderRadius', 'color',
                          '_placeholder', '_focus', 'autoFocus'].includes(k)
                    )
                )}
            />
        )),

        Text: ({ children }: { children: React.ReactNode; [key: string]: unknown }) => (
            <p>{children}</p>
        ),
    };
});

// ── react-icons ───────────────────────────────────────────────────────────────
vi.mock('react-icons/fa', () => ({
    FaBookOpen: () => null,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildProps(overrides: Partial<{
    endPage: string;
    setEndPage: (value: string) => void;
    currentPage: string;
    handleConfirmStop: () => Promise<void>;
    handleStopCancel: () => void;
}> = {}) {
    return {
        endPage: '120',
        setEndPage: vi.fn(),
        currentPage: '100',
        handleConfirmStop: vi.fn().mockResolvedValue(undefined),
        handleStopCancel: vi.fn(),
        ...overrides,
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SessionStopConfirm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the dialog', () => {
        render(<SessionStopConfirm {...buildProps()} />);

        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('renders the dialog title', () => {
        render(<SessionStopConfirm {...buildProps()} />);

        expect(screen.getByText('readingSession.finish.title')).toBeInTheDocument();
    });

    it('renders the end-page label', () => {
        render(<SessionStopConfirm {...buildProps()} />);

        expect(screen.getByText('readingSession.finish.endPage')).toBeInTheDocument();
    });

    it('renders the input with currentPage as placeholder', () => {
        render(<SessionStopConfirm {...buildProps({ currentPage: '75' })} />);

        const input = screen.getByRole('spinbutton');
        expect(input).toHaveAttribute('placeholder', '75');
    });

    it('renders the input with the endPage value', () => {
        render(<SessionStopConfirm {...buildProps({ endPage: '130' })} />);

        const input = screen.getByRole('spinbutton');
        expect(input).toHaveValue(130);
    });

    it('calls setEndPage when the user types in the input', async () => {
        const setEndPage = vi.fn();
        render(<SessionStopConfirm {...buildProps({ endPage: '', setEndPage })} />);

        await userEvent.type(screen.getByRole('spinbutton'), '5');

        expect(setEndPage).toHaveBeenCalled();
        expect(setEndPage).toHaveBeenCalledWith(expect.stringContaining('5'));
    });

    it('renders the save button', () => {
        render(<SessionStopConfirm {...buildProps()} />);

        expect(screen.getByRole('button', { name: 'readingSession.controls.save' })).toBeInTheDocument();
    });

    it('renders the cancel button', () => {
        render(<SessionStopConfirm {...buildProps()} />);

        expect(screen.getByRole('button', { name: 'readingSession.controls.cancel' })).toBeInTheDocument();
    });

    it('calls handleConfirmStop when the save button is clicked', async () => {
        const handleConfirmStop = vi.fn().mockResolvedValue(undefined);
        render(<SessionStopConfirm {...buildProps({ handleConfirmStop })} />);

        await userEvent.click(screen.getByRole('button', { name: 'readingSession.controls.save' }));

        expect(handleConfirmStop).toHaveBeenCalledTimes(1);
    });

    it('calls handleStopCancel when the cancel button is clicked', async () => {
        const handleStopCancel = vi.fn();
        render(<SessionStopConfirm {...buildProps({ handleStopCancel })} />);

        await userEvent.click(screen.getByRole('button', { name: 'readingSession.controls.cancel' }));

        expect(handleStopCancel).toHaveBeenCalledTimes(1);
    });

    it('calls handleConfirmStop when Enter is pressed in the input', async () => {
        const handleConfirmStop = vi.fn().mockResolvedValue(undefined);
        render(<SessionStopConfirm {...buildProps({ handleConfirmStop })} />);

        const input = screen.getByRole('spinbutton');
        await userEvent.type(input, '{Enter}');

        expect(handleConfirmStop).toHaveBeenCalledTimes(1);
    });

    it('does NOT call handleConfirmStop when a non-Enter key is pressed in the input', async () => {
        const handleConfirmStop = vi.fn().mockResolvedValue(undefined);
        render(<SessionStopConfirm {...buildProps({ handleConfirmStop })} />);

        const input = screen.getByRole('spinbutton');
        await userEvent.type(input, 'a');

        expect(handleConfirmStop).not.toHaveBeenCalled();
    });
});

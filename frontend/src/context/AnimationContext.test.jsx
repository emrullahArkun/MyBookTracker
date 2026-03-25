import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnimationProvider, useAnimation } from './AnimationContext';

// Mock framer-motion to avoid animation side-effects in tests
vi.mock('framer-motion', () => ({
    motion: {
        img: (props) => <img {...props} />,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}));

// Helper component to access context
const TestConsumer = ({ onRender }) => {
    const ctx = useAnimation();
    onRender(ctx);
    return null;
};

describe('AnimationContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should provide registerTarget and flyBook functions', () => {
        let captured;
        render(
            <AnimationProvider>
                <TestConsumer onRender={(ctx) => { captured = ctx; }} />
            </AnimationProvider>
        );

        expect(typeof captured.registerTarget).toBe('function');
        expect(typeof captured.flyBook).toBe('function');
    });

    it('flyBook should not crash when no target is registered', () => {
        let captured;
        render(
            <AnimationProvider>
                <TestConsumer onRender={(ctx) => { captured = ctx; }} />
            </AnimationProvider>
        );

        // Should not throw even without a target
        expect(() => {
            act(() => {
                captured.flyBook({ top: 0, left: 0, width: 100, height: 150 }, 'http://img.jpg');
            });
        }).not.toThrow();
    });

    it('flyBook should add a flying book when target is registered', () => {
        let captured;
        const targetEl = document.createElement('div');
        // Mock getBoundingClientRect on the target element
        targetEl.getBoundingClientRect = () => ({
            top: 50, left: 50, width: 40, height: 20,
        });

        render(
            <AnimationProvider>
                <TestConsumer onRender={(ctx) => { captured = ctx; }} />
            </AnimationProvider>
        );

        act(() => {
            captured.registerTarget(targetEl);
        });

        act(() => {
            captured.flyBook({ top: 200, left: 200, width: 100, height: 150 }, 'http://img.jpg');
        });

        // The flying book image should be rendered via portal
        const imgs = document.body.querySelectorAll('img[src="http://img.jpg"]');
        expect(imgs.length).toBeGreaterThan(0);
    });

    it('useAnimation should throw when used outside AnimationProvider', () => {
        const BadComponent = () => {
            useAnimation();
            return null;
        };

        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => render(<BadComponent />)).toThrow(
            'useAnimation must be used within an AnimationProvider'
        );

        errorSpy.mockRestore();
    });
});

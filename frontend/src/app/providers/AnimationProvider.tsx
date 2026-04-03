import { createContext, useContext, useState, useRef, useCallback, type ReactNode, type RefCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

type FlyingBook = {
    id: number;
    startRect: DOMRect;
    targetRect: DOMRect;
    imageSrc: string;
};

type AnimationContextValue = {
    registerTarget: RefCallback<HTMLElement>;
    flyBook: (startRect: DOMRect, imageSrc: string) => void;
};

const AnimationContext = createContext<AnimationContextValue | null>(null);

export const AnimationProvider = ({ children }: { children: ReactNode }) => {
    const targetRef = useRef<HTMLElement | null>(null);
    const [flyingBooks, setFlyingBooks] = useState<FlyingBook[]>([]);

    const registerTarget: RefCallback<HTMLElement> = useCallback((element) => {
        targetRef.current = element;
    }, []);

    const flyBook = useCallback((startRect: DOMRect, imageSrc: string) => {
        if (!targetRef.current) return;

        const targetRect = targetRef.current.getBoundingClientRect();
        const id = Date.now() + Math.random();

        setFlyingBooks((prev) => [
            ...prev,
            { id, startRect, targetRect, imageSrc }
        ]);
    }, []);

    const removeBook = useCallback((id: number) => {
        setFlyingBooks((prev) => prev.filter((book) => book.id !== id));
    }, []);

    return (
        <AnimationContext.Provider value={{ registerTarget, flyBook }}>
            {children}
            {typeof document !== 'undefined' && createPortal(
                <FlyingBooksLayer books={flyingBooks} onComplete={removeBook} />,
                document.body
            )}
        </AnimationContext.Provider>
    );
};

export const useAnimation = () => {
    const context = useContext(AnimationContext);
    if (!context) {
        throw new Error('useAnimation must be used within an AnimationProvider');
    }
    return context;
};

const FlyingBooksLayer = ({ books, onComplete }: { books: FlyingBook[]; onComplete: (id: number) => void }) => {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
            <AnimatePresence>
                {books.map((book) => (
                    <motion.img
                        key={book.id}
                        src={book.imageSrc}
                        initial={{
                            position: 'absolute',
                            top: book.startRect.top,
                            left: book.startRect.left,
                            width: book.startRect.width,
                            height: book.startRect.height,
                            opacity: 1,
                            objectFit: 'cover',
                            borderRadius: '4px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                            zIndex: 9999
                        }}
                        animate={{
                            top: book.targetRect.top + (book.targetRect.height / 2) - 15,
                            left: book.targetRect.left + (book.targetRect.width / 2) - 10,
                            width: 20,
                            height: 30,
                            opacity: 0,
                            scale: 0.1
                        }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        onAnimationComplete={() => onComplete(book.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

import type { HTMLAttributes, ReactNode } from 'react';
import './Card.css';

type CardProps = {
    children: ReactNode;
    className?: string;
} & HTMLAttributes<HTMLDivElement>;

export const Card = ({ children, className = '', ...props }: CardProps) => {
    return (
        <div className={`ui-card ${className}`} {...props}>
            {children}
        </div>
    );
};

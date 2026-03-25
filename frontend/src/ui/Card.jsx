import './Card.css';

export const Card = ({ children, className = '', ...props }) => {
    return (
        <div className={`ui-card ${className}`} {...props}>
            {children}
        </div>
    );
};

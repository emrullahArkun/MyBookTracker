import './Button.css';

export const Button = ({
    children,
    variant = 'primary',
    isLoading = false,
    leftIcon,
    className = '',
    ...props
}) => {
    return (
        <button
            className={`ui-btn ui-btn--${variant} ${isLoading ? 'ui-btn--loading' : ''} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <span className="ui-btn__spinner" />}
            {!isLoading && leftIcon && <span className="ui-btn__icon">{leftIcon}</span>}
            <span className={isLoading ? 'ui-btn__content--hidden' : 'ui-btn__content'}>
                {children}
            </span>
        </button>
    );
};

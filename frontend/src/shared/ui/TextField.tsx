import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import './TextField.css';

type TextFieldProps = {
    label?: string;
    error?: string;
    leftIcon?: ReactNode;
    rightElement?: ReactNode;
    className?: string;
    containerClassName?: string;
} & ComponentPropsWithoutRef<'input'>;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(({
    label,
    error,
    leftIcon,
    rightElement,
    type = 'text',
    id,
    className = '',
    containerClassName = '',
    ...props
}, ref) => {
    const generatedId = useId();
    const inputId = id || props.name || generatedId;

    return (
        <div className={`ui-field ${containerClassName}`}>
            <div className={`ui-field__input-wrapper ${error ? 'ui-field__input-wrapper--error' : ''}`}>
                {leftIcon && <span className="ui-field__icon ui-field__icon--left">{leftIcon}</span>}

                <input
                    ref={ref}
                    id={inputId}
                    type={type}
                    className={`ui-field__input ${className} ${leftIcon ? 'ui-field__input--has-left-icon' : ''}`}
                    placeholder=" "
                    {...props}
                />

                {label && (
                    <label
                        htmlFor={inputId}
                        className={`ui-field__label ${leftIcon ? 'ui-field__label--has-left-icon' : ''}`}
                    >
                        {label}
                    </label>
                )}

                {rightElement && <div className="ui-field__right-element">{rightElement}</div>}
            </div>

            {error && <span className="ui-field__error">{error}</span>}
        </div>
    );
});

TextField.displayName = 'TextField';

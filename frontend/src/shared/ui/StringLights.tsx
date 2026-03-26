import type { CSSProperties } from 'react';
import './StringLights.css';

type Light = {
    left: string;
    top: string;
    delay: string;
    color: string;
};

export const StringLights = () => {
    const darkYellow = '#e0a800';

    const lights: Light[] = [
        { left: '10%', top: '27%', delay: '0s', color: darkYellow },
        { left: '25%', top: '56%', delay: '1s', color: darkYellow },
        { left: '40%', top: '72%', delay: '0.5s', color: darkYellow },
        { left: '55%', top: '74%', delay: '1.5s', color: darkYellow },
        { left: '70%', top: '63%', delay: '0.2s', color: darkYellow },
        { left: '85%', top: '38%', delay: '1.2s', color: darkYellow },
    ];

    return (
        <div className="string-lights-container">
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="string-lights-svg"
            >
                <path
                    d="M0,0 Q50,150 100,0"
                    fill="none"
                    stroke="var(--neutral-800)"
                    strokeWidth="0.5"
                    className="string-lights__cord"
                />
            </svg>

            {lights.map((light, index) => (
                <div
                    key={index}
                    className="string-lights__bulb-wrapper"
                    style={{
                        left: light.left,
                        top: light.top,
                    } as CSSProperties}
                >
                    <div className="string-lights__socket" />

                    <div
                        className="string-lights__bulb"
                        style={{
                            animationDelay: light.delay,
                            backgroundColor: light.color,
                            boxShadow: `0 0 8px ${light.color}`,
                        }}
                    />
                </div>
            ))}
        </div>
    );
};

import { extendTheme } from '@chakra-ui/react';

const config = {
    initialColorMode: 'dark',
    useSystemColorMode: false,
};

const theme = extendTheme({
    config,
    colors: {
        brand: {
            50: '#f8efdf',
            100: '#efe1c7',
            200: '#e2c89c',
            300: '#d4af75',
            400: '#c59a5c',
            500: '#a7773f',
            600: '#865f34',
            700: '#684928',
            800: '#49321b',
            900: '#2c1d0f',
        },
        parchment: {
            50: '#faf4e7',
            100: '#f4ead7',
            200: '#dbc8aa',
            300: '#c9b18b',
            400: '#9d8568',
            500: '#7f6650',
            600: '#5b4739',
            700: '#3a2d24',
            800: '#241b16',
            900: '#17110d',
        },
    },
    fonts: {
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
    },
    radii: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '22px',
        '3xl': '28px',
    },
    shadows: {
        outline: '0 0 0 3px rgba(197, 154, 92, 0.28)',
        panel: '0 22px 44px rgba(8, 6, 4, 0.22)',
        lift: '0 10px 24px rgba(8, 6, 4, 0.16)',
    },
    styles: {
        global: {
            body: {
                bg: '#17110d',
                color: '#f4ead7',
            },
        },
    },
    components: {
        Card: {
            baseStyle: {
                container: {
                    bg: 'linear-gradient(180deg, rgba(40, 30, 23, 0.96) 0%, rgba(28, 22, 18, 0.98) 100%)',
                    border: '1px solid',
                    borderColor: 'rgba(217, 188, 146, 0.14)',
                    borderRadius: 'xl',
                    boxShadow: 'panel',
                    overflow: 'hidden',
                },
            },
        },
        Button: {
            baseStyle: {
                fontWeight: '600',
                letterSpacing: '0.01em',
                borderRadius: 'md',
            },
            variants: {
                solid: {
                    bg: 'brand.400',
                    color: '#1c140e',
                    boxShadow: 'none',
                    _hover: {
                        bg: 'brand.300',
                    },
                    _active: {
                        bg: 'brand.500',
                    },
                },
                outline: {
                    bg: 'rgba(248, 236, 214, 0.02)',
                    color: 'parchment.100',
                    border: '1px solid',
                    borderColor: 'rgba(217, 188, 146, 0.18)',
                    _hover: {
                        bg: 'rgba(248, 236, 214, 0.06)',
                        borderColor: 'rgba(217, 188, 146, 0.3)',
                    },
                },
                ghost: {
                    color: 'rgba(217, 204, 182, 0.84)',
                    _hover: {
                        bg: 'rgba(248, 236, 214, 0.05)',
                        color: '#f4ead7',
                    },
                },
            },
        },
        Badge: {
            baseStyle: {
                borderRadius: 'sm',
                fontSize: '0.68rem',
                fontWeight: '700',
                letterSpacing: '0.14em',
                px: 3,
                py: 1,
                textTransform: 'uppercase',
            },
        },
        Progress: {
            baseStyle: {
                track: {
                    bg: 'rgba(248, 236, 214, 0.08)',
                    borderRadius: 'full',
                },
                filledTrack: {
                    bg: 'linear-gradient(90deg, #a7773f 0%, #d9bc92 100%)',
                },
            },
        },
        Tooltip: {
            baseStyle: {
                bg: '#201814',
                color: '#f4ead7',
                borderRadius: 'sm',
                border: '1px solid rgba(217, 188, 146, 0.18)',
            },
        },
    },
});

export default theme;

import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import App from './App'
import './index.css'
import './i18n'
import theme from '../shared/theme/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme} toastOptions={{ defaultOptions: { containerStyle: { margin: '0px !important', marginBottom: '2px !important' } } }}>
        <App />
      </ChakraProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)

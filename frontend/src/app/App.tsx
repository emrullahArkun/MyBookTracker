import { AuthProvider } from '../features/auth/model';
import { AnimationProvider } from './providers/AnimationProvider';
import ErrorBoundary from '../shared/ui/ErrorBoundary';
import AppRouter from './router/AppRouter';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AnimationProvider>
        <div className="app-container">
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </div>
      </AnimationProvider>
    </AuthProvider>
  );
}

export default App;

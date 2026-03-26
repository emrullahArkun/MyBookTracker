import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './errorUtils';

describe('getErrorMessage', () => {
    it('returns the message from an Error instance', () => {
        expect(getErrorMessage(new Error('Boom'))).toBe('Boom');
    });

    it('returns the fallback for unknown errors', () => {
        expect(getErrorMessage('boom', 'Fallback message')).toBe('Fallback message');
    });
});

import { useQueryClient } from '@tanstack/react-query';
import { useAddBookToLibrary } from '../../library';

export const useAddSearchResultToLibrary = () => {
    const queryClient = useQueryClient();

    return useAddBookToLibrary({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discovery'] });
        },
    });
};

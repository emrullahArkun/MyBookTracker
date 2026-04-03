
import { Skeleton, AspectRatio, Box } from '@chakra-ui/react';
import styles from './SearchResultCard.module.css';

const SearchResultSkeleton = () => {
    return (
        <Box
            className={styles.searchResultCard}
            boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
        >
            <AspectRatio ratio={2 / 3}>
                <Skeleton
                    height="100%"
                    width="100%"
                    borderRadius="12px"
                />
            </AspectRatio>
        </Box>
    );
};

export default SearchResultSkeleton;

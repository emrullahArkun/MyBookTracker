import { FaExclamationCircle, FaBookOpen } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DiscoverySection from '../ui/DiscoverySection';
import useDiscovery from '../model/useDiscovery';
import styles from './DiscoveryPage.module.css';

const DiscoveryPage = () => {
    const { t } = useTranslation();
    const { loading, error, data, refresh } = useDiscovery();

    if (loading) {
        return (
            <div className={styles.discoveryPage}>
                <div className={styles.loadingState}>
                    <div className={styles.bouncingBallContainer}>
                        <div className={styles.bouncingBall}></div>
                        <div className={styles.groundLine}></div>
                    </div>
                    <p>{t('discovery.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.discoveryPage}>
                <div className={styles.errorState}>
                    <p><FaExclamationCircle /> {error}</p>
                    <button className={styles.refreshBtn} onClick={() => void refresh()}>
                        {t('discovery.retry')}
                    </button>
                </div>
            </div>
        );
    }

    const hasAuthors = data.byAuthor.authors.length > 0;
    const hasCategories = data.byCategory.categories.length > 0;
    const hasSearches = data.bySearch.queries.length > 0;
    const hasAnyData = hasAuthors || hasCategories || hasSearches;

    return (
        <div className={styles.discoveryPage}>
            <div className={styles.sections}>
                {hasAuthors && (
                    <DiscoverySection
                        title={t('discovery.byAuthorTitle')}
                        subtitle={data.byAuthor.authors[0]}
                        iconType="author"
                        books={data.byAuthor.books}
                        emptyMessage={t('discovery.emptyAuthor')}
                    />
                )}

                {hasCategories && (
                    <DiscoverySection
                        title={t('discovery.byCategoryTitle')}
                        subtitle={data.byCategory.categories[0]}
                        iconType="category"
                        books={data.byCategory.books}
                        emptyMessage={t('discovery.emptyCategory')}
                    />
                )}

                {hasSearches && (
                    <DiscoverySection
                        title={t('discovery.bySearchTitle')}
                        subtitle={data.bySearch.queries[0]}
                        iconType="search"
                        books={data.bySearch.books}
                        emptyMessage={t('discovery.emptySearch')}
                    />
                )}

                {!hasAnyData && (
                    <div className={styles.emptyState}>
                        <FaBookOpen className={styles.emptyIcon} />
                        <p>{t('discovery.emptyState')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiscoveryPage;

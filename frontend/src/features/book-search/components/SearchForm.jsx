
import { FaSearch } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import styles from './SearchForm.module.css';

const SearchForm = ({ query, setQuery, onSearch }) => {
    const { t } = useTranslation();

    return (
        <form onSubmit={onSearch} className={styles.searchForm}>
            <FaSearch className={styles.searchIcon} />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder', 'Suche nach Titel, Autor, ISBN...')}
                className={styles.searchInput}
            />
        </form>
    );
};

export default SearchForm;

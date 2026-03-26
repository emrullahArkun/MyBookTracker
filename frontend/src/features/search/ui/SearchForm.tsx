import type { ChangeEvent, FormEvent } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import styles from './SearchForm.module.css';

type SearchFormProps = {
    query: string;
    setQuery: (value: string) => void;
    onSearch: (e: FormEvent<HTMLFormElement>) => void;
};

const SearchForm = ({ query, setQuery, onSearch }: SearchFormProps) => {
    const { t } = useTranslation();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    return (
        <form onSubmit={onSearch} className={styles.searchForm}>
            <FaSearch className={styles.searchIcon} />
            <input
                type="text"
                value={query}
                onChange={handleChange}
                placeholder={t('search.placeholder')}
                className={styles.searchInput}
            />
        </form>
    );
};

export default SearchForm;

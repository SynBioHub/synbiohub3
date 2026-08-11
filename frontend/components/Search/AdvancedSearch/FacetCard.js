import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../../styles/advancedsearch.module.css';
import FacetOptionList from './FacetOptionList';
import useFacetOptions from './useFacetOptions';

/**
 * Renders a single facet as an always-expanded card: title, underlying
 * predicate, a search box, and the top options by count
 */
export default function FacetCard(properties) {
  const {
    title,
    subtitle,
    description,
    sparql,
    parseResult,
    isMulti,
    value,
    onChange
  } = properties;
  const { loading, error, data } = useFacetOptions({ sparql, parseResult });

  const hasSelection = isMulti ? value.length > 0 : Boolean(value);

  return (
    <div className={styles.facetcard}>
      <div className={styles.facetheader}>
        <span className={styles.facettitlewrap}>
          <span className={styles.facettitle}>{title}</span>
          {description && (
            <span
              className={styles.facetinfo}
              tabIndex={0}
              role="button"
              aria-label={`What is ${title}?`}
            >
              <FontAwesomeIcon icon={faInfoCircle} />
              <span className={styles.facettooltip}>{description}</span>
            </span>
          )}
        </span>
        {hasSelection && (
          <span
            role="button"
            className={styles.facetclear}
            onClick={() => onChange(isMulti ? [] : null)}
          >
            &times;
          </span>
        )}
      </div>

      {subtitle && <div className={styles.facetsubtitle}>{subtitle}</div>}

      <FacetOptionList
        data={data}
        loading={loading}
        error={error}
        isMulti={isMulti}
        value={value}
        onChange={onChange}
        searchPlaceholder={`Search ${title.toLowerCase()}...`}
      />
    </div>
  );
}

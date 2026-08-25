import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import styles from '../../../styles/advancedsearch.module.css';
import { getFacetDotColor } from '../../../utilities/facetColor';
import Loading from '../../Reusable/MiniLoading';

export const isOptionSelected = (value, isMulti, option) =>
  isMulti
    ? value.some(selected => selected.value === option.value)
    : value === option.value;

export const toggleOption = (value, isMulti, option) => {
  if (!isMulti) return isOptionSelected(value, false, option) ? null : option;
  return isOptionSelected(value, true, option)
    ? value.filter(selected => selected.value !== option.value)
    : [...value, option];
};

// drops the "prefix:" and/or "category/" from a short name for display
// (so:engineered_region -> engineered_region, partType/RBS -> RBS)
export const condenseLabel = label => {
  const afterPrefix = label.includes(':')
    ? label.slice(label.lastIndexOf(':') + 1)
    : label;
  return afterPrefix.includes('/')
    ? afterPrefix.slice(afterPrefix.lastIndexOf('/') + 1)
    : afterPrefix;
};

const getVisibleOptions = (data, search) =>
  search
    ? data.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase())
      )
    : data;

/**
 * The searchable option list (search box + colored-dot rows) shared by
 * FacetCard and AdditionalFilter.
 */
export default function FacetOptionList(properties) {
  const {
    data,
    loading,
    error,
    isMulti,
    value,
    onChange,
    searchPlaceholder,
    emptyLabel
  } = properties;
  const [search, setSearch] = useState('');
  const visible = getVisibleOptions(data, search);

  return (
    <>
      <div className={styles.facetsearchwrap}>
        <FontAwesomeIcon icon={faSearch} className={styles.facetsearchicon} />
        <input
          className={styles.facetsearchinput}
          placeholder={searchPlaceholder}
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      {loading && <Loading height={20} />}
      {error && <div className={styles.facetempty}>Error loading options</div>}

      {!loading && !error && (
        <div className={styles.facetoptions}>
          {visible.length === 0 && (
            <div className={styles.facetempty}>
              {emptyLabel || 'No matches'}
            </div>
          )}
          {visible.map(option => (
            <div
              key={option.value}
              role="button"
              className={`${styles.facetoption} ${
                isOptionSelected(value, isMulti, option)
                  ? styles.facetoptionactive
                  : ''
              }`}
              onClick={() => onChange(toggleOption(value, isMulti, option))}
            >
              <span
                className={styles.facetdot}
                style={{ background: getFacetDotColor(option.label) }}
              />
              <span className={styles.facetlabel}>
                {condenseLabel(option.label)}
              </span>
              {option.count !== undefined && (
                <span className={styles.facetcount}>{option.count}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

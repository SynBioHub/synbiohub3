import { shortName } from '../../../namespace/namespace';
import styles from '../../../styles/standardsearch.module.css';
import { getFacetDotColor } from '../../../utilities/facetColor';
import { condenseLabel } from '../AdvancedSearch/FacetOptionList';

const buildSingleChips = properties => {
  const filters = [
    {
      key: 'creator',
      label: 'Creator',
      value: properties.creator,
      set: properties.setCreator
    },
    {
      key: 'sbolType',
      label: 'Part Type',
      value: properties.sbolType,
      set: properties.setSbolType
    },
    {
      key: 'role',
      label: 'Part Role',
      value: properties.role,
      set: properties.setRole
    },
    {
      key: 'objectType',
      label: 'Object Type',
      value: properties.objectType,
      set: properties.setObjectType
    }
  ];

  return filters
    .filter(({ value }) => value)
    .map(({ key, label, value, set }) => ({
      key,
      text: `${label}: ${condenseLabel(shortName(value))}`,
      onRemove: () => set('')
    }));
};

const buildCollectionChips = properties =>
  properties.collections.map(collection => ({
    key: `collection-${collection.value}`,
    text: `Collection: ${collection.label}`,
    onRemove: () =>
      properties.setCollections(
        properties.collections.filter(
          selected => selected.value !== collection.value
        )
      )
  }));

const buildExtraFilterChips = properties =>
  properties.extraFilters
    .map((filter, index) => ({ filter, index }))
    .filter(({ filter }) => filter.filter && filter.value)
    .map(({ filter, index }) => ({
      key: `extra-${index}`,
      text: `${condenseLabel(filter.filter)}: ${condenseLabel(
        shortName(filter.value)
      )}`,
      onRemove: () => properties.onRemoveExtraFilter(index)
    }));

/**
 * Shows the currently active search filters as removable chips above the
 * results table, so selections stay visible without needing to open the
 * sidebar and scroll/search to find them again.
 */
export default function SelectedFilters(properties) {
  const chips = [
    ...buildSingleChips(properties),
    ...buildCollectionChips(properties),
    ...buildExtraFilterChips(properties)
  ];

  return (
    <div className={styles.selectedfilters}>
      {chips.map(chip => (
        <div key={chip.key} className={styles.filterchip}>
          <span
            className={styles.filterchipdot}
            style={{ background: getFacetDotColor(chip.text) }}
          />
          <span>{chip.text}</span>
          <span
            role="button"
            className={styles.filterchipclear}
            onClick={chip.onRemove}
          >
            &times;
          </span>
        </div>
      ))}
    </div>
  );
}

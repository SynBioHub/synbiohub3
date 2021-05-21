import {
  categoryheader,
  categoryname,
  categoryselected
} from '../../styles/searchpanel.module.css';

/**
 * This component is used to select what type of search the user wishes to conduct
 * (such as standard, sequence, etc)
 */
export default function SearchTypeSelector(properties) {
  const extraClass =
    properties.selectedType === properties.name ? categoryselected : '';

  return (
    <div
      className={categoryheader}
      onClick={() => properties.setSelectedType(properties.name)}
    >
      <p className={`${categoryname} ${extraClass}`}>{properties.name}</p>
    </div>
  );
}

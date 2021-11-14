import Select from 'react-select';

import styles from '../../../styles/defaulttable.module.css';

export default function TableHeader(properties) {
  return (
    <div
      className={styles.tableheader}
      style={{
        top: `${
          properties.topStickyIncrement ? properties.topStickyIncrement : 0
        }rem`
      }}
    >
      <div className={styles.tableheadertitle}>
        {properties.title}
        {!properties.hideCount ? `(${properties.count})` : ''}
      </div>
      <div className={styles.tableheadernav}>
        {!properties.hideFilter && (
          <div className={styles.sortbycontainer} id={styles.filterresults}>
            <span className={styles.tableheadernavlabel}>FILTER</span>
            <input
              type="text"
              className={`${styles.tableheadernavflex} ${styles.filterinput}`}
              value={properties.filter}
              onChange={event => properties.setFilter(event.target.value)}
            />
          </div>
        )}
        {properties.sortOptions && (
          <div className={styles.sortbycontainer}>
            <span className={styles.tableheadernavlabel}>SORT BY</span>
            <Select
              options={properties.sortOptions}
              className={styles.tableheadernavflex}
              onChange={option => properties.setSortOption(option)}
              menuPortalTarget={document.body}
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              defaultValue={properties.defaultSortOption}
            />
          </div>
        )}
      </div>
    </div>
  );
}

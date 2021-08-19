import Select from 'react-select';

import styles from '../../../styles/defaulttable.module.css';

export default function TableHeader(properties) {
  return (
    <div className={styles.tableheader}>
      <div className={styles.tableheadertitle}>
        {properties.title} ({properties.count})
      </div>
      <div className={styles.tableheadernav}>
        <div className={styles.sortbycontainer} id={styles.filterresults}>
          <span className={styles.tableheadernavlabel}>FILTER</span>
          <input
            type="text"
            className={`${styles.tableheadernavflex} ${styles.filterinput}`}
            value={properties.filter}
            onChange={event => properties.setFilter(event.target.value)}
          />
        </div>
        <div className={styles.sortbycontainer}>
          <span className={styles.tableheadernavlabel}>SORT BY</span>
          <Select
            options={properties.sortOptions}
            className={styles.tableheadernavflex}
            onChange={option => properties.setSortOption(option)}
            menuPortalTarget={document.querySelector('body')}
            defaultValue={properties.defaultSortOption}
          />
        </div>
      </div>
    </div>
  );
}

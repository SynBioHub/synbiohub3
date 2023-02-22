import Select from 'react-select';

import styles from '../../../styles/defaulttable.module.css';

export default function TableHeaderSimple(properties) {
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
        {!properties.hideCount && ':'}
        {!properties.hideCount ? (
          <span className={styles.smallerfont}> {properties.count}</span>
        ) : (
          ''
        )}
      </div>
    </div>
  );
}

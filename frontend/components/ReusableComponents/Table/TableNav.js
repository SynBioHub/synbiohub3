import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Select from 'react-select';

import styles from '../../../styles/defaulttable.module.css';
import { numberDisplayOptions } from './TableConfig';

export default function TableNav(properties) {
  return (
    <div className={styles.tablefooter}>
      <div className={styles.sortbycontainer}>
        <span className={styles.tableheadernavlabel}>SHOW</span>
        <Select
          options={numberDisplayOptions}
          defaultValue={numberDisplayOptions[0]}
          className={styles.tableheadernavflex}
          menuPortalTarget={document.querySelector('body')}
          onChange={option => properties.setNumberEntries(option.value)}
        />
        <span className={styles.tableheadernavlabel}>
          {properties.title.toUpperCase()}
        </span>
      </div>
      <div className={styles.tablefooternav}>
        <div
          className={styles.tablefooternavicon}
          onClick={() =>
            properties.setOffset(
              Math.max(0, properties.offset - properties.numberEntries)
            )
          }
          role="button"
        >
          <FontAwesomeIcon icon={faAngleLeft} size="1x" />
        </div>
        <span className={styles.tablefooternavstart}>1</span>
        <span className={styles.tablefooternavselected}>2</span>
        <span>3</span>
        <p>...</p>
        <span className={styles.tablefooternavend}>16</span>
        <div
          className={styles.tablefooternavicon}
          onClick={() => {
            if (
              properties.offset + properties.numberEntries <
              properties.filteredData.length
            )
              properties.setOffset(
                properties.offset + properties.numberEntries
              );
          }}
          role="button"
        >
          <FontAwesomeIcon icon={faAngleRight} size="1x" />
        </div>
      </div>
    </div>
  );
}

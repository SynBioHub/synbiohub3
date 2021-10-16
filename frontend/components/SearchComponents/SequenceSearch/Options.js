import { faMinusCircle, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import styles from '../../../styles/sequencesearch.module.css';

export default function Options() {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.optionscontainer}>
      <div
        className={styles.optionsbutton}
        role="button"
        onClick={() => setOpen(!open)}
      >
        Options
        <FontAwesomeIcon
          icon={!open ? faPlusCircle : faMinusCircle}
          size="1x"
          color="#00A1E4"
          className={styles.optionsplus}
        />
      </div>
      {open && <div className={styles.optionsmenu}></div>}
    </div>
  );
}

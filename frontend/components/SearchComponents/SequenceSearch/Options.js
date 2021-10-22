import { faMinusCircle, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import Select from 'react-select';

import styles from '../../../styles/sequencesearch.module.css';

export default function Options(properties) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.optionscontainer}>
      <div
        className={styles.optionsbutton}
        role="button"
        onClick={() => setOpen(!open)}
      >
        Search Options
        <FontAwesomeIcon
          icon={!open ? faPlusCircle : faMinusCircle}
          size="1x"
          color="#00A1E4"
          className={styles.optionsplus}
        />
      </div>
      {open && (
        <div className={styles.optionsmenu}>
          <div className={styles.inputsection}>
            <label>Search Method</label>
            <Select
              options={methodOptions}
              defaultValue={methodOptions[0]}
              className={styles.optionselect}
              menuPortalTarget={document.body}
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              onChange={option => properties.setSearchMethod(option.value)}
            />
          </div>
          <div className={styles.inputsection}>
            <label>Number of Results</label>
            <input
              type="text"
              className={styles.filterinput}
              value={properties.numResults}
              onChange={event => properties.setNumResults(event.target.value)}
            />
          </div>
          <div className={styles.inputsection}>
            <label>Minimum Sequence Length</label>
            <input
              type="text"
              className={styles.filterinput}
              value={properties.minSeqLength}
              onChange={event => properties.setMinSeqLength(event.target.value)}
            />
          </div>
          <div className={styles.inputsection}>
            <label>Maximum Sequence Length</label>
            <input
              type="text"
              className={styles.filterinput}
              value={properties.maxSeqLength}
              onChange={event => properties.setMaxSeqLength(event.target.value)}
            />
          </div>
          <div className={styles.inputsection}>
            <label># of Failed Hits Before Stopping</label>
            <input
              type="text"
              className={styles.filterinput}
              value={properties.maxRejects}
              onChange={event => properties.setMaxRejects(event.target.value)}
            />
          </div>
          <div className={styles.inputsection}>
            <label>Percent Match</label>
            <input
              type="text"
              className={styles.filterinput}
              value={properties.percentMatch}
              onChange={event => properties.setPercentMatch(event.target.value)}
            />
          </div>
          <div className={styles.inputsection}>
            <label>Pairwise Identity Function</label>
            <Select
              options={pairwiseIdentityMethod}
              defaultValue={pairwiseIdentityMethod[0]}
              className={styles.optionselect}
              menuPortalTarget={document.body}
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              onChange={option => properties.setPairwiseIdentity(option.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const methodOptions = [
  { value: 'globalsequence', label: 'Global' },
  { value: 'sequence', label: 'Exact' }
];

const pairwiseIdentityMethod = [
  { value: 2, label: 'Default' },
  { value: 0, label: 'CD-HIT Definition' },
  { value: 1, label: 'Edit Distance' },
  { value: 3, label: 'Marine Biological Lab Definition' },
  { value: 4, label: 'BLAST Definition' }
];

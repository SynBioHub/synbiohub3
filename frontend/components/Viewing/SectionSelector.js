import {
  faAlignLeft,
  faAlignRight,
  faCloudDownloadAlt,
  faImage,
  faPlug,
  faStickyNote
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/view.module.css';

export default function SectionSelector() {
  return (
    <div className={styles.pagesections}>
      <h2 className={styles.pagesectionstitle}>Page Sections</h2>
      <SectionHeader title="VisBOL" icon={faImage} />
      <SectionHeader title="Description" icon={faAlignLeft} />
      <SectionHeader title="Sequence Visualization" icon={faPlug} />
      <SectionHeader title="Sequence Annotations" icon={faStickyNote} />
      <SectionHeader title="Other Properties" icon={faAlignRight} />
      <SectionHeader title="Download Options" icon={faCloudDownloadAlt} />
    </div>
  );
}

function SectionHeader(properties) {
  return (
    <div className={styles.sectionheader}>
      <div className={styles.titleandbox}>
        <input type="checkbox" />
        <div className={styles.sectionheadertitle}>{properties.title}</div>
      </div>
      <FontAwesomeIcon
        icon={properties.icon}
        size="1x"
        className={styles.sectionheadericon}
      />
    </div>
  );
}

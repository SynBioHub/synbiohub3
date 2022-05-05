import {
  faAlignLeft,
  faAlignRight,
  faCloudDownloadAlt,
  faDatabase,
  faFile,
  faImage,
  faInfoCircle,
  faStickyNote
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/view.module.css';

export default function SectionSelector(properties) {
  console.log(properties)
  const selectors = headerCreate(properties.pages);
  return (
    <div className={styles.pagesections}>
      <h2 className={styles.pagesectionstitle}>Page Sections</h2>
      {selectors}
    </div>
  );
}

function headerCreate(pages) {
  const headers = pages.map(page => {
    return <SectionHeader title={page} icon={iconSelector(page)} />
  });
  return headers;
}

function iconSelector(page) {
  switch(page) {
    case "Details":
      return faAlignLeft
    case "Other Properties":
      return faAlignRight
    case "Attachments":
      return faFile
    case "Download Options":
      return faCloudDownloadAlt
    case "Sequence Annotations":
      return faStickyNote
    case "Members":
      return faDatabase
    case "VisBOL":
      return faImage
    default:
      return faInfoCircle
  }
}

function SectionHeader(properties) {
  return (
    <a className={styles.sectionheader} href={`#${properties.title}`}>
      <div className={styles.titleandbox}>
        <input type="checkbox" />
        <div className={styles.sectionheadertitle}>{properties.title}</div>
      </div>
      <FontAwesomeIcon
        icon={properties.icon}
        size="1x"
        className={styles.sectionheadericon}
      />
    </a>
  );
}

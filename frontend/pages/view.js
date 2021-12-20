import {
  faAlignLeft,
  faAlignRight,
  faBars,
  faCalendarPlus,
  faCloudDownloadAlt,
  faHardHat,
  faImage,
  faLock,
  faPlug,
  faPuzzlePiece,
  faQuoteRight,
  faRunning,
  faShareSquare,
  faStickyNote,
  faTrashAlt,
  faUserEdit,
  faUserPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import TopLevel from '../components/TopLevel';
import styles from '../styles/view.module.css';

function View() {
  return (
    <div className={styles.container}>
      <div className={styles.sidepanel}>
        <div className={styles.headercontainer}>
          <h2 className={styles.title}>GFP Report</h2>
          <div className={styles.metaicons}>
            <FontAwesomeIcon
              icon={faLock}
              size="1x"
              className={styles.metaicon}
            />
            <FontAwesomeIcon
              icon={faPuzzlePiece}
              size="1x"
              className={styles.metaicon}
            />
          </div>
          <div className={styles.panelbutton}>
            <FontAwesomeIcon icon={faBars} size="1x" />
          </div>
        </div>
        <div className={styles.subheader}>
          <h3 className={styles.id}>BBa_E0240</h3>
          <div className={styles.actionicons}>
            <FontAwesomeIcon
              icon={faShareSquare}
              size="1x"
              className={styles.actionicon}
            />
            <FontAwesomeIcon
              icon={faCloudDownloadAlt}
              size="1x"
              className={styles.actionicon}
            />
            <FontAwesomeIcon
              icon={faQuoteRight}
              size="1x"
              className={styles.actionicon}
            />
            <FontAwesomeIcon
              icon={faUserPlus}
              size="1x"
              className={styles.actionicon}
            />
            <FontAwesomeIcon
              icon={faTrashAlt}
              size="1x"
              className={styles.actionicon}
            />
          </div>
        </div>
        <div className={styles.infocontainer}>
          <Info icon={faHardHat} title="Terminator, Circular" />
          <Info
            icon={faQuoteRight}
            title="http://parts.igem.org/Part:BBa_E0240"
          />
          <Info icon={faUserEdit} title="Jennifer Braff" />
          <Info icon={faCalendarPlus} title="2004-10-17" />
          <Info icon={faRunning} title="https://synbiohub.org/public/igem" />
        </div>
        <div className={styles.pagesections}>
          <h2 className={styles.pagesectionstitle}>Page Sections</h2>
          <SectionHeader title="VisBOL" icon={faImage} />
          <SectionHeader title="Description" icon={faAlignLeft} />
          <SectionHeader title="Sequence Visualization" icon={faPlug} />
          <SectionHeader title="Sequence Annotations" icon={faStickyNote} />
          <SectionHeader title="Other Properties" icon={faAlignRight} />
          <SectionHeader title="Download Options" icon={faCloudDownloadAlt} />
        </div>
      </div>
      <div></div>
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

function Info(properties) {
  return (
    <div className={styles.info}>
      <div className={styles.infoiconcontainer}>
        <FontAwesomeIcon
          icon={properties.icon}
          size="1x"
          className={styles.infoicon}
        />
      </div>
      <div className={styles.infotitle}>{properties.title}</div>
    </div>
  );
}

export default function ViewWrapped() {
  return (
    <TopLevel publicPage={true}>
      <View />
    </TopLevel>
  );
}

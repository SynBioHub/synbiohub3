import {
  faBars,
  faCalendarPlus,
  faHammer,
  faQuoteLeft,
  faRunning,
  faUserEdit
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import styles from '../../styles/view.module.css';
import SectionSelector from './SectionSelector';
import SidePanelTools from './SidePanelTools';

export default function SidePanel(properties) {
  const metadata = properties.metadata;
  const [translation, setTranslation] = useState(0);
  return (
    <div className={translation == 0 ? styles.sidepanelcontaineropen : styles.sidepanelcontainercollapse}>
            <div className={styles.sidepanel} style={{ transform: `translateX(-${translation}rem)`, transition: "transform 0.3s" }}>
      <div className={styles.headercontainer}>
        <h2 className={styles.title}>{metadata.name}</h2>
        <div className={styles.displayId}>({metadata.displayId})</div>
        <div className={styles.panelbutton} onClick={() => {
          translation == 18 ? setTranslation(0) : setTranslation(18);
        }}
        role="button">
          <FontAwesomeIcon icon={faBars} size="1x" />
        </div>
      </div>
      <SidePanelTools 
      type={properties.type}
      displayId={metadata.displayId}
      name={metadata.name}
      url={properties.uri.replace('https://synbiohub.org', '')}
      />
      <div className={styles.infocontainer}>
        <Info
          icon={faQuoteLeft}
          label="Source"
          title={metadata.wasDerivedFrom}
        />
        <Info
          icon={faHammer}
          label="Generated By"
          title={metadata.wasGeneratedBy}
        />
        <Info icon={faUserEdit} label="Creator" title={metadata.creator} />
        <Info
          icon={faCalendarPlus}
          label="Created"
          title={metadata.created.replace('T', ' ').replace('Z', '')}
        />
        <Info
          icon={faRunning}
          label="Persistent Identity"
          title={metadata.persistentIdentity}
        />
      </div>
      <SectionSelector />
    </div>
    </div>
  );
}

function Info(properties) {
  if (!properties.title) {
    return null;
  }
  return (
    <div className={styles.info}>
      <div className={styles.infoheader}>
        <div className={styles.infoiconcontainer}>
          <FontAwesomeIcon
            icon={properties.icon}
            size="1x"
            className={styles.infoicon}
          />
        </div>
        <div className={styles.infolabel}>{properties.label}</div>
      </div>
      <div className={styles.infotitle}>{properties.title}</div>
    </div>
  );
}

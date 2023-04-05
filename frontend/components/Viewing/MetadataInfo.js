import Link from 'next/link';

import styles from '../../styles/view.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import RenderIcon from './PageJSON/Rendering/RenderIcon';

/**
 * Component container for displaying metadata information about the object.
 *
 * @param {Any} properties Information from the parent component.
 */
export default function MetadataInfo({ title, link, label, icon, specific }) {
  //If the metadata doesn't contain the title nothing should be rendered.
  if (!title) return null;

  const renderedSection = (
    <div className={styles.info}>
      <div className={specific ? styles.infogeneric : styles.infoheader}>
        <div className={styles.infoiconcontainer}>
          {!specific ? (
            <FontAwesomeIcon
              icon={icon}
              size="1x"
              className={styles.infoicon}
            />
          ) : (
            <RenderIcon icon={icon} color="#fff" style={styles.infoicon} />
          )}
        </div>
        <div className={styles.infolabel}>{label}</div>
      </div>
      <div className={specific ? styles.infotitlegeneric : styles.infotitle}>
        {title}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link}>
        <a target="_blank">{renderedSection}</a>
      </Link>
    );
  } else return renderedSection;
}

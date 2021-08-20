import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../../styles/admin.module.css';

export default function ActionButton(properties) {
  return (
    <div
      className={styles.actionbutton}
      role="button"
      onClick={() => properties.onClick()}
    >
      <FontAwesomeIcon
        icon={properties.icon}
        size="1x"
        color={properties.color}
      />
      <span>{properties.action}</span>
    </div>
  );
}

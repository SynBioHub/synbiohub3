import { useEffect, useState } from 'react';

import styles from '../../styles/admin.module.css';
import Graphs from './Graphs';
import Mail from './Mail';
import Plugins from './Plugins';
import Status from './Status';

export default function Content(properties) {
  const [content, setContent] = useState(properties.selected);

  useEffect(() => {
    switch (properties.selected) {
      case 'status':
        setContent(<Status />);
        break;
      case 'graphs':
        setContent(<Graphs />);
        break;
      case 'mail':
        setContent(<Mail />);
        break;
      case 'plugins':
        setContent(<Plugins />);
        break;
      default:
        setContent(<Status />);
        break;
    }
  }, [properties.selected]);

  return <div className={styles.content}>{content}</div>;
}

import { useEffect, useState } from 'react';

import styles from '../../styles/admin.module.css';
import Graphs from './Graphs';
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
      default:
        setContent(<Status />);
        break;
    }
  }, [properties.selected]);

  return <div className={styles.content}>{content}</div>;
}

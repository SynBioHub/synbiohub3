import { useEffect, useState } from 'react';

import styles from '../../styles/admin.module.css';
import Graphs from './Graphs';
import Log from './Log';
import Mail from './Mail';
import Plugins from './Plugins';
import Registries from './Registries';
import Sparql from './Sparql';
import Status from './Status';
import Users from './Users';

export default function Content(properties) {
  const [content, setContent] = useState(properties.selected);

  useEffect(() => {
    switch (properties.selected) {
      case 'graphs':
        setContent(<Graphs />);
        break;
      case 'mail':
        setContent(<Mail />);
        break;
      case 'plugins':
        setContent(<Plugins />);
        break;
      case 'users':
        setContent(<Users />);
        break;
      case 'registries':
        setContent(<Registries />);
        break;
      case 'sparql':
        setContent(<Sparql />);
        break;
      case 'log':
        setContent(<Log />);
        break;
      default:
        setContent(<Status />);
        break;
    }
  }, [properties.selected]);

  return <div className={styles.content}>{content}</div>;
}

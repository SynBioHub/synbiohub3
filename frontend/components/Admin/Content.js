import { useEffect, useState } from 'react';

import styles from '../../styles/admin.module.css';
import Graphs from './Graphs';
import Log from './Log';
import Mail from './Mail';
import Plugins from './Plugins';
import Registries from './Registries';
import Remotes from './Remotes';
import Sparql from './Sparql';
import Status from './Status';
import Theme from './Theme';
import Users from './Users';
import Explorer from './Explorer';

export default function Content(properties) {
  const [content, setContent] = useState(properties.selected);
  console.log("test: ", properties.selected)
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
      case 'remotes':
          setContent(<Remotes />);
          break;
      case 'sparql':
        setContent(<Sparql />);
        break;
      case 'log':
        setContent(<Log />);
        break;
      case 'theme':
        setContent(<Theme />);
        break;
      case 'explorer':
        setContent(<Explorer />);
        break;
      default:
        setContent(<Status />);
        break;
    }
  }, [properties.selected]);

  return <div className={styles.content}>{content}</div>;
}

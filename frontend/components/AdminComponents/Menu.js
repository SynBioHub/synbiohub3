import { faPagelines } from '@fortawesome/free-brands-svg-icons';
import {
  faDatabase,
  faEnvelope,
  faFileAlt,
  faGamepad,
  faInfoCircle,
  faPalette,
  faPlug,
  faProjectDiagram,
  faSearch,
  faUsers
} from '@fortawesome/free-solid-svg-icons';

import styles from '../../styles/admin.module.css';
import MenuSelector from './MenuSelector';
export default function Menu(properties) {
  return (
    <div className={styles.menucontainer}>
      <MenuSelector
        name="Status"
        selected={properties.selected}
        route="status"
        icon={faInfoCircle}
      />
      <MenuSelector
        name="Graphs"
        selected={properties.selected}
        route="graphs"
        icon={faProjectDiagram}
      />
      <MenuSelector
        name="Log"
        selected={properties.selected}
        route="log"
        icon={faFileAlt}
      />
      <MenuSelector
        name="Mail"
        selected={properties.selected}
        route="mail"
        icon={faEnvelope}
      />
      <MenuSelector
        name="Plugins"
        selected={properties.selected}
        route="plugins"
        icon={faPlug}
      />
      <MenuSelector
        name="Registries"
        selected={properties.selected}
        route="registries"
        icon={faPagelines}
      />
      <MenuSelector
        name="Remotes"
        selected={properties.selected}
        route="remotes"
        icon={faGamepad}
      />
      <MenuSelector
        name="SBOLExplorer"
        selected={properties.selected}
        route="explorer"
        icon={faSearch}
      />
      <MenuSelector
        name="SPARQL"
        selected={properties.selected}
        route="sparql"
        icon={faDatabase}
      />
      <MenuSelector
        name="Theme"
        selected={properties.selected}
        route="theme"
        icon={faPalette}
      />
      <MenuSelector
        name="Users"
        selected={properties.selected}
        route="users"
        icon={faUsers}
      />
    </div>
  );
}

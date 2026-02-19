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
  const theme = JSON.parse(localStorage.getItem('theme')) || {};
  return (
    <div className={styles.menucontainer}>
      <MenuSelector
        themeColor={theme?.themeParameters?.[0]?.value}
        name="Status"
        selected={properties.selected}
        route="status"
        icon={faInfoCircle}
      />
      <MenuSelector
        themeColor={theme?.themeParameters?.[0]?.value}
        name="Graphs"
        selected={properties.selected}
        route="graphs"
        icon={faProjectDiagram}
      />
      <MenuSelector
        themeColor={theme?.themeParameters?.[0]?.value}
        name="Log"
        selected={properties.selected}
        route="log"
        icon={faFileAlt}
      />
      <MenuSelector
        themeColor={theme?.themeParameters?.[0]?.value}
        name="Mail"
        selected={properties.selected}
        route="mail"
        icon={faEnvelope}
      />
      <MenuSelector
        themeColor={theme?.themeParameters?.[0]?.value}
        name="Plugins"
        selected={properties.selected}
        route="plugins"
        icon={faPlug}
      />
      <MenuSelector
        themeColor={theme?.themeParameters?.[0]?.value}
        name="Registries"
        selected={properties.selected}
        route="registries"
        icon={faPagelines}
      />
      {/* <MenuSelector
        themeColor={theme?.themeParameters?.[0]?.value}
        name="Remotes"
        selected={properties.selected}
        route="remotes"
        icon={faGamepad}
      /> */}
      <MenuSelector
        themeColor={theme?.themeParameters?.[0]?.value}
        name="SBOLExplorer"
        selected={properties.selected}
        route="explorer"
        icon={faSearch}
      />
      <MenuSelector
        themeColor={theme?.themeParameters?.[0]?.value}
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
        themeColor={theme?.themeParameters?.[0]?.value}
      />
      <MenuSelector
        themeColor={theme?.themeParameters?.[0]?.value}
        name="Users"
        selected={properties.selected}
        route="users"
        icon={faUsers}
      />
    </div>
  );
}

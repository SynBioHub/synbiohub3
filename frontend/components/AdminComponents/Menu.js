import styles from '../../styles/admin.module.css';
import MenuSelector from './MenuSelector';
export default function Menu(properties) {
  return (
    <div className={styles.menucontainer}>
      <MenuSelector
        name="Status"
        selected={properties.selected}
        route="status"
      />
      <MenuSelector
        name="Graphs"
        selected={properties.selected}
        route="graphs"
      />
      <MenuSelector name="Log" selected={properties.selected} route="log" />
      <MenuSelector name="Mail" selected={properties.selected} route="mail" />
      <MenuSelector
        name="Plugins"
        selected={properties.selected}
        route="plugins"
      />
      <MenuSelector
        name="Registries"
        selected={properties.selected}
        route="registries"
      />
      <MenuSelector
        name="Remotes"
        selected={properties.selected}
        route="remotes"
      />
      <MenuSelector
        name="SBOLExplorer"
        selected={properties.selected}
        route="explorer"
      />
      <MenuSelector
        name="SPARQL"
        selected={properties.selected}
        route="sparql"
      />
      <MenuSelector name="Theme" selected={properties.selected} route="theme" />
      <MenuSelector name="Users" selected={properties.selected} route="users" />
    </div>
  );
}

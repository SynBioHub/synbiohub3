import styles from '../../styles/admin.module.css';
import MenuSelector from './MenuSelector';
export default function Menu() {
  return (
    <div className={styles.menucontainer}>
      <MenuSelector name="Status" />
      <MenuSelector name="Graphs" />
      <MenuSelector name="Log" />
      <MenuSelector name="Mail" />
      <MenuSelector name="Plugins" />
      <MenuSelector name="Registries" />
      <MenuSelector name="Remotes" />
      <MenuSelector name="SBOLExplorer" />
      <MenuSelector name="SPARQL" />
      <MenuSelector name="Theme" />
      <MenuSelector name="Users" />
    </div>
  );
}

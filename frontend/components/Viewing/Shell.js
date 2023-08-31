import styles from '../../styles/view.module.css';
import Plugin from './Plugin';
import SidePanel from './SidePanel';
import ViewHeader from './ViewHeader';

import GenericContent from './PageJSON/Rendering/GenericContent';
import MasterJSON from './PageJSON/MasterJSON';

export default function Shell(properties) {
  const plugins = properties.plugins;
  const metadata = properties.metadata;

  const json = MasterJSON[properties.metadata.type];

  if (metadata && !metadata.name && metadata.displayId)
    metadata.name = metadata.displayId;

  if (!json) {
    return (
      <div className={styles.container}>
        <SidePanel
          metadata={metadata}
          type={properties.type}
          uri={properties.uri}
        />
        <div className={styles.content}>
          <ViewHeader
            name={metadata.name}
            displayId={metadata.displayId}
            description={metadata.description}
            type={metadata.type}
          />
          <div className={styles.sections}>
            <div>
              No structure defined for type "{properties.metadata.type}"
            </div>
            <Plugins plugins={plugins} type={properties.type} />
          </div>
        </div>
        <div></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <SidePanel
        metadata={metadata}
        type={properties.type}
        uri={properties.uri}
        json={json}
      />
      <div className={styles.content}>
        <ViewHeader
          name={metadata.name}
          displayId={metadata.displayId}
          description={metadata.description}
          type={metadata.type}
        />
        <div className={styles.sections}>
          <GenericContent json={json} uri={properties.uri} />
          <Plugins plugins={plugins} type={properties.type} />
        </div>
      </div>
      <div></div>
    </div>
  );
}

function Plugins(properties) {
  const plugins = properties.plugins.rendering.map(plugin => {
    return <Plugin plugin={plugin} type={properties.type} key={plugin.index} />;
  });

  return <div>{plugins}</div>;
}

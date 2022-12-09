import styles from '../../styles/view.module.css';
import Plugin from './Plugin';
import SidePanel from './SidePanel';
import ViewHeader from './ViewHeader';

import GenericContent from './PageJSON/GenericContent';
import { useState } from 'react';
import MasterJSON from './PageJSON/Master';

export default function Shell(properties) {
  const [refreshMembers, setRefreshMembers] = useState(false);
  const plugins = properties.plugins;
  const metadata = properties.metadata;

  const json = MasterJSON[properties.metadata.type];
  const pagesInfo = getPagesInfo(properties.type, json.pages);

  return (
    <div className={styles.container}>
      <SidePanel
        metadata={metadata}
        type={properties.type}
        uri={properties.uri}
        pagesInfo={pagesInfo}
      />
      <div className={styles.content}>
        <ViewHeader
          name={metadata.name}
          displayId={metadata.displayId}
          description={metadata.description}
          type={properties.type}
        />
        <div className={styles.sections}>
          <GenericContent
            json={json}
            uri={properties.uri}
            refreshMembers={refreshMembers}
            setRefreshMembers={setRefreshMembers}
          />
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

function getPagesInfo(type, pages) {
  if (localStorage.getItem(type) === null) return { type: type, order: pages };

  return { type: type, order: JSON.parse(localStorage.getItem(type)).order };
}

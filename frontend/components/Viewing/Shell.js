import styles from '../../styles/view.module.css';
import Plugin from './Plugin';
import SidePanel from './SidePanel';
import ViewHeader from './ViewHeader';

import componentJSON from "./TypeContents/Component.json";
import collectionJSON from "./TypeContents/Collection.json";

import GenericContent from './TypeContents/GenericContent';

export default function Shell(properties) {
  const plugins = properties.plugins;
  const metadata = properties.metadata;

  const content = getContent(properties.type, properties.uri);
  const pagesInfo = getPages(properties.type);

  return (
    <div className={styles.container}>
      <SidePanel metadata={metadata} type={properties.type} uri={properties.uri} pagesInfo={pagesInfo} />
      <div className={styles.content}>
        <ViewHeader
          name={metadata.name}
          displayId={metadata.displayId}
          description={metadata.description}
          type={properties.type}
        />
        <div className={styles.sections}>
          {content}
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

function getContent(type, uri) {
  return type ? <GenericContent type = {type} uri={uri} /> : undefined;
}

function getPages(type) {
  const componentPages = componentJSON.pages;
  const collectionPages = collectionJSON.pages;

  switch (type) {
    case 'Collection':
      return getOrder('Collection', collectionPages);
    case 'ComponentDefinition':

    case 'Component':
      return getOrder('Component', componentPages);
    default:
      return getOrder('Unknown', []);
  }
}

function getOrder(type, pages) {
  if (localStorage.getItem(type) === null) return { type: type, order: pages };

  return { type: type, order: JSON.parse(localStorage.getItem(type)).order };
}
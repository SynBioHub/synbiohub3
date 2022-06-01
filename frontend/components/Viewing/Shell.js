import styles from '../../styles/view.module.css';
import { CollectionContent, collectionPages } from './TypeContents/CollectionContent';
import Plugin from './Plugin';
import SidePanel from './SidePanel';
import ViewHeader from './ViewHeader';
import { ComponentContent, componentPages } from './TypeContents/ComponentContent';

export default function Shell(properties) {
  const plugins = properties.plugins;
  const metadata = properties.metadata;

  const content = getContent(properties.type, properties.uri);
  const pages = getPages(properties.type);

  return (
    <div className={styles.container}>
      <SidePanel metadata={metadata} type={properties.type} uri={properties.uri} pagesInfo={pages} />
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
  switch (type) {
    case 'Collection':
      return <CollectionContent uri={uri} />
    case 'ComponentDefinition':
    case 'Component':
      return <ComponentContent uri={uri} />
    default:
      return undefined;
  }
}

function getPages(type) {
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
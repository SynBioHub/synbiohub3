import styles from '../../styles/view.module.css';
import Members from './Collection/Members';
import Plugin from './Plugin';
import Details from './Sections/Details';
import Section from './Sections/Section';
import SidePanel from './SidePanel';
import ViewHeader from './ViewHeader';

export default function Shell(properties) {
  const plugins = properties.plugins;
  const metadata = properties.metadata;

  return (
    <div className={styles.container}>
      <SidePanel metadata={metadata} type={properties.type} uri={properties.uri} />
      <div className={styles.content}>
        <ViewHeader
          name={metadata.name}
          displayId={metadata.displayId}
          description={metadata.description}
          type={properties.type}
        />
        <div className={styles.sections}>
          {properties.type === 'Collection' && <Members uri={properties.uri} />}
          <Section title="Details">
            <Details uri={properties.uri} />
          </Section>
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

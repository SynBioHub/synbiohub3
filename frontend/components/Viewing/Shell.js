import styles from '../../styles/view.module.css';
import SidePanel from './SidePanel';
import ViewHeader from './ViewHeader';

import GenericContent from './PageJSON/Rendering/GenericContent';
import MasterJSON from './PageJSON/MasterJSON';

import sequenceOntology from '../../namespace/sequence-ontology';
import systemsBiologyOntology from '../../namespace/systems-biology-ontology';
import edamOntology from '../../namespace/edam-ontology';

export default function Shell(properties) {
  const plugins = properties.plugins;
  const metadata = properties.metadata;

  const json = MasterJSON[properties.metadata.types];

  if (metadata && !metadata.name && metadata.displayId)
    metadata.name = metadata.displayId;

  let getSearchData = getSearch(formatMultipleTitles(metadata.types)[0]);
  metadata.search = getSearchData;

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
            type={metadata.types}
            uri={metadata.persistentIdentity}
          />
          <div className={styles.sections}>
            <div>
              No structure defined for type "{properties.metadata.types}"
            </div>
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
        plugins={plugins}
      />
      <div className={styles.content}>
        <ViewHeader
          name={metadata.name}
          displayId={metadata.displayId}
          description={metadata.description}
          type={metadata.types}
          uri={`${metadata.persistentIdentity}/${metadata.version}`}
          search={metadata.search}
        />
        <div className={styles.sections}>
          <GenericContent json={json} uri={properties.uri} metadata={false} plugins={plugins} type={properties.type} />
        </div>
      </div>
      <div></div>
    </div>
  );
}

export function isUriOwner(uri, currentUserUsername) {
  // Split the URI and check if the segment after the domain is '/user'
  const parts = uri.split('/');
  if (parts.length > 3 && parts[3] === 'user') {
    // Call helper function to check if the next segment matches the current user's username
    return isUserOwner(parts[4], currentUserUsername);
  }
  return false;
}

function isUserOwner(uriUsername, currentUserUsername) {
  // Compare the username part of the URI with the current user's username
  return uriUsername === currentUserUsername;
}

function formatTitle(title) {
  let link;
  const parts = title.split('/');
  if (parts.length >= 2 && title.startsWith('http')) {
    const lastPart = parts[parts.length - 1];
    link = title;
    if (/^1(\.0+)*$/.test(lastPart)) {
      title = parts[parts.length - 2];
    } else {
      const delimiters = ['#', '%', '/'];
      const lastPartSegments = lastPart.split(new RegExp(`[${delimiters.join('')}]`));

      title = lastPartSegments.pop();
    }
  }
  if (/SO:\s*(\d{7})/.test(title)) {
    for (let key in sequenceOntology) {
      if (title === key) {
        title = sequenceOntology[key].name;
        break;
      }
    }
  }
  if (/SBO:\s*(\d{7})/.test(title)) {
    for (let key in systemsBiologyOntology) {
      if (title === key) {
        title = systemsBiologyOntology[key].name;
        break;
      }
    }
  }
  if (/http:\/\/edamontology\.org\/format_\d{4}/.test(title)) {
    for (let key in edamOntology) {
      if (title === key) {
        title = edamOntology[key];
      }
    }
  }

  return [title, link];
}

export function formatMultipleTitles(titles) {
  // Split the titles string into an array of individual titles
  const titleArray = titles.split(',');

  // Process each title independently and also collect their links
  const processedTitles = titleArray.map((singleTitle) => {
    const [formattedTitle, link] = formatTitle(singleTitle.trim());
    return { title: formattedTitle, link };
  });

  // Join the processed titles back into a single string, separated by commas
  const formattedTitlesString = processedTitles.map(item => item.title).join(", ");
  const linksArray = processedTitles.map(item => item.link);

  // If you need to do something with linksArray, you can use it here

  return [formattedTitlesString, linksArray];
}


function getSearch(type) {
  // list the top levels
  const toplevel = ["Activity", "Agent", "Association", "Attachment", "Collection", "CombinatorialDerivation", "Component", "Datasheet", "Experiment", "FunctionalComponent", "Implementation", "Model", "ModuleDefinition", "Plan", "Sequence", "Usage"]
  //return tru"e,false based on type
  if (type === "ComponentDefinition") {
    return {
      twins: true,
      similar: true,
      uses: true
    };
  }
  //if top level
  if (toplevel.includes(type)) {
    return {
      twins: false,
      similar: false,
      uses: true
    };
  }
  else {
    return {
      twins: false,
      similar: false,
      uses: false
    };
  }
}

export function isValidURI(uri) {
  console.log(uri);
  const pattern = /^(https?|ftp|file):\/\/([A-Za-z0-9.-]+)(:[0-9]+)?(\/[A-Za-z0-9._:-]+)*(\/)?(\?[^\s#]*)?(#[^\s]*)?$/i;
  return pattern.test(uri);
}

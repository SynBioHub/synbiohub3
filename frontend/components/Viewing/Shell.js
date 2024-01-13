import styles from '../../styles/view.module.css';
import SidePanel from './SidePanel';
import ViewHeader from './ViewHeader';

import GenericContent from './PageJSON/Rendering/GenericContent';
import MasterJSON from './PageJSON/MasterJSON';

// import { BooleanContext, checkContentExist } from './PageJSON/Rendering/TableBuilder';
// import Section from './Sections/Section'
// import TableBuilder from './PageJSON/Rendering/TableBuilder';

// import executeQueryFromTableJSON from './PageJSON/Fetching/executeQueryFromTableJSON';
// import parseQueryResult from './PageJSON/Fetching/parseQueryResult';

// import { useState, useEffect } from 'react';
// import { useDispatch } from 'react-redux';

export default function Shell(properties) {
  console.log(properties);
  const plugins = properties.plugins;
  const metadata = properties.metadata;

  const json = MasterJSON[properties.metadata.types];

  // const [content, setContent] = useState();

  // const dispatch = useDispatch();
  // useEffect(() => {
  //   executeQueryFromTableJSON(dispatch, properties.uri, json.prefixes, json.table).then(response => {
  //     setContent(parseQueryResult(json.table, response, json.prefixes));
  //   });
  // }, [properties.uri, json.prefixes, json.table]);

  // const isContentExist = checkContentExist(content);
  // console.log(content);

  // console.log(isContentExist);

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

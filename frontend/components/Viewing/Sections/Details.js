import { useEffect, useState } from 'react';

import getDetails from '../../../sparql/getDetails';
import getQueryResponse from '../../../sparql/tools/getQueryResponse';
import styles from '../../../styles/view.module.css';
import Loading from '../../Reusable/Loading';

export default function Details(properties) {
  const [details, setDetails] = useState();

  useEffect(() => {
    if (details == undefined)
      getQueryResponse(getDetails, { uri: properties.uri }).then(details => {
        if (details.length > 0) setDetails(details[0]);
      });
  }, [details]);

  if (!details) return <Loading />;

  return (
    <div>
      <div>
        {details.mutableDescription && (
          <Section title="Description" text={details.mutableDescription} />
        )}
        {details.mutableNotes && (
          <Section title="Notes" text={details.mutableNotes} />
        )}
        {details.mutableProvenance && (
          <Section title="Source" text={details.mutableProvenance} />
        )}
      </div>
    </div>
  );
}

function Section(properties) {
  return (
    <div>
      <h4 className={styles.detailsheader}>{properties.title}</h4>
      <p className={styles.detailstext}>{properties.text}</p>
    </div>
  );
}

import axios from 'axios';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
const { publicRuntimeConfig } = getConfig();

import Loading from '../components/Reusable/Loading';
import TopLevel from '../components/TopLevel';
import Shell from '../components/Viewing/Shell';
import getMetadata from '../sparql/getMetadata';
import getQueryResponse from '../sparql/tools/getQueryResponse';

export default function View({ data }) {
  const router = useRouter();
  const { view } = router.query;
  const token = useSelector(state => state.user.token);
  const url = view ? view.join('/') : '';
  const [metadata, setMetadata] = useState();

  const uri = `https://synbiohub.org/${url}`;

  useEffect(() => {
    if (!metadata)
      getQueryResponse(getMetadata, { uri: uri }, token).then(metadata =>
        setMetadata(metadata)
      );
  }, [metadata, token]);

  // validate part
  if (!url || !metadata)
    return (
      <TopLevel publicPage={true}>
        <Loading />
      </TopLevel>
    );
  else if (metadata.length === 0)
    return (
      <TopLevel publicPage={true}>
        <div>Page not found</div>
      </TopLevel>
    );

  return (
    <TopLevel publicPage={true}>
      <Shell
        plugins={data}
        metadata={metadata[0]}
        type={getType(metadata[0].type)}
        uri={uri}
      />
    </TopLevel>
  );
}

// eslint-disable-next-line unicorn/prevent-abbreviations
export async function getServerSideProps() {
  // Fetch data from external API
  const response = await axios.get(
    `${publicRuntimeConfig.backend}/admin/plugins`,
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain'
      }
    }
  );

  const data = response.data;
  // Pass data to the page via props
  return { props: { data } };
}

const getType = type => {
  return type.replace('http://sbols.org/v2#', '');
};

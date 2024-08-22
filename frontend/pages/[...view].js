import axios from 'axios';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
const { publicRuntimeConfig } = getConfig();

import Loading from '../components/Reusable/Loading';
import TopLevel from '../components/TopLevel';
import Shell from '../components/Viewing/Shell';
import getMetadata from '../sparql/getMetadata';
import getQueryResponse from '../sparql/tools/getQueryResponse';
import { addError } from '../redux/actions';
import LinkedSearch from '../components/Search/StandardSearch/LinkedSearch';


export default function View({ data, error }) {
  const dispatch = useDispatch();
  if (error) {
    dispatch(addError(error));
  }
  const router = useRouter();
  const { view } = router.query;
  const token = useSelector(state => state.user.token);
  const url = view ? view.join('/') : '';
  const [metadata, setMetadata] = useState();
  const theme = JSON.parse(localStorage.getItem('theme')) || {};
  const [urlExists, setUrlExists] = useState(true); // New state for URL existence
  const backenduri = `${publicRuntimeConfig.backend}/${url}`;

  if (url.endsWith('/twins')) {
    const searchUrl = `${publicRuntimeConfig.backend}/${url}`;
    return (
      <LinkedSearch
        url={searchUrl}
        uri={url}
      />
    )
  }
  if (url.endsWith('/uses')) {
    const searchUrl = `${publicRuntimeConfig.backend}/${url}`;
    return (
      <LinkedSearch
        url={searchUrl}
        uri={url}
      />
    )
  }
  if (url.endsWith('/similar')) {
    const searchUrl = `${publicRuntimeConfig.backend}/${url}`;
    return (
      <LinkedSearch
        url={searchUrl}
        uri={url}
      />
    )
  }

  const centerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh', // This makes sure it takes the full viewport height
    marginTop: '-10vh',
  };

  let uri;
  // let uri = `https://dan.org/${url}`;
  if (theme) {
    uri = `${theme.uriPrefix}${url}`;
  }
  

  useEffect(() => {
    // Check if URL exists
    axios.get(backenduri)
      .then(response => {
        // URL exists
        setUrlExists(true);
        if (!metadata && uri)
          getQueryResponse(dispatch, getMetadata, { uri: uri }, token).then(
            metadata => setMetadata(metadata)
          );
      })
      .catch(error => {
        // URL does not exist
        setUrlExists(false);
      });
  }, [uri, metadata, token]);

  console.log(metadata);

  // Render based on URL existence
  if (!url || !urlExists) {
    return (
      <TopLevel publicPage={true}>
        <div style={centerStyle}>
          { /* Logo Here */}
          <img src="images/widevibe.gif" alt="Logo" style={{ marginBottom: '20px' }} />

          { /* Page Not Found Message */}
          <div>
            <h1>Page Not Found</h1>
            <p>The requested URL {url && <code>{`/${url}`}</code>} was not found on this server.</p>
          </div>
        </div>
      </TopLevel>
    );
  } else if (!metadata) {
    return (
      <TopLevel publicPage={true}>
        <Loading />
      </TopLevel>
    );
  } else if (metadata.length === 0) {
    return (
      <TopLevel publicPage={true}>
        <div>Page not found</div>
      </TopLevel>
    );
  }

  return (
    <TopLevel publicPage={true}>
      <Shell
        plugins={data}
        metadata={metadata[0]}
        type={getType(metadata[0].types)}
        uri={uri}
      />
    </TopLevel>
  );
}

// eslint-disable-next-line unicorn/prevent-abbreviations
export async function getServerSideProps() {
  // Fetch data from external API
  try {
    const response = await axios.get(
      `${publicRuntimeConfig.backendSS}/admin/plugins`,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    );

    const data = response.data;
    // Pass data to the page via props
    return { props: { data } };
  } catch (error) {
    return {
      props: {
        error: {
          customMessage:
            'Request and/or processing failed for GET /admin/plugins',
          fullUrl: `${publicRuntimeConfig.backendSS}/admin/plugins`,
          message: error.message,
          name: 'Server side error',
          stack: error.stack
        },
        data: []
      }
    };
  }
}

const getType = type => {
  if (type) {
    return type.replace('http://sbols.org/v2#', '');
  }
  return type;
};

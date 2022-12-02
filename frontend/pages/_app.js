import '../styles/globals.css';
import '@fortawesome/fontawesome-svg-core/styles.css';

import { config } from '@fortawesome/fontawesome-svg-core';
import { Provider } from 'react-redux';
import router, { useRouter } from 'next/router';
import { useStore } from '../redux/store';
config.autoAddCss = false; // Tell Font Awesome to skip adding the CSS automatically since it's being imported above

import App from 'next/app';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import { ToastContainer } from 'react-toastify';
import axios from 'axios';
import { useState } from 'react';
import Loading from '../components/Reusable/Loading';
import Setup from './setup';

/**
 * This component is the starting component for the sbh app. Uses Provider
 * from react-redux so that entire app can access redux state
 */
function MyApp({ Component, pageProps }) {
  const store = useStore(pageProps.initialReduxState);
  const [isInitializing, setIsInitializing] = useState(true);
  const [inSetupMode, setInSetupMode] = useState(false);
  const router = useRouter();

  try {
    axios
      .get(`${publicRuntimeConfig.backend}/admin/theme`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/plain'
        }
      })
      .then(response => {
        if (response.data.firstLaunch) {
          setInSetupMode(true);
        } else {
          setInSetupMode(false);
        }
        setIsInitializing(false);
      });
  } catch (error) {
    console.log(error);
  }

  /* eslint no-console: "off" */

  if (isInitializing) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <Loading />
      </div>
    );
  }

  return (
    <Provider store={store}>
      {inSetupMode ? (
        <Setup />
      ) : (
        <Component {...pageProps} key={router.asPath} />
      )}
      <ToastContainer />
    </Provider>
  );
}

MyApp.getInitialProps = async appContext => {
  // calls page's `getInitialProps` and fills `appProps.pageProps`
  const appProperties = await App.getInitialProps(appContext);

  return { ...appProperties };
};

export default MyApp;

import '../styles/globals.css';
import '@fortawesome/fontawesome-svg-core/styles.css';

import { config } from '@fortawesome/fontawesome-svg-core';
import { Provider } from 'react-redux';

import { useStore } from '../redux/store';
config.autoAddCss = false; // Tell Font Awesome to skip adding the CSS automatically since it's being imported above

import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();

import App from 'next/app';

/**
 * This component is the starting component for the sbh app. Uses Provider
 * from react-redux so that entire app can access redux state
 */
function MyApp({ Component, pageProps }) {
  const store = useStore(pageProps.initialReduxState);

  /* eslint no-console: "off" */
  console.log(publicRuntimeConfig.backend);
  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}

MyApp.getInitialProps = async appContext => {
  // calls page's `getInitialProps` and fills `appProps.pageProps`
  const appProperties = await App.getInitialProps(appContext);

  return { ...appProperties };
};

export default MyApp;

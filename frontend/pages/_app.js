import '../styles/globals.css';

import { config } from '@fortawesome/fontawesome-svg-core';
import { Provider } from 'react-redux';

import { useStore } from '../redux/store';

config.autoAddCss = false;

/**
 * This component is the starting component for the sbh app. Uses Provider
 * from react-redux so that entire app can access redux state
 */
function MyApp({ Component, pageProps }) {
  const store = useStore(pageProps.initialReduxState);

  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}

export default MyApp;

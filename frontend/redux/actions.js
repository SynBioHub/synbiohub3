import * as types from './types';
/*
This file contains redux action functions for sbh. These are used to update
the redux state that sbh uses to render its individual React components. The actions
use Redux 'dispatches' to call upon the redux reducers (see reducers.js) to update the
redux state.
*/

// USER ACTIONS

/**
 * This action logs the user into sbh and updates the stored
 * username, usertoken, and login status
 * @param {String} username - the username/email of the user
 * @param {String} password - the password of the user
 * @returns
 */
export const login = (username, password) => async dispatch => {
  const url = `${process.env.backendUrl}/login`;
  const headers = {
    Accept: 'text/plain'
  };

  const parameters = new URLSearchParams();
  parameters.append('email', username);
  parameters.append('password', password);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: parameters
  });
  const message = await response.text();
  if (response.status === 200) {
    dispatch({
      type: types.LOGIN,
      payload: {
        username,
        token: message
      }
    });
    localStorage.setItem('userToken', message); // save the token of the user locally, change to cookie later
    localStorage.setItem('username', username); // save the username of the user locally, change to cookie later
  } else {
    dispatch({
      type: types.LOGINERROR,
      payload: message
    });
  }
};

/**
 * This action takes in a username and token and restores
 * the app state to show that the user is logged in
 * @param {string} username
 * @param {string} token
 * @returns
 */
export const restoreLogin = (username, token) => dispatch => {
  dispatch({
    type: types.LOGIN,
    payload: {
      username,
      token
    }
  });
};

/**
 * This action adjusts app state to sign the user out of
 * the session they are in
 * @returns
 */
export const logoutUser = () => dispatch => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('username');
  dispatch({ type: types.LOGOUT });
};

// SEARCHING ACTIONS

/**
 * This action sets the search query that is used to get search results
 * @param {String} query - the new search query to be used
 */
export const setSearchQuery = query => dispatch => {
  dispatch({
    type: types.QUERY,
    payload: query
  });
};

/**
 * This action sets the number by which search results should be offset
 * @param {Number} newOffset - the new number by which search results should be offset
 */
export const setOffset = newOffset => dispatch => {
  dispatch({
    type: types.OFFSET,
    payload: newOffset
  });
};

export const setLimit = newLimit => dispatch => {
  dispatch({
    type: types.LIMIT,
    payload: newLimit
  });
};

// SUBMIT ACTIONS

export const submit =
  (id, version, name, description, citations) => async (dispatch, getState) => {
    dispatch({
      type: types.SUBMITRESET,
      payload: true // sets submitting state to true
    });

    const url = `${process.env.backendUrl}/submit`;
    var headers = {
      Accept: 'text/plain; charset=UTF-8',
      'X-authorization': getState().user.token
    };

    const form = new FormData();
    form.append('id', id);
    form.append('version', version);
    form.append('name', name);
    form.append('description', description);
    form.append('citations', citations);
    form.append('overwrite_merge', '0');

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: form
    });

    if (response.status === 200) {
      dispatch({
        type: types.WASSUBMITSUCCESS,
        payload: {
          submitSuccess: true,
          errorMessages: []
        }
      });
    } else {
      const messages = await response.json();
      dispatch({
        type: types.WASSUBMITSUCCESS,
        payload: {
          submitSuccess: false,
          errorMessages: messages
        }
      });
    }
  };

// BASKET ACTIONS

/**
 * This action adds objects to the Basket that is located in the Search Panel in sbh
 * @param {Array} uriArray - the objects that will be stored in the Basket
 */
export const addToBasket = uriArray => dispatch => {
  dispatch({
    type: types.ADDTOBASKET,
    payload: uriArray
  });
};

// TRACKING ACTIONS

/**
 * This action marks that the user has visited a page in sbh
 * @param {Boolean} pageVisited
 */
export const markPageVisited = pageVisited => dispatch => {
  dispatch({
    type: types.TRACKPAGEVISIT,
    payload: pageVisited
  });
};

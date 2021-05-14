import axios from 'axios';
import * as types from './types';
import qs from 'qs';
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
export const login = (username, password) => (dispatch) => {
  var url ='http://localhost:7777/login';
  var headers = {
      "Accept": "text/plain",
  }

  const params = new URLSearchParams();
  params.append('email', username);
  params.append('password', password);

  fetch(url, { method: 'POST', headers: headers, body: params})
      .then(res => res.text())
      .then(token => {
        dispatch({
          type: types.USERTOKEN,
          payload: token,
        });
        dispatch({
          type: types.USERNAME,
          payload: username,
        });
        dispatch({
          type: types.LOGGEDIN,
          payload: true,
        });
      });
  /*
  axios({
    method: 'post',
    url: `${process.env.backendUrl}/login`,
    data: qs.stringify({
      email: username,
      password: password
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      Accept: 'text/plain'
    }
  }).then((res) => {
    dispatch({
      type: types.USERTOKEN,
      payload: res.data,
    });
    dispatch({
      type: types.USERNAME,
      payload: username,
    });
    dispatch({
      type: types.LOGGEDIN,
      payload: true,
    });
  })
  */
};

/*
  axios.post(`${process.env.backendUrl}/login`, {
    
    
  }).then((res) => {
    dispatch({
      type: types.USERTOKEN,
      payload: res.data,
    });
    dispatch({
      type: types.USERNAME,
      payload: username,
    });
    dispatch({
      type: types.LOGGEDIN,
      payload: true,
    });
  });
  */

// SEARCHING ACTIONS

/**
 * This action sets whether the seaarch panel should be displayed in sbh
 * @param {Boolean} isOpen - directs whether the search panel should be displayed
 */
export const setSearchingActive = (isOpen) => (dispatch) => {
  dispatch({
    type: types.SEARCHINGOPEN,
    payload: isOpen,
  });
};

/**
 * This action sets the search query that is used to get search results
 * @param {String} query - the new search query to be used
 */
export const setSearchQuery = (query) => (dispatch) => {
  dispatch({
    type: types.QUERY,
    payload: query,
  });
};

/**
 * This action sets the number by which search results should be offset
 * @param {Number} newOffset - the new number by which search results should be offset
 */
export const setOffset = (newOffset) => (dispatch) => {
  dispatch({
    type: types.OFFSET,
    payload: newOffset,
  });
};

// BASKET ACTIONS
/**
 * This action adds objects to the Basket that is located in the Search Panel in sbh
 * @param {Array} uriArray - the objects that will be stored in the Basket
 * @returns
 */
export const addToBasket = (uriArray) => (dispatch) => {
  dispatch({
    type: types.ADDTOBASKET,
    payload: uriArray,
  });
};

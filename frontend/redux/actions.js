import * as types from './types';
import axios from 'axios';
// USER ACTIONS
export const login = (username, password) => (dispatch) => {
  axios.post(`${process.env.backendUrl}/login`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/plain',
    },
    email: username,
    password: password
  }).then(res => {
    dispatch({
      type: types.USERTOKEN,
      payload: res.data
    });
    dispatch({
      type: types.USERNAME,
      payload: username
    });
    dispatch({
      type: types.LOGGEDIN,
      payload: true
    })
  }) 
}


// SEARCHING ACTIONS
export const setSearchingActive = (isOpen) => (dispatch) => {
  dispatch({
    type: types.SEARCHINGOPEN,
    payload: isOpen,
  });
};

export const setSearchQuery = (query) => (dispatch) => {
  dispatch({
    type: types.QUERY,
    payload: query,
  });
};

export const setOffset = (newOffset) => (dispatch) => {
  dispatch({
    type: types.OFFSET,
    payload: newOffset,
  });
};

// BASKET ACTIONS
export const addToBasket = (uriArray) => (dispatch) => {
  dispatch({
    type: types.ADDTOBASKET,
    payload: uriArray,
  });
};

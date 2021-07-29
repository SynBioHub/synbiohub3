import JSZip from 'jszip';

import * as types from './types';

/* eslint sonarjs/no-duplicate-string: "off" */

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
    dispatch(fetchUserInfo());
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
  dispatch(fetchUserInfo());
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

export const updateUser =
  (name, affiliation, email, password, confirmPassword) =>
  async (dispatch, getState) => {
    const url = `${process.env.backendUrl}/profile`;
    const token = getState().user.token;
    const headers = {
      Accept: 'text/plain',
      'X-authorization': token
    };

    const parameters = new URLSearchParams();
    parameters.append('name', name);
    parameters.append('affiliation', affiliation);
    parameters.append('email', email);
    if (password) {
      parameters.append('password1', password);
      parameters.append('password2', confirmPassword);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: parameters
    });
    if (response.status === 200) dispatch(fetchUserInfo());
  };

export const fetchUserInfo = () => async (dispatch, getState) => {
  const url = `${process.env.backendUrl}/profile`;
  const token = getState().user.token;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };

  const response = await fetch(url, {
    method: 'GET',
    headers
  });
  if (response.status === 200) {
    const message = await response.json();
    dispatch({
      type: types.USERINFO,
      payload: {
        username: message.username,
        name: message.name,
        email: message.email,
        affiliation: message.affiliation,
        isAdmin: message.isAdmin
      }
    });
  } else {
    dispatch(logoutUser());
  }
};

export const registerUser =
  (fullName, username, affiliation, email, password, confirmPassword) =>
  async dispatch => {
    const url = `${process.env.backendUrl}/register`;
    const headers = {
      Accept: 'text/plain'
    };

    const parameters = new URLSearchParams();
    parameters.append('name', fullName);
    parameters.append('username', username);
    parameters.append('affiliation', affiliation);
    parameters.append('email', email);
    parameters.append('password1', password);
    parameters.append('password2', confirmPassword);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: parameters
    });
    const message = await response.text();
    if (response.status === 200) {
      localStorage.setItem('userToken', message); // save the token of the user locally, change to cookie later
      localStorage.setItem('username', username); // save the username of the user locally, change to cookie later
      dispatch(login(username, password));
    } else {
      dispatch({
        type: types.REGISTERERROR,
        payload: message
      });
    }
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

/**
 * This action handles the submitting of design files to sbh
 * @param {string} uri - the uri of the collection
 * @param {array} files - the files to submit
 * @returns
 */
export const submit =
  (uri, files, overwriteIncrement = 0) =>
  async (dispatch, getState) => {
    dispatch({
      type: types.SUBMITRESET,
      payload: true // sets submitting state to true
    });

    dispatch({
      type: types.SHOWSUBMITPROGRESS,
      payload: true
    });

    const token = getState().user.token;

    await uploadFiles(dispatch, token, uri, files, overwriteIncrement);

    dispatch({
      type: types.SUBMITTING,
      payload: false
    });
  };

/**
 * Helper function called by the submit action
 * @param {*} dispatch
 * @param {string} token - the authorization token of the current user
 * @param {string} uri - the collection uri
 * @param {array} files - the files to uplod to sbh
 */
async function uploadFiles(
  dispatch,
  token,
  uri,
  files,
  overwriteIncrement = 0
) {
  const filesUploading = [];
  const failedFiles = [];

  for (const file of files) {
    filesUploading.push({
      file: file,
      name: file.name,
      status: 'pending',
      errors: []
    });
  }

  dispatch({
    type: types.FILESUPLOADING,
    payload: filesUploading
  });

  const url = `${process.env.backendUrl}/submit`;
  const headers = {
    Accept: 'text/plain; charset=UTF-8',
    'X-authorization': token
  };

  // upload all files
  for (var fileIndex = 0; fileIndex < filesUploading.length; fileIndex++) {
    filesUploading[fileIndex].status = 'uploading';
    dispatch({
      type: types.FILESUPLOADING,
      payload: [...filesUploading]
    });

    const form = new FormData();
    form.append('rootCollections', uri);
    form.append('file', filesUploading[fileIndex].file);
    form.append('overwrite_merge', 2 + overwriteIncrement);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: form
    });

    if (response.status === 200) {
      filesUploading[fileIndex].status = 'successful';
    } else {
      var fileErrorMessages = await response.text();
      fileErrorMessages =
        fileErrorMessages.charAt(0) !== '['
          ? [fileErrorMessages]
          : JSON.parse(fileErrorMessages);
      filesUploading[fileIndex].status = 'failed';
      filesUploading[fileIndex].errors = fileErrorMessages;
      failedFiles.push(filesUploading[fileIndex]);
      filesUploading.splice(fileIndex, 1);
      fileIndex -= 1;
      dispatch({ type: types.FILEFAILED, payload: true });
      dispatch({
        type: types.FAILEDFILES,
        payload: [...failedFiles]
      });
    }
    dispatch({
      type: types.FILESUPLOADING,
      payload: [...filesUploading]
    });
  }
}

export const addAttachments = (files, uri) => async (dispatch, getState) => {
  var newFailedFiles = getState().submit.failedFiles;
  for (const file of files) {
    newFailedFiles = newFailedFiles.filter(failedFile => failedFile !== file);
    file.status = 'uploading';
    file.errors = [];
  }
  dispatch({ type: types.FAILEDFILES, payload: newFailedFiles });
  dispatch({
    type: types.ATTACHMENTSUPLOADING,
    payload: [...getState().submit.attachmentsUploading, ...files]
  });

  dispatch({ type: types.SUBMITTING, payload: true });

  var zip = new JSZip();
  for (const file of files) {
    zip.file(file.file.name, file.file);
  }
  const zipped = await zip.generateAsync({ type: 'base64' });

  const token = getState().user.token;

  const url = `${process.env.backendUrl}/submit`;
  const headers = {
    Accept: 'text/plain; charset=UTF-8',
    'X-authorization': token
  };

  const form = new FormData();
  form.append('rootCollections', uri);
  form.append('file', zipped);
  form.append('overwrite_merge', 2);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: form
  });

  if (response.status === 200) {
    for (var index = 0; index < files.length; index++)
      files[index].status = 'successful';
  } else {
    var fileErrorMessages = await response.text();
    fileErrorMessages =
      fileErrorMessages.charAt(0) !== '['
        ? [fileErrorMessages]
        : JSON.parse(fileErrorMessages);
    const newFailedFiles = getState().submit.failedFiles;
    for (var fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex];
      file.status = 'failed';
      file.errors = fileErrorMessages;
      newFailedFiles.push(file);
      files.splice(fileIndex, 1);
      fileIndex -= 1;
    }
    dispatch({ type: types.FILEFAILED, payload: true });
    dispatch({
      type: types.FAILEDFILES,
      payload: [...newFailedFiles]
    });
  }

  dispatch({
    type: types.ATTACHMENTSUPLOADING,
    payload: [...getState().submit.attachmentsUploading]
  });
  if (getState().submit.failedFiles.length === 0)
    dispatch({ type: types.FILEFAILED, payload: false });
  dispatch({
    type: types.SUBMITTING,
    payload: false
  });
};

export const createCollection =
  (id, version, name, description, citations, overwrite_merge) =>
  async (dispatch, getState) => {
    dispatch({ type: types.CREATINGCOLLECTIONERRORS, payload: [] });
    dispatch({ type: types.CREATINGCOLLECTION, payload: true });
    dispatch({
      type: types.CREATINGCOLLECTIONBUTTONTEXT,
      payload: 'Creating Collection'
    });
    const token = getState().user.token;
    const url = `${process.env.backendUrl}/submit`;
    var headers = {
      Accept: 'text/plain; charset=UTF-8',
      'X-authorization': token
    };

    const form = new FormData();
    form.append('id', id);
    form.append('version', version);
    form.append('name', name);
    form.append('description', description);
    form.append('citations', citations);
    form.append('overwrite_merge', `${overwrite_merge}`);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: form
    });

    if (response.status !== 200) {
      var messages = await response.text();
      messages = messages.charAt(0) !== '[' ? [messages] : JSON.parse(messages);
      dispatch({ type: types.CREATINGCOLLECTIONERRORS, payload: messages });
    } else {
      dispatch({ type: types.CREATINGCOLLECTIONERRORS, payload: [] });
      await dispatch(getCanSubmitTo());
      const collections = getState().submit.canSubmitTo;
      for (const collection of collections) {
        if (
          collection.displayId === id + '_collection' &&
          collection.version === version &&
          collection.name === name
        ) {
          dispatch(setSelectedCollection(collection));
          break;
        }
      }
      dispatch(setPromptNewCollection(false));
    }
    dispatch({ type: types.CREATINGCOLLECTION, payload: false });
  };

export const setSelectedCollection = collection => dispatch => {
  dispatch({ type: types.SELECTEDCOLLECTION, payload: collection });
};

export const setPromptNewCollection = promptNewCollection => dispatch => {
  dispatch({ type: types.PROMPTNEWCOLLECTION, payload: promptNewCollection });
  if (promptNewCollection)
    dispatch({
      type: types.CREATINGCOLLECTIONBUTTONTEXT,
      payload: 'Tell us about your collection'
    });
  else
    dispatch({
      type: types.CREATINGCOLLECTIONBUTTONTEXT,
      payload: 'New Collection'
    });
};

export const resetSubmit = () => dispatch => {
  dispatch({ type: types.SHOWSUBMITPROGRESS, payload: false });
  dispatch({ type: types.SUBMITRESET, payload: false });
};

// MANAGE SUBMISSION ACTIONS
export const getCanSubmitTo = () => async (dispatch, getState) => {
  dispatch({ type: types.GETTINGCANSUBMITTO, payload: true });

  const token = getState().user.token;
  var url = `${process.env.backendUrl}/manage`;
  var headers = {
    Accept: 'text/plain; charset=UTF-8',
    'X-authorization': token
  };

  var data = await fetch(url, {
    method: 'GET',
    headers
  });

  const submissions = await data.json();

  url = `${process.env.backendUrl}/shared`;

  data = await fetch(url, {
    method: 'GET',
    headers
  });

  const sharedSubmissions = await data.json();

  dispatch({
    type: types.CANSUBMITTO,
    payload: [...submissions, ...sharedSubmissions].filter(
      submission => submission.triplestore !== 'public'
    )
  });

  dispatch({ type: types.GETTINGCANSUBMITTO, payload: false });
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

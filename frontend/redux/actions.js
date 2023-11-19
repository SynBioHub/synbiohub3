import axios from 'axios';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import getConfig from 'next/config';
import { mutate } from 'swr';
const mime = require('mime-types');

import * as types from './types';
const { publicRuntimeConfig } = getConfig();

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
  const url = `${publicRuntimeConfig.backend}/login`;
  const headers = {
    Accept: 'text/plain'
  };

  const parameters = new URLSearchParams();
  parameters.append('email', username);
  parameters.append('password', password);

  try {
    const response = await axios.post(url, parameters, { headers });
    const message = response.data;

    if (response.status === 200) {
      dispatch({
        type: types.LOGIN,
        payload: {
          username,
          token: message
        }
      });
      dispatch(fetchUserInfo());
      localStorage.setItem('userToken', message); // Save the token of the user locally, change to cookie later
      localStorage.setItem('username', username); // Save the username of the user locally, change to cookie later
    } else {
      dispatch({
        type: types.LOGINERROR,
        payload: message
      });
    }
  } catch (error) {
    // Handle error case
    if (error.response.data == 'Your e-mail address was not recognized.') {
      error.response.data = 'Your e-mail address or password was not recognized.'
    }
    console.error('Error:', error.message);
    dispatch({
      type: types.LOGINERROR,
      payload: error.response ? error.response.data : 'Login failed'
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
      const url = `${publicRuntimeConfig.backend}/profile`;
      try {
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

        let response;

        try {
          response = await axios.post(url, parameters, { headers });
        } catch (error) {
          if (error.response) {
            console.error('Error:', error.message);
          }
        }

        if (response.status === 200) dispatch(fetchUserInfo());
      } catch (error) {
        error.customMessage = 'There was an error updating your profile.';
        error.url = `${publicRuntimeConfig.backend}/profile`;
        dispatch(addError(error));
      }
    };

export const fetchUserInfo = () => async (dispatch, getState) => {
  const url = `${publicRuntimeConfig.backend}/profile`;
  const token = getState().user.token;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };
  let response;

  try {
    response = await axios.get(url, { headers });
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.message);
    }
  }
  if (response.status === 200) {
    const message = await response.data;
    dispatch({
      type: types.USERINFO,
      payload: {
        username: message.username,
        name: message.name,
        email: message.email,
        affiliation: message.affiliation,
        isAdmin: message.isAdmin,
        graphUri: message.graphUri
      }
    });
  } else {
    dispatch(logoutUser());
  }
};

export const registerUser =
  (fullName, username, affiliation, email, password, confirmPassword) =>
    async dispatch => {
      const url = `${publicRuntimeConfig.backend}/register`;
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

      let response;

      try {
        const response = await axios.post(url, parameters, { headers });

        const message = response.data;
        if (response.status === 200) {
          localStorage.setItem('userToken', message); // save the token of the user locally
          localStorage.setItem('username', username); // save the username of the user locally
          dispatch(login(username, password));
        } else {
          dispatch({
            type: types.REGISTERERROR,
            payload: message
          });
        }
      } catch (error) {
        console.error('Error:', error.message);
        dispatch({
          type: types.REGISTERERROR,
          payload: error.response ? error.response.data : 'Registration failed'
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
  (
    uri,
    files,
    overwriteIncrement = 0,
    addingToCollection = false,
    plugin = null,
    resubmit = false
  ) =>
    async (dispatch, getState) => {
      if (!resubmit) {
        dispatch({
          type: types.SUBMITRESET,
          payload: true // sets submitting state to true
        });
      }
      else {
        dispatch({
          type: types.SUBMITTING,
          payload: true
        })

        var failedFiles = getState().submit.failedFiles

        for (let file of files) {
          failedFiles = failedFiles.filter(failedFile => file.name !== failedFile.name)
        }
        dispatch({
          type: types.FAILEDFILES,
          payload: failedFiles
        })
        if (failedFiles.length === 0) {
          dispatch({
            type: types.FILEFAILED,
            payload: false
          })
        }
      }

      dispatch({
        type: types.SHOWSUBMITPROGRESS,
        payload: true
      });

      const token = getState().user.token;


      const convertedFiles = await submitPluginHandler(files, plugin, dispatch, getState);




      await uploadFiles(
        dispatch,
        getState,
        token,
        uri,
        convertedFiles,
        overwriteIncrement,
        addingToCollection
      );

      dispatch({
        type: types.SUBMITTING,
        payload: false
      });
    };


async function submitPluginHandler(files, plugin, dispatch, getState) {

  if (plugin.value === 'configure') {
    const returnFiles = [];

    for (let [key, value] of plugin.pluginBundles) {
      const convertedFiles = await singlePluginHandler(value, key.value, dispatch, getState)
      returnFiles.push(...convertedFiles)

    }
    return returnFiles
  }

  else {
    return await singlePluginHandler(files, plugin.value, dispatch, getState)
  }

}

async function singlePluginHandler(files, plugin, dispatch, getState) {

  if (plugin === 'default') {
    return files
  }

  let unzippedFiles = [];

  for (let file of files) {
    if (mime.lookup(file.name) === 'application/zip') {
      var zip = new JSZip();
      const result = await zip.loadAsync(file);

      for (let [filename, zipFile] of Object.entries(result.files)) {
        if (!filename.includes('__MACOSX/._')) {
          const currFileBlob = await zipFile.async('blob');
          const currFile = new File([currFileBlob], filename);

          unzippedFiles.push(currFile)
        }

      }
    }
    else {
      unzippedFiles.push(file)
    }
  }

  const evaluateFilesManifest = [];
  const returnFiles = [];


  for (let file of unzippedFiles) {

    file.url = URL.createObjectURL(file)




    evaluateFilesManifest.push({
      url: file.url,
      filename: file.name,
      type: mime.lookup(file.name)
    })
  }

  const evaluateManifest = {
    manifest: {
      files: evaluateFilesManifest
    }
  };

  return axios({
    headers: {
      'Content-Type': 'application/json',
      'Accepts': 'application/json'
    },
    method: 'POST',
    url: `${publicRuntimeConfig.backend}/call`,
    params: {
      name: plugin,
      endpoint: 'evaluate',
      category: 'submit',
      data: encodeURIComponent(JSON.stringify(evaluateManifest))
    }
  }).then(async (response) => {
    const requirementManifest = response.data.manifest;
    const pluginFiles = [];

    for (let file of requirementManifest) {
      if (file.requirement === 0) {
        returnFiles.push(findFile(unzippedFiles, file.filename))
      }
      else {
        pluginFiles.push(findFile(unzippedFiles, file.filename))
      }
    }

    const runFilesManifest = [];
    for (let file of pluginFiles) {
      runFilesManifest.push({
        url: file.url,
        filename: file.name,
        type: mime.lookup(file.name),
        instanceUrl: publicRuntimeConfig.backend
      })
    }

    const runManifest = {
      manifest: {
        files: runFilesManifest
      }
    }

    return axios({
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/zip'
      },
      method: 'POST',
      url: `${publicRuntimeConfig.backend}/call`,
      responseType: 'arraybuffer',
      responseEncoding: 'binary',
      params: {
        name: plugin,
        endpoint: 'run',
        category: 'submit',
        data: encodeURIComponent(JSON.stringify(runManifest))
      }

    }).then(async (response) => {


      for (let file of unzippedFiles) {
        URL.revokeObjectURL(file.url)
      }

      const pluginZip = response.data;

      var zip = new JSZip();
      const result = await zip.loadAsync(pluginZip);

      const jsonFile = await result.file('manifest.json').async('string')

      const jsonFileFixed = jsonFile.replaceAll("'", '"')


      const jsonManifest = JSON.parse(jsonFileFixed);
      result.remove('manifest.json');

      for (let [filename, zipFile] of Object.entries(result.files)) {

        const currFileBlob = await zipFile.async('blob');
        const currFile = new File([currFileBlob], filename);

        returnFiles.push(currFile)

      }

      const convertedFiles = getState().submit.convertedFiles

      for (let fileResult of jsonManifest.results) {
        const fileSources = [];
        for (let filename of fileResult.sources) {
          fileSources.push(findFile(unzippedFiles, filename))
        }

        convertedFiles.push(
          {
            convertedFileName: fileResult.filename,
            fileSources: fileSources
          }
        )
      }

      dispatch({
        type: types.CONVERTEDFILES,
        payload: convertedFiles
      })

      return returnFiles;

    }).catch(error => {

      const failedFiles = [];

      for (let file of unzippedFiles) {
        failedFiles.push({
          file: file,
          name: file.name,
          url: file.url,
          status: 'failed',
          errors: ['Error using ' + plugin + ': ' + error.message]
        })
      }

      dispatch({ type: types.FILEFAILED, payload: true });
      dispatch({
        type: types.FAILEDFILES,
        payload: [...failedFiles]
      });

      return returnFiles;
    })


  }).catch(error => {
    const failedFiles = [];

    for (let file of unzippedFiles) {
      failedFiles.push({
        file: file,
        name: file.name,
        url: file.url,
        status: 'failed',
        errors: ['Error using ' + plugin + ': ' + error.message]
      })
    }

    dispatch({ type: types.FILEFAILED, payload: true });
    dispatch({
      type: types.FAILEDFILES,
      payload: [...failedFiles]
    });

    return [];
  })


}

function findFile(files, filename) {
  for (let file of files) {
    if (file.name === filename) {
      return file;
    }
  }
}

/**
 * Helper function called by the submit action
 * @param {*} dispatch
 * @param {string} token - the authorization token of the current user
 * @param {string} uri - the collection uri
 * @param {array} files - the files to upload to sbh
 */
async function uploadFiles(
  dispatch,
  getState,
  token,
  uri,
  files,
  overwriteIncrement = 0,
  addingToCollection = false
) {
  const filesUploading = getState().submit.filesUploading;
  const failedFiles = getState().submit.failedFiles;

  for (const file of files) {

    filesUploading.push({
      file: file,
      name: file.name,
      url: file.url,
      status: 'pending',
      errors: []
    });


  }

  dispatch({
    type: types.FILESUPLOADING,
    payload: filesUploading
  });

  let url = `${publicRuntimeConfig.backend}/submit`;
  const headers = {
    Accept: 'text/plain; charset=UTF-8',
    'X-authorization': token
  };

  // upload all files
  for (var fileIndex = 0; fileIndex < filesUploading.length; fileIndex++) {
    if (addingToCollection) {
      url = `${publicRuntimeConfig.backend}${filesUploading[fileIndex].url}/addToCollection`;
    }
    filesUploading[fileIndex].status = 'uploading';

    dispatch({
      type: types.FILESUPLOADING,
      payload: [...filesUploading]
    });

    let form = new FormData();
    if (!addingToCollection) {
      form.append('rootCollections', uri);
      form.append('file', filesUploading[fileIndex].file);
      form.append('overwrite_merge', 2 + overwriteIncrement);
    } else {
      form = new URLSearchParams();
      form.append('collections', uri);
    }

    let response;

    try {
      response = await axios.post(url, form, { headers });
    } catch (error) {
      if (error.response) {
        console.error('Error:', error.message);
      }
    }

    if (response.status === 200) {
      filesUploading[fileIndex].status = 'successful';

      var convertedFiles = getState().submit.convertedFiles
      convertedFiles = convertedFiles.filter(item => item["convertedFileName"] !== filesUploading[fileIndex].name)

      dispatch({
        type: types.CONVERTEDFILES,
        payload: convertedFiles
      })

    } else {
      var fileErrorMessages = await response.text();
      fileErrorMessages =
        fileErrorMessages.charAt(0) !== '['
          ? [fileErrorMessages]
          : JSON.parse(fileErrorMessages);


      var convertedFiles = getState().submit.convertedFiles
      let origFiles = null;
      for (let item of convertedFiles) {
        if (item.convertedFileName === filesUploading[fileIndex].name) {
          origFiles = item.fileSources
        }
      }


      if (origFiles !== null) {

        for (let file of origFiles) {
          failedFiles.push({
            file: file,
            name: file.name,
            url: file.url,
            status: 'failed',
            errors: fileErrorMessages
          })
        }

        convertedFiles = convertedFiles.filter(item => item["convertedFileName"] !== filesUploading[fileIndex].name)
        dispatch({
          type: types.CONVERTEDFILES,
          payload: convertedFiles
        })

      }
      else {
        filesUploading[fileIndex].status = 'failed';
        filesUploading[fileIndex].errors = fileErrorMessages;
        failedFiles.push(filesUploading[fileIndex]);
      }
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

function retrieveConvertedFile(dispatch, getState, filename) {
  var convertedFiles = getState().submit.convertedFiles
  let targetFiles = null;
  for (let item of convertedFiles) {
    if (item.convertedFileName === filename) {
      targetFiles = item.fileSources
    }
  }
  convertedFiles = convertedFiles.filter(item => item["convertedFileName"] !== filename)
  dispatch({
    type: types.CONVERTEDFILES,
    payload: convertedFiles
  })


  return targetFiles
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

  const url = `${publicRuntimeConfig.backend}/submit`;
  const headers = {
    Accept: 'text/plain; charset=UTF-8',
    'X-authorization': token
  };

  const form = new FormData();
  form.append('rootCollections', uri);
  form.append('file', zipped);
  form.append('overwrite_merge', 2);


  let response;

  try {
    response = await axios.post(url, form, { headers });
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.message);
    }
  }

  if (response.status === 200) {
    for (var index = 0; index < files.length; index++)
      files[index].status = 'successful';
  } else {
    var fileErrorMessages = await response.data;
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
      const url = `${publicRuntimeConfig.backend}/submit`;
      try {
        dispatch({ type: types.CREATINGCOLLECTIONERRORS, payload: [] });
        dispatch({ type: types.CREATINGCOLLECTION, payload: true });
        dispatch({
          type: types.CREATINGCOLLECTIONBUTTONTEXT,
          payload: 'Creating Collection'
        });
        const token = getState().user.token;
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

        let response;

        try {
          response = await axios.post(url, form, { headers });
        } catch (error) {
          if (error.response) {
            console.error('Error:', error.message);
          }
        }

        if (response.status !== 200) {
          var messages = await response.data;
          messages =
            messages.charAt(0) !== '[' ? [messages] : JSON.parse(messages);
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
      } catch (error) {
        error.customMessage = 'There was an error creating your collection.';
        error.fullUrl = url;
        dispatch(addError(error));
      }
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
  var url = `${publicRuntimeConfig.backend}/manage`;
  try {
    dispatch({ type: types.GETTINGCANSUBMITTO, payload: true });
    const token = getState().user.token;
    var headers = {
      Accept: 'text/plain; charset=UTF-8',
      'X-authorization': token
    };


    let data;

    try {
      data = await axios.get(url, { headers });
    } catch (error) {
      if (error.response) {
        console.error('Error:', error.message);
      }
    }

    const submissions = await data.data;

    url = `${publicRuntimeConfig.backend}/shared`;


    try {
      data = await axios.get(url, { headers });
    } catch (error) {
      if (error.response) {
        console.error('Error:', error.message);
      }
    }

    const sharedSubmissions = await data.data;

    dispatch({
      type: types.CANSUBMITTO,
      payload: [...submissions, ...sharedSubmissions].filter(
        submission => submission.triplestore !== 'public'
      )
    });

    dispatch({ type: types.GETTINGCANSUBMITTO, payload: false });
  } catch (error) {
    error.customMessage = "Couldn't get and/or process submissions";
    error.fullUrl = url;
    dispatch(addError(error));
  }
};

export const makePublicCollection =
  (
    submissionUrl,
    displayId,
    version,
    name,
    description,
    citations,
    tabState,
    collections,
    setProcessUnderway
  ) =>
    async (dispatch, getState) => {
      const url = `${publicRuntimeConfig.backend}${submissionUrl}/makePublic`;
      try {
        setProcessUnderway(true);
        dispatch({ type: types.PUBLISHING, payload: true });

        const token = getState().user.token;
        const headers = {
          Accept: 'text/plain; charset=UTF-8',
          'X-authorization': token
        };

        const parameters = new URLSearchParams();
        parameters.append('id', displayId);
        parameters.append('version', version);
        parameters.append('name', name);
        parameters.append('description', description);
        parameters.append('citations', citations);
        parameters.append('tabState', tabState);
        if (tabState === 'existing')
          parameters.append('collections', collections);

        let response;

        try {
          response = await axios.post(url, parameters, { headers });
        } catch (error) {
          if (error.response) {
            console.error('Error:', error.message);
          }
        }

        if (response.status === 200) {
          mutate([`${publicRuntimeConfig.backend}/shared`, token, dispatch]);
          mutate([`${publicRuntimeConfig.backend}/manage`, token, dispatch]);
        }

        setProcessUnderway(false);
        dispatch({ type: types.PUBLISHING, payload: false });
      } catch (error) {
        error.customMessage = "Couldn't make collection public";
        error.fullUrl = url;
        dispatch(addError(error));
      }
    };

export const downloadFiles =
  (files, plugin = false, pluginName = null, pluginData = null) =>
    (dispatch, getState) => {
      dispatch({ type: types.DOWNLOADSTATUS, payload: 'Downloading' });
      dispatch({ type: types.DOWNLOADLIST, payload: files });
      dispatch({ type: types.SHOWDOWNLOAD, payload: true });

      const token = getState().user.token;
      var zip = new JSZip();
      var zipFilename = 'sbhdownload.zip';

      const zippedFilePromises = files.map((file, index) => {
        return zippedFilePromise(
          file,
          index,
          token,
          files,
          dispatch,
          plugin,
          pluginName,
          pluginData
        );
      });

      Promise.allSettled(zippedFilePromises).then(results => {
        dispatch({ type: types.DOWNLOADSTATUS, payload: 'Zipping' });
        for (const result of results) {
          if (result.status === 'fulfilled') {
            let filename;
            if (plugin) {
              filename = `${result.value.file.pluginName}`;
            }
            else {
              filename = `${result.value.file.displayId}.${result.value.file.type}`;
            }

            zip.file(filename, result.value.response.data);
          }
        }
        zip.generateAsync({ type: 'blob' }).then(function (content) {
          dispatch({ type: types.SHOWDOWNLOAD, payload: false });
          saveAs(content, zipFilename);
        });
      });
    };

const zippedFilePromise = (
  file,
  index,
  token,
  files,
  dispatch,
  plugin,
  pluginName,
  pluginData
) => {
  return new Promise((resolve, reject) => {
    axios(
      plugin
        ? {
          headers: {
            'Accept': 'application/octet-stream'
          },
          url: `${publicRuntimeConfig.backend}/call`,
          method: 'POST',
          responseType: 'blob',
          params: {
            name: pluginName,
            endpoint: 'run',
            data: encodeURIComponent(JSON.stringify(pluginData)),
            category: 'download'
          }
        }
        :
        {
          url: file.url,
          method: 'GET',
          responseType: 'blob',
          headers: {
            'X-authorization': token
          }
        }

    )
      .then(response => {
        if (response.status === 200) {
          files[index].status = 'downloaded';
          if (plugin) {
            const filename = response.headers['content-disposition'].split('=')[1];
            const extension = filename.split('.').pop().replace('"', '');
            file.type = extension
            file.pluginName = filename.replaceAll('"', '');
          }
          resolve({ file, response });

        } else {
          files[index].status = 'failed';
          files[index].errors = 'Sorry, this file could not be downloaded';
          reject();
        }
        dispatch({ type: types.DOWNLOADLIST, payload: [...files] });
      })
      .catch(error => {
        files[index].status = 'failed';
        files[index].errors = error;
        reject(error);
        dispatch({ type: types.DOWNLOADLIST, payload: [...files] });
      });
  });
};

export const toggleShowDownload = () => (dispatch, getState) => {
  dispatch({
    type: types.SETDOWNLOADOPEN,
    payload: !getState().download.downloadOpen
  });
};

// BASKET ACTIONS

/**
 * This action adds objects to the Basket that is located in the Search Panel in sbh
 * @param {Array} uriArray - the objects that will be stored in the Basket
 */
export const addToBasket = items => async (dispatch, getState) => {
  dispatch({
    type: types.ADDTOBASKET,
    payload: items
  });
  const newBasket = await getState().basket.basket;
  localStorage.setItem('basket', JSON.stringify(newBasket));
};

export const restoreBasket = () => dispatch => {
  const basket = JSON.parse(localStorage.getItem('basket'));
  if (basket) {
    for (let i = 0; i < basket.length; i++) {
      if (!checkUriExists(basket[i].uri)) {
        console.log("item not exist");
        dispatch(clearBasket(item));
      }
    }
    dispatch({
      type: types.ADDTOBASKET,
      payload: basket
    });
  }
};

export const clearBasket = itemsToClear => (dispatch, getState) => {
  const newBasket = getState().basket.basket.filter(item => {
    let shouldKeep = true;
    for (const itemToDelete of itemsToClear) {
      if (
        item.displayId === itemToDelete.displayId &&
        item.version === itemToDelete.version
      ) {
        shouldKeep = false;
      }
    }
    return shouldKeep;
  });
  dispatch({
    type: types.SETBASKET,
    payload: newBasket
  });
  localStorage.setItem('basket', JSON.stringify(newBasket));
};

export async function checkUriExists(uri) {
  const query = `SELECT ?subject
  WHERE {
      BIND(<${uri}> AS ?subject)
  }`;
  const url = `${publicRuntimeConfig.backend}/sparql?query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/sparql-results+json' }
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return false;
    }

    const data = await response.json();

    // Check if there are any bindings in the results
    const bindings = data.results.bindings;
    if (bindings && bindings.length > 0) {
      console.log("URI exists:", bindings);
      return true; // URI exists
    } else {
      console.log("URI does not exist.");
      return false; // URI does not exist
    }
  } catch (error) {
    console.error('Error in SPARQL query:', error);
    return false;
  }
}



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

// PAGE SECTIONS

/**
 * This action updates the order of page sections.
 *
 * @param {Array} pageSectionOrder An array containing the order of the page sections.
 * @param {String} type The type of the element being displayed.
 */
export const updatePageSectionsOrder = (pageSectionOrder, type) => dispatch => {
  const parsed = JSON.parse(localStorage.getItem(type));
  const minimized = parsed === null ? [] : parsed.minimized;
  const selected = parsed === null ? pageSectionOrder : parsed.selected;

  localStorage.setItem(
    type,
    JSON.stringify({
      order: pageSectionOrder,
      minimized: minimized,
      selected: selected
    })
  );

  dispatch({
    type: types.UPDATESECTIONORDER,
    payload: pageSectionOrder
  });

  dispatch({
    type: types.UPDATEPAGETYPE,
    payload: type
  });
};

/**
 * This action updates which sections are minimized.
 *
 * @param {Array} minimizedSections An array containing which sections are minimized.
 * @param {String} type The type of the element being displayed.
 */
export const updateMinimizedSections =
  (minimizedSections, type) => dispatch => {
    const parsed = JSON.parse(localStorage.getItem(type));
    const order = parsed === null ? [] : parsed.order;
    const selected = parsed === null ? [] : parsed.selected;

    localStorage.setItem(
      type,
      JSON.stringify({
        order: order,
        minimized: minimizedSections,
        selected: selected
      })
    );

    dispatch({
      type: types.UPDATEMINIMIZEDSECTIONS,
      payload: minimizedSections
    });

    dispatch({
      type: types.UPDATEPAGETYPE,
      payload: type
    });
  };

/**
 * This action updates which sections are shown.
 *
 * @param {Array} selectedSections The new sections to be shown.
 * @param {String} type The type of the element being displayed.
 */
export const updateSelectedSections = (selectedSections, type) => dispatch => {
  const parsed = JSON.parse(localStorage.getItem(type));
  const order = parsed === null ? [] : parsed.order;
  const minimized = parsed === null ? [] : parsed.minimized;

  localStorage.setItem(
    type,
    JSON.stringify({
      order: order,
      minimized: minimized,
      selected: selectedSections
    })
  );

  dispatch({
    type: types.UPDATESELECTEDSECTIONS,
    payload: selectedSections
  });
};

export const updateHiddenSections = hiddenSections => dispatch => {
  dispatch({
    type: types.UPDATEHIDDENSECTIONS,
    payload: hiddenSections
  })
}

// ATTACHMENTS SECTION

/**
 * This action sets the attachments.
 * @param {Array} attachments Nested array that contains all the information about the attachments.
 */
export const setAttachments = attachments => dispatch => {
  dispatch({
    type: types.SETATTACHMENTS,
    payload: attachments
  });
};

export const setUploadStatus = status => dispatch => {
  dispatch({
    type: types.UPLOADSTATUS,
    payload: status
  });
};

// ERROR ACTIONS

export const addError = error => (dispatch, getState) => {
  dispatch({
    type: types.SETERRORS,
    payload: [...getState().errors.errors, error]
  });
};

export const clearErrors = () => dispatch => {
  dispatch({
    type: types.SETERRORS,
    payload: []
  });
};

export const removeError = error => (dispatch, getState) => {
  const newErrors = getState().errors.errors.filter(
    e => e.message !== error.message
  );
  dispatch({
    type: types.SETERRORS,
    payload: newErrors
  });
};

export const removeErrorByIndex = index => (dispatch, getState) => {
  const newErrors = getState().errors.errors.filter((e, i) => i !== index);
  dispatch({
    type: types.SETERRORS,
    payload: newErrors
  });
};

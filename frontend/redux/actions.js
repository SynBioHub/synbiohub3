import axios from 'axios';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import { mutate } from 'swr';
import { useSelector } from 'react-redux';

import * as types from './types';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import mime from 'mime-types';

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
    // Use a generic message so we do not reveal whether the email or password failed
    if (error.response) {
      const data = error.response.data;
      if (
        data === 'Your e-mail address was not recognized.' ||
        data === 'Your password was not recognized.'
      ) {
        error.response.data =
          'Your e-mail address or password was not recognized.';
      }
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
 * the session they are in. Theme is left in localStorage so public
 * settings (e.g. allowPublicSignup) remain available after logout.
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

        const response = await axios.post(url, parameters, { headers });

        if (response.status === 200) {
          await dispatch(fetchUserInfo());
          return true;
        }
        return false;
      } catch (error) {
        if (error.response) {
          console.error('Error:', error.message);
        }
        error.customMessage = 'There was an error updating your profile.';
        error.url = `${publicRuntimeConfig.backend}/profile`;
        dispatch(addError(error));
        return false;
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
        console.log("Token:", message);
        if (response.status === 200) {
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
    pluginMapping = null,
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

      const filesToSubmit = await preprocessSubmitFilesWithPlugins(
        files,
        pluginMapping,
        token,
        dispatch,
        getState
      );


      await uploadFiles(
        dispatch,
        getState,
        token,
        uri,
        filesToSubmit,
        overwriteIncrement,
        addingToCollection,
        null
      );

      dispatch({
        type: types.SUBMITTING,
        payload: false
      });
    };

async function preprocessSubmitFilesWithPlugins(
  files,
  pluginMapping,
  token,
  dispatch,
  getState
) {
  const normalizedFiles = Array.isArray(files) ? files : files ? [files] : [];

  if (!pluginMapping || typeof pluginMapping.get !== 'function') {
    return normalizedFiles;
  }

  const filesToSubmit = [];
  const failedFiles = [...getState().submit.failedFiles];
  let hasPluginFailures = false;

  let submitPlugins = [];
  try {
    const response = await axios({
      method: 'GET',
      url: `${publicRuntimeConfig.backend}/admin/plugins`,
      params: { category: 'submit' },
      headers: { Accept: 'application/json' }
    });
    submitPlugins = Array.isArray(response.data.submit)
      ? response.data.submit
      : [];
  } catch (error) {
    console.error('Error loading submit plugins:', error.message);
    return normalizedFiles;
  }

  for (const file of normalizedFiles) {
    const pluginId = pluginMapping.get(file.name);
    const needsPlugin =
      pluginId !== undefined &&
      pluginId !== null &&
      pluginId !== 'default';

    if (!needsPlugin) {
      filesToSubmit.push(file);
      continue;
    }

    const plugin = submitPlugins.find(p => {
      return `${p.index}` === `${pluginId}` || `${p.name}` === `${pluginId}`;
    });

    if (!plugin) {
      hasPluginFailures = true;
      failedFiles.push({
        file,
        name: file.name,
        url: file.url,
        status: 'failed',
        errors: [`Submit plugin not found for ${file.name}.`]
      });
      continue;
    }

    const pluginResult = await runSubmitPluginPipeline(
      file,
      plugin.name,
      token,
      dispatch,
      getState
    );

    if (pluginResult.success) {
      filesToSubmit.push(...pluginResult.files);
    } else {
      hasPluginFailures = true;
      failedFiles.push(...pluginResult.failedFiles);
    }
  }

  if (hasPluginFailures) {
    dispatch({ type: types.FILEFAILED, payload: true });
    dispatch({
      type: types.FAILEDFILES,
      payload: failedFiles
    });
  }

  return filesToSubmit;
}

async function unzipIfNeeded(file) {
  const fileMime = mime.lookup(file.name) || '';
  const isZip = fileMime === 'application/zip' || file.name.endsWith('.zip');

  if (!isZip) {
    return [file];
  }

  const zip = new JSZip();
  const unzipped = [];
  const loaded = await zip.loadAsync(file);

  for (const [filename, zipFile] of Object.entries(loaded.files)) {
    if (zipFile.dir || filename.startsWith('__MACOSX/')) {
      continue;
    }
    const currFileBlob = await zipFile.async('blob');
    const currFile = new File([currFileBlob], filename, {
      type: mime.lookup(filename) || 'application/octet-stream'
    });
    unzipped.push(currFile);
  }

  return unzipped;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || '';
      const base64 = typeof result === 'string' ? result.split(',').pop() : '';
      resolve(base64 || '');
    };
    reader.onerror = () => {
      reject(new Error(`Failed to read file ${file.name} for plugin submission.`));
    };
    reader.readAsDataURL(file);
  });
}

function createFailedPluginFiles(files, pluginName, message) {
  return files.map(file => ({
    file,
    name: file.name,
    url: file.url,
    status: 'failed',
    errors: [`Error using ${pluginName}: ${message}`]
  }));
}

function findFile(files, filename) {
  for (const file of files) {
    if (file.name === filename) {
      return file;
    }
  }
  return null;
}

async function runSubmitPluginPipeline(file, pluginName, token, dispatch, getState) {
  let expandedFiles = [];
  const urlsToRevoke = [];
  const passthroughFiles = [];

  try {
    expandedFiles = await unzipIfNeeded(file);

    const preparedFiles = [];
    for (const expandedFile of expandedFiles) {
      const objectUrl = URL.createObjectURL(expandedFile);
      urlsToRevoke.push(objectUrl);
      preparedFiles.push({
        file: expandedFile,
        filename: expandedFile.name,
        type: mime.lookup(expandedFile.name) || 'application/octet-stream',
        url: objectUrl,
        contentBase64: await fileToBase64(expandedFile)
      });
    }

    const evaluateFilesManifest = preparedFiles.map(preparedFile => ({
      url: preparedFile.url,
      filename: preparedFile.filename,
      type: preparedFile.type
    }));

    const evaluateResponse = await axios({
      method: 'POST',
      url: `${publicRuntimeConfig.backend}/callPlugin`,
      headers: {
        'X-authorization': token
      },
      data: {
        name: pluginName,
        endpoint: 'evaluate',
        category: 'submit',
        data: JSON.stringify({
          manifest: {
            files: evaluateFilesManifest
          }
        })
      }
    });

    const requirementManifest = Array.isArray(evaluateResponse.data.manifest)
      ? evaluateResponse.data.manifest
      : [];

    const pluginInputFiles = [];
    for (const requirement of requirementManifest) {
      const source = findFile(expandedFiles, requirement.filename);
      if (!source) {
        continue;
      }
      if (requirement.requirement === 0) {
        passthroughFiles.push(source);
      } else {
        pluginInputFiles.push(source);
      }
    }

    if (pluginInputFiles.length === 0) {
      return { success: true, files: passthroughFiles.length ? passthroughFiles : expandedFiles };
    }

    const runManifest = {
      manifest: {
        files: pluginInputFiles.map(pluginFile => ({
          url: preparedFiles.find(f => f.filename === pluginFile.name)?.url,
          filename: pluginFile.name,
          type: mime.lookup(pluginFile.name) || 'application/octet-stream',
          instanceUrl: publicRuntimeConfig.backend,
          contentBase64:
            preparedFiles.find(f => f.filename === pluginFile.name)?.contentBase64 || ''
        }))
      }
    };

    const runResponse = await axios({
      method: 'POST',
      url: `${publicRuntimeConfig.backend}/callPlugin`,
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'application/zip',
        'X-authorization': token
      },
      data: {
        name: pluginName,
        endpoint: 'run',
        category: 'submit',
        data: JSON.stringify(runManifest)
      }
    });

    let manifestResults = [];
    const convertedFiles = [...passthroughFiles];

    try {
      const resultZip = await JSZip.loadAsync(runResponse.data);

      if (resultZip.file('manifest.json')) {
        const manifestText = await resultZip.file('manifest.json').async('string');
        const fixedManifestText = manifestText.replaceAll("'", '"');
        const parsedManifest = JSON.parse(fixedManifestText);
        manifestResults = Array.isArray(parsedManifest.results)
          ? parsedManifest.results
          : [];
        resultZip.remove('manifest.json');
      }

      for (const [filename, zipFile] of Object.entries(resultZip.files)) {
        if (zipFile.dir) {
          continue;
        }
        const currFileBlob = await zipFile.async('blob');
        convertedFiles.push(
          new File([currFileBlob], filename, {
            type: mime.lookup(filename) || 'application/xml'
          })
        );
      }
    } catch (zipParseError) {
      const headers = runResponse.headers || {};
      const contentType =
        (headers['content-type'] || headers['Content-Type'] || 'application/xml') + '';
      const contentDisposition =
        (headers['content-disposition'] || headers['Content-Disposition'] || '') + '';
      const filenameMatch = contentDisposition.match(
        /filename\*?=(?:UTF-8''\s*)?(?:"([^"]+)"|([^;,\n\r]+))/i
      );
      let fallbackFilename = filenameMatch
        ? (filenameMatch[1] || filenameMatch[2] || '').trim()
        : '';

      if (!fallbackFilename) {
        fallbackFilename = `${pluginName}-${file.name}.xml`;
      }
      if (!fallbackFilename.includes('.')) {
        fallbackFilename += '.xml';
      }

      const fallbackBlob = new Blob([runResponse.data], {
        type: contentType.includes('zip') ? 'application/xml' : contentType
      });

      convertedFiles.push(
        new File([fallbackBlob], fallbackFilename, {
          type: fallbackBlob.type || 'application/xml'
        })
      );
    }

    if (manifestResults.length > 0) {
      const currentConvertedFiles = [...getState().submit.convertedFiles];
      for (const fileResult of manifestResults) {
        const fileSources = [];
        if (Array.isArray(fileResult.sources)) {
          for (const sourceName of fileResult.sources) {
            const sourceFile = findFile(expandedFiles, sourceName);
            if (sourceFile) {
              fileSources.push(sourceFile);
            }
          }
        }
        if (fileResult.filename) {
          currentConvertedFiles.push({
            convertedFileName: fileResult.filename,
            fileSources
          });
        }
      }
      dispatch({
        type: types.CONVERTEDFILES,
        payload: currentConvertedFiles
      });
    }

    return { success: true, files: convertedFiles };
  } catch (error) {
    const message = error?.response?.data || error.message || 'Unknown plugin error';
    return {
      success: false,
      files: [],
      failedFiles: createFailedPluginFiles(expandedFiles.length ? expandedFiles : [file], pluginName, `${message}`)
    };
  } finally {
    for (const url of urlsToRevoke) {
      URL.revokeObjectURL(url);
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
  addingToCollection = false,
  pluginMapping = null
) {
  files = Array.isArray(files) ? files : files ? [files] : [];
  const filesUploading = getState().submit.filesUploading;
  const failedFiles = getState().submit.failedFiles;
  for (const file of files) {

    filesUploading.push({
      file: file,
      name: file.name,
      url: file.url, //unnecessary and most likely not even working anyway
      status: 'pending',
      errors: [],
      plugin: pluginMapping ? pluginMapping.get(file.name) : 'default'
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
    form.append('plugin', filesUploading[fileIndex].plugin || 'default')

    let response;

    try {
      response = await axios.post(url, form, { headers });
    } catch (error) {
      if (error.response) {
        console.error('Error:', error.message);
        var fileErrorMessages = error.response.data;
        fileErrorMessages =
          fileErrorMessages.charAt(0) !== '['
            ? [fileErrorMessages]
            : JSON.parse(fileErrorMessages);
      }
    }

    if (response && response.status === 200) {
      filesUploading[fileIndex].status = 'successful';

      var convertedFiles = getState().submit.convertedFiles
      convertedFiles = convertedFiles.filter(item => item["convertedFileName"] !== filesUploading[fileIndex].name)

      dispatch({
        type: types.CONVERTEDFILES,
        payload: convertedFiles
      })

    } else {
      if (response) {
        var fileErrorMessages = await response.text();
        fileErrorMessages =
          fileErrorMessages.charAt(0) !== '['
            ? [fileErrorMessages]
            : JSON.parse(fileErrorMessages);
      }

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
  const zipped = await zip.generateAsync({ type: 'blob' });

  // const token = getState().user.token;

  // const url = `${publicRuntimeConfig.backend}/submit`;
  // const headers = {
  //   Accept: 'text/plain; charset=UTF-8',
  //   'X-authorization': token
  // };

  dispatch(
    submit(
      uri,
      zipped,
      1,
      false,
      null
    )
  );

  // const form = new FormData();
  // form.append('rootCollections', uri);
  // form.append('file', zipped);
  // form.append('overwrite_merge', 2);


  // let response;

  // try {
  //   response = await axios.post(url, form, { headers });
  // } catch (error) {
  //   if (error.response) {
  //     console.error('Error:', error.message);
  //   }
  // }

  // if (response && response.status === 200) {
  //   for (var index = 0; index < files.length; index++)
  //     files[index].status = 'successful';
  // } else {
  //   var fileErrorMessages = await response.data;
  //   fileErrorMessages =
  //     fileErrorMessages.charAt(0) !== '['
  //       ? [fileErrorMessages]
  //       : JSON.parse(fileErrorMessages);
  //   const newFailedFiles = getState().submit.failedFiles;
  //   for (var fileIndex = 0; fileIndex < files.length; fileIndex++) {
  //     const file = files[fileIndex];
  //     file.status = 'failed';
  //     file.errors = fileErrorMessages;
  //     newFailedFiles.push(file);
  //     files.splice(fileIndex, 1);
  //     fileIndex -= 1;
  //   }
  //   dispatch({ type: types.FILEFAILED, payload: true });
  //   dispatch({
  //     type: types.FAILEDFILES,
  //     payload: [...newFailedFiles]
  //   });
  // }

  // dispatch({
  //   type: types.ATTACHMENTSUPLOADING,
  //   payload: [...getState().submit.attachmentsUploading]
  // });
  // if (getState().submit.failedFiles.length === 0)
  //   dispatch({ type: types.FILEFAILED, payload: false });
  // dispatch({
  //   type: types.SUBMITTING,
  //   payload: false
  // });
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
    let submissions;
    if (data) {
      submissions = data.data;
      // Your logic for handling submissions goes here
    } else {
      // Logic in case data is undefined or null
      console.error('No data received');
    }
    url = `${publicRuntimeConfig.backend}/shared`;
    try {
      data = await axios.get(url, { headers });
    } catch (error) {
      if (error.response) {
        console.error('Error:', error.message);
      }
    }
    let sharedSubmissions;
    if (data) {
      sharedSubmissions = data.data;
      // Your logic for handling submissions goes here
    } else {
      // Logic in case data is undefined or null
      console.error('No shared data received');
    }

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
    // Log out user and redirect to login when backend is unavailable
    dispatch(logoutUser());
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
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
  (files, pluginsUseLocalCompose = false, plugin = false, pluginName = null, pluginData = null, pluginLocalComposePrefix = null) =>
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
          pluginData,
          pluginsUseLocalCompose,
          pluginLocalComposePrefix
        );
      });

      Promise.allSettled(zippedFilePromises).then(results => {
        dispatch({ type: types.DOWNLOADSTATUS, payload: 'Zipping' });
        for (const result of results) {
          if (result.status === 'fulfilled') {
            let filename;
            filename = result.value.file.name;

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
  pluginData,
  pluginsUseLocalCompose = false,
  pluginLocalComposePrefix = ''
) => {
  return new Promise((resolve, reject) => {
    axios(
      plugin
        ? {
          headers: {
            'Accept': 'application/octet-stream',
            'X-authorization': token
          },
          url: `${publicRuntimeConfig.backend}/callPlugin`,
          method: 'POST',
          responseType: 'blob',
          data: {
            name: pluginName,
            endpoint: 'run',
            data: pluginData,
            category: 'download',
            prefix: pluginsUseLocalCompose ? pluginLocalComposePrefix : '',
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

          // simple extraction from Content-Disposition header (original behavior)
          const cd = (response.headers['content-disposition'] || response.headers['Content-Disposition'] || '') + '';
          const m = cd.match(/filename\*?=(?:UTF-8''\s*)?(?:"([^"]+)"|([^;,\n\r]+))/i);
          let filename = m ? (m[1] || m[2] || '').trim() : '';

          // Fallback: if header not present, construct filename from file.name and file.type
          if (!filename) {
            filename = `${file.name}.${file.type || 'xml'}`;
          }

          file.name = filename;
          response.fileName = filename;

          resolve({ file, response });
        } else {
          console.error('Failed to download file:', file.url);
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

export const restoreBasket = (token) => async (dispatch) => {
  const basket = JSON.parse(localStorage.getItem('basket'));
  const theme = JSON.parse(localStorage.getItem('theme')) || {};
  if (basket) {
    for (let i = 0; i < basket.length; i++) {
      const exists = await checkUriExists(basket[i].uri.replace(theme.uriPrefix, ''), token);
      if (!exists) {
          console.log("item does not exist");
          dispatch(clearBasket([basket[i]]));
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

async function checkUriExists(url, token) {

  const uri = `${publicRuntimeConfig.backend}/${url}`;

  const headers = {
    'Accept': 'application/sparql-results+json',
    'X-authorization': token
  };

  try {
    const response = await axios.get(uri, { headers });

    const data = await response.data;

    // Check if there are any bindings in the results
    const bindings = data;
    if (bindings && bindings.length > 0) {
      return true; // URI exists
    } else {
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

export const hidePluginSection = pluginName => dispatch => {
  dispatch({
    type: types.HIDE_PLUGIN_SECTION,
    payload: `PLUGIN: ${pluginName}`
  });
};

export const showPluginSection = pluginName => dispatch => {
  dispatch({
    type: types.SHOW_PLUGIN_SECTION,
    payload: `PLUGIN: ${pluginName}`
  });
};

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
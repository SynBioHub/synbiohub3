// REDUX ACTION TYPES

/*
This file stores all the 'types', which are used by the reducers (see ./reducers.js)
and actions (see ./actions.js) to update the redux state. These types are stored here,
rather than being typed out twice in actions and reducers, for consistency (reduces typos)
and code reusability.
*/

// USER
export const USERNAME = 'USERNAME';
export const USERTOKEN = 'USERTOKEN';
export const LOGGEDIN = 'LOGGEDIN';
export const LOGINERROR = 'LOGINERROR';
export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';

// SEARCH
export const QUERY = 'QUERY';
export const OFFSET = 'OFFSET';
export const LIMIT = 'LIMIT';

// SUBMIT
export const SUBMITRESET = 'SUBMITRESET';
export const SUBMITTING = 'SUBMITTING';
export const SHOWSUBMITPROGRESS = 'SHOWSUBMITPROGRESS';
export const FILESUPLOADING = 'FILESUPLOADING';
export const ATTACHMENTSUPLOADING = 'ATTACHMENTSUPLOADING';
export const FILEFAILED = 'FILEFAILED';
export const CANSUBMITTO = 'CANSUBMITTO';
export const GETTINGCANSUBMITTO = 'GETTINGCANSUBMITTO';

// CREATE COLLECTION
export const CREATINGCOLLECTION = 'CREATINGCOLLECTION';
export const CREATINGCOLLECTIONERRORS = 'CREATINGCOLLECTIONERRORS';

// BASKET
export const ADDTOBASKET = 'ADDTOBASKET';

// TRACKING
export const TRACKPAGEVISIT = 'TRACKPAGEVISIT';

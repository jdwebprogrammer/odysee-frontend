// @flow
import * as ACTIONS from 'constants/action_types';
import { selectShowMatureContent } from 'redux/selectors/settings';
import { selectClaimForUri, selectClaimIsNsfwForUri } from 'redux/selectors/claims';
import { doResolveUris } from 'redux/actions/claims';
import { buildURI, isURIValid } from 'util/lbryURI';
import { batchActions } from 'util/batch-actions';
import { makeSelectSearchUrisForQuery, selectSearchValue } from 'redux/selectors/search';
import { selectUser } from 'redux/selectors/user';
import handleFetchResponse from 'util/handle-fetch';
import { getSearchQueryString } from 'util/query-params';
import { getRecommendationSearchOptions } from 'util/search';
import { SEARCH_SERVER_API, SEARCH_SERVER_API_ALT } from 'config';
import { SEARCH_OPTIONS } from 'constants/search';

// ****************************************************************************
// FYP
// ****************************************************************************
// TODO: This should be part of `extras/recsys/recsys`, but due to the circular
// dependency problem with `extras`, I'm temporarily placing it. The recsys
// object should be moved into `ui`, but that change will require more testing.

const recsysFyp = {
  fetchPersonalRecommendations: (userId: string) => {
    return fetch(`https://recsys.odysee.com/v1/u/${userId}/fyp`)
      .then((response) => response.json())
      .then((result) => result)
      .catch((error) => {
        console.log('FYP: fetch', { error, userId });
        return {};
      });
  },

  markPersonalRecommendations: (userId: string, gid: string) => {
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`https://recsys.odysee.com/v1/u/${userId}/fyp/${gid}/mark`);
      }
    } catch (error) {
      console.log('FYP: mark', { error, userId, gid });
    }
  },
};

// ****************************************************************************
// ****************************************************************************

type Dispatch = (action: any) => any;
type GetState = () => { claims: any, search: SearchState, user: User };

type SearchOptions = {
  size?: number,
  from?: number,
  related_to?: string,
  nsfw?: boolean,
  isBackgroundSearch?: boolean,
};

let lighthouse = {
  CONNECTION_STRING: SEARCH_SERVER_API,
  user_id: '',

  search: (queryString: string) => fetch(`${lighthouse.CONNECTION_STRING}?${queryString}`).then(handleFetchResponse),

  searchRecommendations: (queryString: string) => {
    if (lighthouse.user_id) {
      return fetch(`${SEARCH_SERVER_API_ALT}?${queryString}${lighthouse.user_id}`).then(handleFetchResponse);
    } else {
      return fetch(`${SEARCH_SERVER_API_ALT}?${queryString}`).then(handleFetchResponse);
    }
  },
};

export const setSearchApi = (endpoint: string) => {
  lighthouse.CONNECTION_STRING = endpoint.replace(/\/*$/, '/'); // exactly one slash at the end;
};

export const setSearchUserId = (userId: ?string) => {
  lighthouse.user_id = userId ? `&user_id=${userId}` : '';
};

/**
 * Processes a lighthouse-formatted search result to an array of uris.
 * @param results
 */
const processLighthouseResults = (results: Array<any>) => {
  const uris = [];

  results.forEach((item) => {
    if (item) {
      const { name, claimId } = item;
      const urlObj: LbryUrlObj = {};

      if (name.startsWith('@')) {
        urlObj.channelName = name;
        urlObj.channelClaimId = claimId;
      } else {
        urlObj.streamName = name;
        urlObj.streamClaimId = claimId;
      }

      const url = buildURI(urlObj);
      if (isURIValid(url)) {
        uris.push(url);
      }
    }
  });

  return uris;
};

export const doSearch = (rawQuery: string, searchOptions: SearchOptions) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  const query = rawQuery.replace(/^lbry:\/\//i, '').replace(/\//, ' ');

  if (!query) {
    dispatch({
      type: ACTIONS.SEARCH_FAIL,
    });
    return;
  }

  const state = getState();

  const queryWithOptions = getSearchQueryString(query, searchOptions);

  const size = searchOptions.size;
  const from = searchOptions.from;

  // If we have already searched for something, we don't need to do anything
  const urisForQuery = makeSelectSearchUrisForQuery(queryWithOptions)(state);
  if (urisForQuery && !!urisForQuery.length) {
    if (!size || !from || from + size < urisForQuery.length) {
      return;
    }
  }

  dispatch({
    type: ACTIONS.SEARCH_START,
  });

  const cmd = searchOptions.hasOwnProperty(SEARCH_OPTIONS.RELATED_TO)
    ? lighthouse.searchRecommendations
    : lighthouse.search;

  cmd(queryWithOptions)
    .then((data: { body: Array<{ name: string, claimId: string }>, poweredBy: string }) => {
      const { body: result, poweredBy } = data;
      const uris = processLighthouseResults(result);

      const actions = [];
      actions.push(doResolveUris(uris));
      actions.push({
        type: ACTIONS.SEARCH_SUCCESS,
        data: {
          query: queryWithOptions,
          from: from,
          size: size,
          uris,
          recsys: poweredBy,
        },
      });

      dispatch(batchActions(...actions));
    })
    .catch(() => {
      dispatch({
        type: ACTIONS.SEARCH_FAIL,
      });
    });
};

export const doUpdateSearchOptions = (newOptions: SearchOptions, additionalOptions: SearchOptions) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  const state = getState();
  const searchValue = selectSearchValue(state);

  dispatch({
    type: ACTIONS.UPDATE_SEARCH_OPTIONS,
    data: newOptions,
  });

  if (searchValue) {
    // After updating, perform a search with the new options
    dispatch(doSearch(searchValue, additionalOptions));
  }
};

export const doSetMentionSearchResults = (query: string, uris: Array<string>) => (dispatch: Dispatch) => {
  dispatch({
    type: ACTIONS.SET_MENTION_SEARCH_RESULTS,
    data: { query, uris },
  });
};

export const doFetchRecommendedContent = (uri: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const claim = selectClaimForUri(state, uri);
  const matureEnabled = selectShowMatureContent(state);
  const claimIsMature = selectClaimIsNsfwForUri(state, uri);

  if (claim && claim.value && claim.claim_id) {
    const options: SearchOptions = getRecommendationSearchOptions(matureEnabled, claimIsMature, claim.claim_id);
    const { title } = claim.value;

    if (title && options) {
      dispatch(doSearch(title, options));
    }
  }
};

export const doFetchPersonalRecommendations = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const user = selectUser(state);

  if (!user || !user.id) {
    dispatch({ type: ACTIONS.FYP_FETCH_FAILED });
    return;
  }

  recsysFyp
    .fetchPersonalRecommendations(user.id)
    .then((data) => {
      const { gid, recs } = data;
      if (gid && recs) {
        dispatch({
          type: ACTIONS.FYP_FETCH_SUCCESS,
          data: {
            gid,
            uris: processLighthouseResults(recs),
          },
        });
      } else {
        dispatch({ type: ACTIONS.FYP_FETCH_FAILED });
      }
    })
    .catch(() => {
      dispatch({ type: ACTIONS.FYP_FETCH_FAILED });
    });
};

export { lighthouse, recsysFyp };

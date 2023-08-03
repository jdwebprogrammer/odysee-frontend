import { connect } from 'react-redux';
import {
  selectById,
  selectClaimsByUri,
  selectClaimSearchByQuery,
  selectClaimSearchByQueryLastPageReached,
  selectFetchingClaimSearch,
} from 'redux/selectors/claims';
import { doClaimSearch, doResolveClaimIds, doResolveUris } from 'redux/actions/claims';
import { doFetchThumbnailClaimsForCollectionIds } from 'redux/actions/collections';
import * as SETTINGS from 'constants/settings';
import { selectFollowedTags } from 'redux/selectors/tags';
import { selectMutedAndBlockedChannelIds } from 'redux/selectors/blocked';
import { doFetchOdyseeMembershipForChannelIds } from 'redux/actions/memberships';
import { selectClientSetting, selectShowMatureContent, selectLanguage } from 'redux/selectors/settings';

import ClaimListDiscover from './view';

function resolveHideMembersOnly(global, override) {
  return override === undefined || override === null ? global : override;
}

// prettier-ignore
const select = (state, props) => ({
  followedTags: selectFollowedTags(state),
  claimSearchByQuery: selectClaimSearchByQuery(state),
  claimSearchByQueryLastPageReached: selectClaimSearchByQueryLastPageReached(state),
  claimsByUri: selectClaimsByUri(state),
  claimsById: selectById(state),
  loading: props.loading !== undefined ? props.loading : selectFetchingClaimSearch(state),
  showNsfw: selectShowMatureContent(state),
  hideMembersOnly: resolveHideMembersOnly(selectClientSetting(state, SETTINGS.HIDE_MEMBERS_ONLY_CONTENT), props.hideMembersOnly),
  hideReposts: selectClientSetting(state, SETTINGS.HIDE_REPOSTS),
  languageSetting: selectLanguage(state),
  searchInLanguage: selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE),
  mutedAndBlockedChannelIds: selectMutedAndBlockedChannelIds(state),
});

const perform = {
  doClaimSearch,
  doFetchOdyseeMembershipForChannelIds,
  doResolveClaimIds,
  doResolveUris,
  doFetchThumbnailClaimsForCollectionIds,
};

export default connect(select, perform)(ClaimListDiscover);

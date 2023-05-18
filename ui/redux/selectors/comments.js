// @flow
import { createSelector } from 'reselect';
import { createCachedSelector } from 're-reselect';
import { selectGeoBlockLists, selectMutedChannels } from 'redux/selectors/blocked';
import { selectShowMatureContent } from 'redux/selectors/settings';
import { selectMentionSearchResults, selectMentionQuery } from 'redux/selectors/search';
import { selectUserLocale } from 'redux/selectors/user';
import { selectBlacklistedOutpointMap, selectFilteredOutpointMap } from 'lbryinc';
import {
  selectClaimsById,
  selectMyClaimIdsRaw,
  selectMyChannelClaimIds,
  selectClaimIdForUri,
  selectClaimIdsByUri,
} from 'redux/selectors/claims';
import { isClaimNsfw, getChannelFromClaim } from 'util/claim';
import { selectSubscriptionUris } from 'redux/selectors/subscriptions';
import { getCommentsListTitle } from 'util/comments';
import { getGeoRestrictionForClaim } from 'util/geoRestriction';

type State = { claims: any, comments: CommentsState, user: UserState };

const selectState = (state) => state.comments || {};

export const selectCommentsById = (state: State) => selectState(state).commentById || {};
export const selectCommentIdsByClaimId = (state: State) => selectState(state).byId;
export const selectIsFetchingComments = (state: State) => selectState(state).isLoading;
export const selectIsFetchingCommentsByParentId = (state: State) => selectState(state).isLoadingByParentId;
export const selectIsFetchingReacts = (state: State) => selectState(state).isFetchingReacts;

export const selectMyReacts = (state: State) => state.comments.myReactsByCommentId;
export const selectMyReactsForComment = (state: State, commentIdChannelId: string) => {
  // @commentIdChannelId: Format = 'commentId:MyChannelId'
  return state.comments.myReactsByCommentId && state.comments.myReactsByCommentId[commentIdChannelId];
};
export const selectIsFetchingCommentsForParentId = (state: State, parentId: string) => {
  return selectIsFetchingCommentsByParentId(state)[parentId];
};
export const selectIsFetchingTopLevelComments = (state: State) => {
  const isFetching = selectIsFetchingComments(state);
  const notFetchingReplies = Object.keys(selectIsFetchingCommentsByParentId(state)).length === 0;
  return isFetching && notFetchingReplies;
};

export const selectOthersReacts = (state: State) => state.comments.othersReactsByCommentId;
export const selectOthersReactsForComment = (state: State, id: string) => {
  return state.comments.othersReactsByCommentId && state.comments.othersReactsByCommentId[id];
};

export const selectPinnedCommentsForUri = createCachedSelector(
  selectClaimIdForUri,
  (state: State) => state.comments.commentById,
  (state: State) => state.comments.pinnedCommentsById,
  (claimId, byId, pinnedCommentsById) => {
    const pinnedCommentIds = pinnedCommentsById && pinnedCommentsById[claimId];
    const pinnedComments = [];

    if (pinnedCommentIds) {
      pinnedCommentIds.forEach((commentId) => {
        pinnedComments.push(byId[commentId]);
      });
    }

    return pinnedComments;
  }
)((state, uri) => String(uri));

export const selectModerationBlockList = createSelector(
  (state) => selectState(state).moderationBlockList,
  (moderationBlockList) => {
    return moderationBlockList ? moderationBlockList.reverse() : [];
  }
);
export const selectAdminBlockList = createSelector(selectState, (state) =>
  state.adminBlockList ? state.adminBlockList.reverse() : []
);
export const selectModeratorBlockList = createSelector(selectState, (state) =>
  state.moderatorBlockList ? state.moderatorBlockList.reverse() : []
);

export const selectPersonalTimeoutMap = (state: State) => selectState(state).personalTimeoutMap;
export const selectAdminTimeoutMap = (state: State) => selectState(state).adminTimeoutMap;
export const selectModeratorTimeoutMap = (state: State) => selectState(state).moderatorTimeoutMap;
export const selectModeratorBlockListDelegatorsMap = (state: State) =>
  selectState(state).moderatorBlockListDelegatorsMap;
export const selectTogglingForDelegatorMap = (state: State) => selectState(state).togglingForDelegatorMap;
export const selectBlockingByUri = (state: State) => selectState(state).blockingByUri;
export const selectUnBlockingByUri = (state: State) => selectState(state).unBlockingByUri;
export const selectFetchingModerationBlockList = (state: State) => selectState(state).fetchingModerationBlockList;
export const selectModerationDelegatesById = (state: State) => selectState(state).moderationDelegatesById;
export const selectModerationDelegatorsById = (state: State) => selectState(state).moderationDelegatorsById;

export const selectHasAdminChannel = createSelector(selectState, (state) => {
  const myChannelIds = Object.keys(state.moderationDelegatorsById);
  for (let i = 0; i < myChannelIds.length; ++i) {
    const id = myChannelIds[i];
    if (state.moderationDelegatorsById[id] && state.moderationDelegatorsById[id].global) {
      return true;
    }
  }
  return false;

  /// Lint doesn't like this:
  // return Object.values(state.moderationDelegatorsById).some((x) => x.global);
});

export const selectCommentsByClaimId = createSelector(selectState, selectCommentsById, (state, byId) => {
  const byClaimId = state.byId || {};
  const comments = {};

  // replace every comment_id in the list with the actual comment object
  Object.keys(byClaimId).forEach((claimId: string) => {
    const commentIds = byClaimId[claimId];

    comments[claimId] = Array(commentIds === null ? 0 : commentIds.length);
    for (let i = 0; i < commentIds.length; i++) {
      comments[claimId][i] = byId[commentIds[i]];
    }
  });

  return comments;
});

export const selectSuperchatsByUri = (state: State) => selectState(state).superChatsByUri;

export const selectTopLevelCommentsByClaimId = createSelector(
  (state) => selectState(state).topLevelCommentsById,
  selectCommentsById,
  (topLevelCommentsById, byId) => {
    const byClaimId = topLevelCommentsById || {};
    const comments = {};

    // replace every comment_id in the list with the actual comment object
    Object.keys(byClaimId).forEach((claimId) => {
      const commentIds = byClaimId[claimId];

      comments[claimId] = Array(commentIds === null ? 0 : commentIds.length);
      for (let i = 0; i < commentIds.length; i++) {
        comments[claimId][i] = byId[commentIds[i]];
      }
    });

    return comments;
  }
);

export const selectCommentForCommentId = createSelector(
  (state, commentId) => commentId,
  selectCommentsById,
  (commentId, comments) => comments[commentId]
);

export const selectFetchedCommentAncestors = (state: State) => selectState(state).fetchedCommentAncestors;

export const selectCommentAncestorsForId = createSelector(
  (state, commentId) => commentId,
  selectFetchedCommentAncestors,
  (commentId, fetchedAncestors) => fetchedAncestors && fetchedAncestors[commentId]
);

export const selectCommentIdsForUri = (state: State, uri: string) => {
  const claimId = selectClaimIdForUri(state, uri);
  const commentIdsByClaimId = selectCommentIdsByClaimId(state);
  return commentIdsByClaimId[claimId];
};

const filterCommentsDepOnList = {
  claimsById: selectClaimsById,
  myClaimIds: selectMyClaimIdsRaw,
  myChannelClaimIds: selectMyChannelClaimIds,
  mutedChannels: selectMutedChannels,
  personalBlockList: selectModerationBlockList,
  blacklistedMap: selectBlacklistedOutpointMap,
  filteredMap: selectFilteredOutpointMap,
  showMatureContent: selectShowMatureContent,
  geoBlockList: selectGeoBlockLists,
  locale: selectUserLocale,
};

const filterCommentsPropKeys = Object.keys(filterCommentsDepOnList);

export const selectPendingCommentReacts = (state: State) => selectState(state).pendingCommentReactions;
export const selectSettingsByChannelId = (state: State) => selectState(state).settingsByChannelId;
export const selectFetchingCreatorSettings = (state: State) => selectState(state).fetchingSettings;
export const selectFetchingBlockedWords = (state: State) => selectState(state).fetchingBlockedWords;

export const selectSettingsForChannelId = (state: State, channelId: ClaimId) => {
  const settingsById = selectSettingsByChannelId(state);
  return settingsById && settingsById[channelId];
};

export const selectCommentsEnabledSettingForChannelId = (state: State, channelId: ClaimId) => {
  const channelSettings = selectSettingsForChannelId(state, channelId);
  return channelSettings && channelSettings.comments_enabled;
};
export const selectCommentsDisabledSettingForChannelId = (state: State, channelId: ClaimId) =>
  selectCommentsEnabledSettingForChannelId(state, channelId) === false;

export const selectLivestreamChatMembersOnlyForChannelId = (state: State, channelId: ClaimId) => {
  const channelSettings = selectSettingsForChannelId(state, channelId);
  return channelSettings && channelSettings.livestream_chat_members_only;
};

export const selectMembersOnlyCommentsForChannelId = (state: State, channelId: ClaimId) => {
  const channelSettings = selectSettingsForChannelId(state, channelId);
  return channelSettings && channelSettings.comments_members_only;
};

export const selectSectionsForChannelId = (state: State, channelId: ClaimId) => {
  const channelSettings = selectSettingsForChannelId(state, channelId);
  return channelSettings?.channel_sections;
};

/**
 * Returns a sorted list of FeaturedChannelsSection for the given channel-id.
 * @return (channelId) => Array<FeaturedChannelsSection> | undefined
 */
export const selectFeaturedChannelsForChannelId = createCachedSelector(
  selectSettingsForChannelId,
  (channelSettings) => {
    const sections: Sections = channelSettings?.channel_sections;
    if (sections && sections.entries) {
      // $FlowIssue
      return Object.values(sections.entries).filter((x) => x.value_type === 'featured_channels');
    }
  }
)((state, channelId) => String(channelId));

export const selectCommentsForUri = createCachedSelector(
  (state, uri) => uri,
  selectCommentsByClaimId,
  selectClaimIdForUri,
  ...Object.values(filterCommentsDepOnList),
  (uri, byClaimId, claimId, ...filterInputs) => {
    const comments = byClaimId && byClaimId[claimId];
    return filterComments(comments, claimId, filterInputs);
  }
)((state, uri) => String(uri));

export const selectTopLevelCommentsForUri = createCachedSelector(
  (state, uri) => uri,
  (state, uri, maxCount) => maxCount,
  selectTopLevelCommentsByClaimId,
  selectClaimIdForUri,
  ...Object.values(filterCommentsDepOnList),
  (uri, maxCount = -1, byClaimId, claimId, ...filterInputs) => {
    const comments = byClaimId && byClaimId[claimId];
    if (comments) {
      return filterComments(maxCount > 0 ? comments.slice(0, maxCount) : comments, claimId, filterInputs);
    } else {
      return [];
    }
  }
)((state, uri, maxCount = -1) => `${String(uri)}:${maxCount}`);

export const selectTopLevelTotalPagesForUri = (state: State, uri: string) => {
  const claimId = selectClaimIdForUri(state, uri);
  return state.comments.topLevelTotalPagesById[claimId] || 0;
};

export const selectRepliesForParentId = createCachedSelector(
  (state, id) => id,
  (state) => selectState(state).repliesByParentId,
  selectCommentsById,
  ...Object.values(filterCommentsDepOnList),
  (id, repliesByParentId, commentsById, ...filterInputs) => {
    // const claimId = byUri[uri]; // just parentId (id)
    const replyIdsForParent = repliesByParentId[id] || [];
    if (!replyIdsForParent.length) return [];

    const comments = [];
    replyIdsForParent.forEach((cid) => {
      comments.push(commentsById[cid]);
    });
    // const comments = byParentId && byParentId[id];

    return filterComments(comments, undefined, filterInputs);
  }
)((state, id: string) => String(id));

/**
 * filterComments
 *
 * @param comments List of comments to filter.
 * @param claimId The claim that `comments` reside in.
 * @param filterInputs Values returned by filterCommentsDepOnList.
 */
const filterComments = (comments: Array<Comment>, claimId?: string, filterInputs: any) => {
  const filterProps = filterInputs.reduce((acc, cur, i) => {
    acc[filterCommentsPropKeys[i]] = cur;
    return acc;
  }, {});

  const {
    claimsById,
    myClaimIds,
    myChannelClaimIds,
    mutedChannels,
    personalBlockList,
    blacklistedMap,
    filteredMap,
    showMatureContent,
    geoBlockList,
    locale,
  } = filterProps;

  return comments
    ? comments.filter((comment) => {
        if (!comment) {
          // It may have been recently deleted after being blocked
          return false;
        }

        const channelClaim = claimsById[comment.channel_id];

        // Return comment if `channelClaim` doesn't exist so the component knows to resolve the author
        if (channelClaim) {
          if ((myClaimIds && myClaimIds.size > 0) || (myChannelClaimIds && myChannelClaimIds.length > 0)) {
            const claimIsMine =
              channelClaim.is_my_output ||
              myChannelClaimIds.includes(channelClaim.claim_id) ||
              myClaimIds.includes(channelClaim.claim_id);
            // TODO: I believe 'myClaimIds' does not include channels, so it seems wasteful to include it here?   ^
            if (claimIsMine) {
              return true;
            }
          }

          const outpoint = `${channelClaim.txid}:${channelClaim.nout}`;
          if (blacklistedMap[outpoint] || filteredMap[outpoint]) {
            return false;
          }

          if (!showMatureContent) {
            const claimIsMature = isClaimNsfw(channelClaim);
            if (claimIsMature) {
              return false;
            }
          }
        }

        if (claimId) {
          const claimIdIsMine = myClaimIds && myClaimIds.size > 0 && myClaimIds.includes(claimId);
          if (!claimIdIsMine) {
            if (personalBlockList.includes(comment.channel_url)) {
              return false;
            }
          }
        }

        if (channelClaim) {
          const geoRestriction: ?GeoRestriction = getGeoRestrictionForClaim(channelClaim, locale, geoBlockList);
          if (geoRestriction) {
            return false;
          }
        }

        return !mutedChannels.includes(comment.channel_url);
      })
    : [];
};

export const makeSelectTotalReplyPagesForParentId = (parentId: string) =>
  createSelector(selectState, (state) => {
    return state.repliesTotalPagesByParentId[parentId] || 0;
  });

export const selectTotalCommentsCountForUri = (state: State, uri: string) => {
  const claimId = selectClaimIdForUri(state, uri);
  return state.comments.totalCommentsById[claimId] || 0;
};

export const selectCommentsListTitleForUri = (state: State, uri: string) => {
  const totalComments = selectTotalCommentsCountForUri(state, uri);
  return getCommentsListTitle(totalComments);
};

// Personal list
export const makeSelectChannelIsBlocked = (uri: string) =>
  createSelector(selectModerationBlockList, (blockedChannelUris) => {
    if (!blockedChannelUris || !blockedChannelUris) {
      return false;
    }

    return blockedChannelUris.includes(uri);
  });

export const makeSelectChannelIsAdminBlocked = (uri: string) =>
  createSelector(selectAdminBlockList, (list) => {
    return list ? list.includes(uri) : false;
  });

export const makeSelectChannelIsModeratorBlockedForCreator = (uri: string, creatorUri: string) =>
  createSelector(selectModeratorBlockList, selectModeratorBlockListDelegatorsMap, (blockList, delegatorsMap) => {
    if (!blockList) return false;
    return blockList.includes(uri) && delegatorsMap[uri] && delegatorsMap[uri].includes(creatorUri);
  });

export const makeSelectIsTogglingForDelegator = (uri: string, creatorUri: string) =>
  createSelector(selectTogglingForDelegatorMap, (togglingForDelegatorMap) => {
    return togglingForDelegatorMap[uri] && togglingForDelegatorMap[uri].includes(creatorUri);
  });

export const makeSelectUriIsBlockingOrUnBlocking = (uri: string) =>
  createSelector(selectBlockingByUri, selectUnBlockingByUri, (blockingByUri, unBlockingByUri) => {
    return blockingByUri[uri] || unBlockingByUri[uri];
  });

export const selectHyperChatDataForUri = (state: State, uri: string) => {
  const byUri = selectSuperchatsByUri(state);
  return byUri[uri];
};

export const selectHyperChatsForUri = (state: State, uri: string) => {
  const hyperChatData = selectHyperChatDataForUri(state, uri);
  return hyperChatData ? hyperChatData.comments : undefined;
};

export const selectChannelMentionData = createCachedSelector(
  (state, uri) => uri,
  selectClaimIdsByUri,
  selectClaimsById,
  selectTopLevelCommentsForUri,
  selectSubscriptionUris,
  selectMentionSearchResults,
  selectMentionQuery,
  (uri, claimIdsByUri, claimsById, topLevelComments, subscriptionUris, searchUris, query) => {
    let canonicalCreatorUri;
    const commentorUris = [];
    const canonicalCommentors = [];
    const canonicalSubscriptions = [];
    const canonicalSearch = [];

    if (uri) {
      const claimId = claimIdsByUri[uri];
      const claim = claimsById[claimId];
      const channelFromClaim = claim && getChannelFromClaim(claim);
      canonicalCreatorUri = channelFromClaim && channelFromClaim.canonical_url;

      topLevelComments.forEach(({ channel_url: uri }) => {
        // Check: if there are duplicate commentors
        if (!commentorUris.includes(uri)) {
          // Update: commentorUris
          commentorUris.push(uri);

          // Update: canonicalCommentors
          const claimId = claimIdsByUri[uri];
          const claim = claimsById[claimId];
          if (claim && claim.canonical_url) {
            canonicalCommentors.push(claim.canonical_url);
          }
        }
      });
    }

    subscriptionUris.forEach((uri) => {
      // Update: canonicalSubscriptions
      const claimId = claimIdsByUri[uri];
      const claim = claimsById[claimId];
      if (claim && claim.canonical_url) {
        canonicalSubscriptions.push(claim.canonical_url);
      }
    });

    let hasNewResolvedResults = false;
    if (searchUris && searchUris.length > 0) {
      searchUris.forEach((uri) => {
        // Update: canonicalSubscriptions
        const claimId = claimIdsByUri[uri];
        const claim = claimsById[claimId];
        if (claim && claim.canonical_url) {
          canonicalSearch.push(claim.canonical_url);
        }
      });
      hasNewResolvedResults = canonicalSearch.length > 0;
    }

    return {
      canonicalCommentors,
      canonicalCreatorUri,
      canonicalSearch,
      canonicalSubscriptions,
      commentorUris,
      hasNewResolvedResults,
      query,
    };
  }
)((state, uri, maxCount) => `${String(uri)}:${maxCount}`);

/**
 * Returns the list of your channel IDs that have commented on the given claim.
 *
 * @param state
 * @param claimId
 * @returns {null | undefined | Array<string>} 'undefined' = "not fetched for this ID"; 'null' = "no claim";
 */
export const selectMyCommentedChannelIdsForId = (state: State, claimId: string) => {
  return claimId ? selectState(state).myCommentedChannelIdsById[claimId] : null;
};

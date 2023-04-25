// @flow
import type { DoFetchClaimListMine } from 'redux/actions/claims';

import './style.scss';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import React, { useEffect } from 'react';
import Button from 'component/button';
import ClaimList from 'component/claimList';
import ClaimPreview from 'component/claimPreview';
import ClaimSearchView from 'component/claimSearchView';
import Page from 'component/page';
import Paginate from 'component/common/paginate';
import { PAGE_PARAM, PAGE_SIZE_PARAM } from 'constants/claim';
import { SCHEDULED_TAGS, VISIBILITY_TAGS } from 'constants/tags';
import WebUploadList from 'component/webUploadList';
import Spinner from 'component/spinner';
import Yrbl from 'component/yrbl';
import classnames from 'classnames';

type FilterInfo = { key: string, cmd: string, label: string, ariaLabel?: string };

const FILTER: { [string]: FilterInfo } = Object.freeze({
  ALL: { key: 'ALL', cmd: 'stream,repost', label: 'All', ariaLabel: 'All uploads' },
  UPLOADS: { key: 'UPLOADS', cmd: 'stream', label: 'Uploads' },
  REPOSTS: { key: 'REPOSTS', cmd: 'repost', label: 'Reposts' },
  UNLISTED: { key: 'UNLISTED', cmd: '', label: 'Unlisted' },
  SCHEDULED: { key: 'SCHEDULED', cmd: '', label: 'Scheduled' },
});

const METHOD = {
  CLAIM_LIST: 'CLAIM_LIST',
  CLAIM_SEARCH: 'CLAIM_SEARCH',
};

type Props = {
  uploadCount: number,
  checkPendingPublishes: () => void,
  clearPublish: () => void,
  fetchClaimListMine: DoFetchClaimListMine,
  fetching: boolean,
  urls: Array<string>,
  urlTotal: number,
  history: { replace: (string) => void, push: (string) => void },
  page: number,
  pageSize: number,
  myChannelIds: ?Array<ClaimId>,
  doClearClaimSearch: () => void,
};

function FileListPublished(props: Props) {
  const {
    uploadCount,
    checkPendingPublishes,
    clearPublish,
    fetchClaimListMine,
    fetching,
    urls,
    urlTotal,
    page,
    pageSize,
    myChannelIds,
    doClearClaimSearch,
  } = props;

  const [filterBy, setFilterBy] = React.useState(FILTER.ALL.key);
  const method =
    filterBy === FILTER.UNLISTED.key || filterBy === FILTER.SCHEDULED.key ? METHOD.CLAIM_SEARCH : METHOD.CLAIM_LIST;

  const params = React.useMemo(() => {
    return {
      [PAGE_PARAM]: Number(page),
      [PAGE_SIZE_PARAM]: Number(pageSize),
    };
  }, [page, pageSize]);

  const csOptions: ClaimSearchOptions = React.useMemo(() => {
    return {
      page_size: 20,
      any_tags: [VISIBILITY_TAGS.UNLISTED],
      channel_ids: myChannelIds || [],
      claim_type: ['stream'],
      has_source: true,
      order_by: ['height'],
      remove_duplicates: true,
    };
  }, [myChannelIds]);

  const csOptionsScheduled: ClaimSearchOptions = React.useMemo(() => {
    return {
      page_size: 20,
      any_tags: [SCHEDULED_TAGS.SHOW, SCHEDULED_TAGS.HIDE],
      channel_ids: myChannelIds || [],
      claim_type: ['stream'],
      has_source: true,
      order_by: ['height'],
      remove_duplicates: true,
      release_time: `>${Math.floor(Date.now() / 1000)}`,
    };
  }, [myChannelIds]);

  function getHeaderJsx() {
    return (
      <div className={classnames('flp__header')}>
        <div className="flp__filter">
          {/* $FlowIgnore: mixed bug */}
          {Object.values(FILTER).map((info: FilterInfo) => (
            <Button
              button="alt"
              key={info.label}
              label={__(info.label)}
              aria-label={info.ariaLabel}
              onClick={() => setFilterBy(info.key)}
              className={classnames(`button-toggle`, { 'button-toggle--active': filterBy === info.key })}
            />
          ))}
        </div>
        <div className="flp__refresh">
          {!fetching && (
            <Button
              button="alt"
              label={__('Refresh')}
              icon={ICONS.REFRESH}
              onClick={() => {
                if (method === METHOD.CLAIM_LIST) {
                  fetchClaimListMine(params.page, params.page_size, true, FILTER[filterBy].cmd.split(','), true);
                } else {
                  doClearClaimSearch();
                }
              }}
            />
          )}
        </div>
      </div>
    );
  }

  function getClaimListResultsJsx() {
    return (
      <>
        {!!urls && (
          <>
            <ClaimList
              noEmpty
              persistedStorageKey="claim-list-published"
              uris={fetching ? [] : urls}
              loading={fetching}
            />
            {getFetchingPlaceholders()}
            <Paginate totalPages={urlTotal > 0 ? Math.ceil(urlTotal / Number(pageSize)) : 1} />
          </>
        )}
      </>
    );
  }

  function getClaimSearchResultsJsx() {
    const isUnlisted = filterBy === FILTER.UNLISTED.key;
    return (
      <ClaimSearchView
        key={isUnlisted ? 'unlisted' : 'scheduled'}
        csOptions={isUnlisted ? csOptions : csOptionsScheduled}
        layout="list"
        pagination="infinite"
        noUpperReleaseTimeLimit
      />
    );
  }

  function getFetchingPlaceholders() {
    return (
      <>
        {method === METHOD.CLAIM_LIST &&
          fetching &&
          new Array(Number(pageSize)).fill(1).map((x, i) => {
            return <ClaimPreview key={i} placeholder="loading" />;
          })}
      </>
    );
  }

  useEffect(() => {
    checkPendingPublishes();
  }, [checkPendingPublishes]);

  useEffect(() => {
    if (params && fetchClaimListMine && method === METHOD.CLAIM_LIST) {
      fetchClaimListMine(params.page, params.page_size, true, FILTER[filterBy].cmd.split(','));
    }
  }, [uploadCount, params, filterBy, fetchClaimListMine, method]);

  return (
    <Page>
      <div className="card-stack">
        <WebUploadList />
        {getHeaderJsx()}
        {method === METHOD.CLAIM_LIST && getClaimListResultsJsx()}
        {method === METHOD.CLAIM_SEARCH && getClaimSearchResultsJsx()}
      </div>
      {!(urls && urls.length) && method === METHOD.CLAIM_LIST && (
        <React.Fragment>
          {!fetching ? (
            <section className="main--empty">
              <Yrbl
                title={filterBy === FILTER.REPOSTS ? __('No Reposts') : __('No uploads')}
                subtitle={
                  filterBy === FILTER.REPOSTS
                    ? __("You haven't reposted anything yet.")
                    : __("You haven't uploaded anything yet. This is where you can find them when you do!")
                }
                actions={
                  filterBy !== FILTER.REPOSTS && (
                    <div className="section__actions">
                      <Button
                        button="primary"
                        navigate={`/$/${PAGES.UPLOAD}`}
                        label={__('Upload Something New')}
                        onClick={() => clearPublish()}
                      />
                    </div>
                  )
                }
              />
            </section>
          ) : (
            <section className="main--empty">
              <Spinner delayed />
            </section>
          )}
        </React.Fragment>
      )}
    </Page>
  );
}

export default FileListPublished;

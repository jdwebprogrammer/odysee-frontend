// @flow
import React from 'react';

import { formatDateToMonthAndDay } from 'util/time';

import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';

import Card from 'component/common/card';
import Button from 'component/button';
import JoinMembershipCard from 'component/creatorMemberships/joinMembershipCard';
import moment from 'moment';
import BalanceText from 'react-balance-text';
import ClearMembershipDataButton from 'component/common/clear-membership-data';

type Props = {
  uri: string,
  isModal: boolean,
  // -- redux --
  channelId: string,
  purchasedChannelMembership: MembershipData,
  doOpenModal: (id: string, {}) => void,
};

export default function MembershipChannelTab(props: Props) {
  const {
    uri,
    isModal,
    // -- redux --
    channelId,
    purchasedChannelMembership,
    doOpenModal,
  } = props;

  if (!purchasedChannelMembership) {
    return <JoinMembershipCard uri={uri} isChannelTab />;
  }

  const { Membership, MembershipDetails, Subscription, Perks } = purchasedChannelMembership;

  const { channel_name: creatorChannel, membership_id: membershipId, auto_renew: membershipIsActive } = Membership;
  const { name: membershipName, description: membershipDescription } = MembershipDetails;
  const { current_period_start: subscriptionStartDate, current_period_end: subscriptionEndDate } = Subscription;

  const startDate = subscriptionStartDate * 1000;
  const endDate = subscriptionEndDate * 1000;

  const amountOfMonths = moment(endDate).diff(moment(startDate), 'months', true);
  const timeAgo = amountOfMonths === 1 ? '1 month' : amountOfMonths + ' months';
  const formattedEndOfMembershipDate = formatDateToMonthAndDay(subscriptionEndDate * 1000);

  return (
    <Card
      title={__('Your %creator_channel_name% membership', { creator_channel_name: creatorChannel })}
      className="membership membership-tab"
      subtitle={
        <>
          <h1 className="join-membership-support-time__header">
            {__(
              membershipIsActive
                ? "You've been supporting %channel_name% for %membership_duration%"
                : 'You supported %channel_name% for %membership_duration%',
              { channel_name: creatorChannel, membership_duration: timeAgo }
            )}
          </h1>
          <h1 className="join-membership-support-time__header">{__("I'm sure they appreciate it!")}</h1>
        </>
      }
      body={
        <div className="membership__body">
          <h1 className="membership__plan-header">{membershipName}</h1>

          <h1 className="membership__plan-description">
            <BalanceText>{membershipDescription}</BalanceText>
          </h1>

          {Perks && (
            <div className="membership__plan-perks">
              <h1 style={{ marginTop: '30px' }}>{isModal ? 'Perks:' : 'Perks'}</h1>

              <ul>
                {Perks.map((tierPerk, i) => (
                  <li key={tierPerk} className="membership__perk-item">
                    {tierPerk.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h1 className="join-membership-tab-renewal-date__header">
            {membershipIsActive
              ? __('Your membership will renew on %renewal_date%', { renewal_date: formattedEndOfMembershipDate })
              : __('Your cancelled membership will end on %end_date%', { end_date: formattedEndOfMembershipDate })}
          </h1>

          <div className="section__actions--centered">
            <Button
              className="join-membership-modal-purchase__button"
              icon={ICONS.FINANCE}
              button="secondary"
              type="submit"
              disabled={false}
              label={__('View Membership History')}
              navigate={`/${channelId}/membership_history`}
            />

            {membershipIsActive && (
              <Button
                className="join-membership-modal-purchase__button"
                style={{ 'margin-left': '1rem' }}
                icon={ICONS.DELETE}
                button="secondary"
                type="submit"
                disabled={false}
                label={`Cancel Membership`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  doOpenModal(MODALS.CANCEL_CREATOR_MEMBERSHIP, {
                    endOfMembershipDate: formattedEndOfMembershipDate,
                    membershipId,
                  });
                }}
              />
            )}
          </div>

          <ClearMembershipDataButton />
        </div>
      }
    />
  );
}
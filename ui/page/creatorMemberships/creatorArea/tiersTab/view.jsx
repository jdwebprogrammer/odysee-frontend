// @flow
import React from 'react';
import classnames from 'classnames';

import { v4 as uuid } from 'uuid';

import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';

import MembershipTier from './internal/membershipTier';
import EditingTier from './internal/editingTier';
import HelpHub from 'component/common/help-hub';

type Props = {
  // -- redux --
  bankAccountConfirmed: boolean,
  channelMemberships: CreatorMemberships,
  activeChannelClaim: ?ChannelClaim,
  doGetMembershipPerks: (params: MembershipListParams) => Promise<MembershipPerks>,
};

function TiersTab(props: Props) {
  const {
    // -- redux --
    bankAccountConfirmed,
    channelMemberships: fetchedMemberships,
    activeChannelClaim,
    doGetMembershipPerks,
  } = props;

  const fetchedMembershipsStr = fetchedMemberships && JSON.stringify(fetchedMemberships);

  const [editingIds, setEditingIds] = React.useState(() => []);
  const [channelMemberships, setChannelMemberships] = React.useState<any>(fetchedMemberships || []);

  function addEditingForMembershipId(membershipId) {
    setEditingIds((previousEditingIds) => {
      const newEditingIds = new Set(previousEditingIds);
      newEditingIds.add(membershipId);

      return Array.from(newEditingIds);
    });
  }

  function removeEditingForMembershipId(membershipId) {
    setEditingIds((previousEditingIds) => {
      const newEditingIds = new Set(previousEditingIds);
      newEditingIds.delete(membershipId);

      return Array.from(newEditingIds);
    });
  }

  function addMembershipForChannelId(membership) {
    setChannelMemberships((previousMemberships) => {
      const newChannelMemberships = new Set(previousMemberships);
      newChannelMemberships.add(membership);

      return Array.from(newChannelMemberships);
    });
  }

  function removeChannelMembershipForId(membershipId) {
    setChannelMemberships((previousMemberships) => {
      const newChannelMemberships = previousMemberships.filter(
        (membership) => membership.Membership.id !== membershipId
      );

      return newChannelMemberships;
    });
  }

  React.useEffect(() => {
    if (activeChannelClaim) {
      doGetMembershipPerks({ channel_name: activeChannelClaim.name, channel_id: activeChannelClaim.claim_id });
    }
  }, [activeChannelClaim, doGetMembershipPerks]);

  React.useEffect(() => {
    const fetchedMemberships = fetchedMembershipsStr && JSON.parse(fetchedMembershipsStr);
    setChannelMemberships(fetchedMemberships);
  }, [fetchedMembershipsStr]);

  if (!bankAccountConfirmed) {
    return (
      <>
        <div className="bank-account-status">
          <div>
            <label>{__('Bank Account Status')}</label>
            <span>{__('You have to connect a bank account before you can create tiers.')}</span>
          </div>
          <Button
            button="primary"
            label={__('Connect a bank account')}
            icon={ICONS.FINANCE}
            navigate={`$/${PAGES.SETTINGS_STRIPE_ACCOUNT}`}
          />
        </div>
      </>
    );
  }

  return (
    <div className={classnames('tier-edit-functionality', { 'edit-functionality-disabled': !bankAccountConfirmed })}>
      {channelMemberships &&
        channelMemberships.map((membershipTier, membershipIndex) => {
          const membershipId = membershipTier.Membership.id;
          const isEditing = new Set(editingIds).has(membershipId);
          const hasSubscribers = membershipTier.HasSubscribers;

          return (
            <div className="membership-tier__wrapper" key={membershipIndex}>
              {isEditing ? (
                <EditingTier
                  membership={membershipTier}
                  hasSubscribers={hasSubscribers}
                  removeEditing={() => removeEditingForMembershipId(membershipId)}
                  onCancel={() => {
                    removeEditingForMembershipId(membershipId);

                    if (typeof membershipId === 'string') {
                      removeChannelMembershipForId(membershipId);
                    }
                  }}
                />
              ) : (
                <MembershipTier
                  membership={membershipTier}
                  index={membershipIndex}
                  hasSubscribers={hasSubscribers}
                  addEditingId={() => addEditingForMembershipId(membershipId)}
                  removeMembership={() => removeChannelMembershipForId(membershipId)}
                />
              )}
            </div>
          );
        })}

      {(!channelMemberships || channelMemberships.length < 6) && (
        <Button
          button="primary"
          onClick={(e) => {
            const newestId = uuid(); // --> this will only be used locally when creating a new tier

            const newestMembership = {
              HasSubscribers: false,
              Membership: { id: newestId, name: 'Example Plan', description: '' },
              NewPrices: [{ Price: { amount: 500 } }],
              saved: false,
            };

            addEditingForMembershipId(newestId);
            addMembershipForChannelId(newestMembership);
          }}
          className="add-membership__button"
          label={__('Add Tier for %channel_name%', { channel_name: activeChannelClaim?.name || '' })}
          icon={ICONS.ADD}
        />
      )}

      {/* ** show additional info checkboxes, activate memberships button ***/}
      {/* ** disabling until the backend is ready ** */}
      {/* /!** additional options checkboxes **!/ */}
      {/* <div className="show-additional-membership-info__div"> */}
      {/*  <h2 className="show-additional-membership-info__header">Additional Info</h2> */}
      {/*  <FormField */}
      {/*    type="checkbox" */}
      {/*    defaultChecked={false} */}
      {/*    label={'Show the amount of supporters on your Become A Member page'} */}
      {/*    name={'showSupporterAmount'} */}
      {/*  /> */}
      {/*  <FormField */}
      {/*    type="checkbox" */}
      {/*    defaultChecked={false} */}
      {/*    label={'Show the amount you make monthly on your Become A Member page'} */}
      {/*    name={'showMonthlyIncomeAmount'} */}
      {/*  /> */}
      {/* </div> */}

      {/* /!* activate memberships button *!/ */}
      {/* <div className="activate-memberships-button__div"> */}
      {/*  <Button */}
      {/*    button="primary" */}
      {/*    onClick={(e) => openActivateMembershipsModal()} */}
      {/*    className="activate-memberships__button" */}
      {/*    label={__('Activate Memberships')} */}
      {/*    icon={ICONS.ADD} */}
      {/* /> */}
      {/* {/*</div> */}
      <HelpHub
        href="https://help.odysee.tv/category-memberships/category-creatorportal/creatingtiers/"
        image="h264.png"
        text="Need some ideas on what tiers to make? Ms. H.264 has lots of ideas in the %help_hub%."
      />
    </div>
  );
}

export default TiersTab;
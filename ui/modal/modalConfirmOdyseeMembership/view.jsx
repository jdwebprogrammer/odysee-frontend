// @flow
import React from 'react';

import { Modal } from 'modal/modal';

import * as ICONS from 'constants/icons';
import * as MEMBERSHIP_CONSTS from 'constants/memberships';
import * as STRIPE from 'constants/stripe';

import I18nMessage from 'component/i18nMessage';
import Card from 'component/common/card';
import Button from 'component/button';
import BusyIndicator from 'component/common/busy-indicator';

import withCreditCard from 'hocs/withCreditCard';

type Props = {
  membership: CreatorMembership,
  price: StripePriceDetails,
  // -- redux --
  activeChannelClaim: ?ChannelClaim,
  channels: ?Array<ChannelClaim>,
  incognito: boolean,
  preferredCurrency: CurrencyOption,
  purchasePending: boolean,
  doMembershipBuy: (membershipParams: MembershipBuyParams) => Promise<Membership>,
  doHideModal: () => void,
  doToast: (params: { message: string }) => void,
};

export default function ConfirmOdyseeMembershipPurchase(props: Props) {
  const {
    membership,
    price,
    // -- redux --
    activeChannelClaim,
    channels,
    incognito,
    preferredCurrency,
    purchasePending,
    doMembershipBuy,
    doHideModal,
    doToast,
  } = props;

  const { Membership } = membership;

  const { name: activeChannelName, claim_id: activeChannelId } = activeChannelClaim || {};
  const noChannelsOrIncognitoMode = incognito || !channels;
  const plan = Membership.name;

  function handlePurchase() {
    doMembershipBuy({
      membership_id: Membership.id,
      channel_id: activeChannelId,
      channel_name: activeChannelName,
      price_id: price.id,
    }).then(() => {
      doToast({ message: __('Purchase was successful. Enjoy the perks and special features!') });
      doHideModal();
    });
  }

  return (
    <Modal
      className="confirm-odysee-premium__modal"
      ariaHideApp={false}
      isOpen
      contentLabel={__('Confirm Membership Purchase')}
      type="card"
      onAborted={doHideModal}
    >
      <Card
        className="stripe__confirm-remove-membershipDetails"
        title={__('Confirm %plan% Membership', { plan })}
        subtitle={
          <>
            <I18nMessage
              tokens={{
                time_interval_bold: (
                  <b className="membershipDetails-bolded">{MEMBERSHIP_CONSTS.INTERVALS[price.recurring.interval]}</b>
                ),
                time_interval: MEMBERSHIP_CONSTS.INTERVALS[price.recurring.interval],
                price_bold: (
                  <b className="membershipDetails-bolded">{`${preferredCurrency.toUpperCase()} ${
                    STRIPE.CURRENCY[price.currency.toUpperCase()].symbol
                  }${price.unit_amount / 100}`}</b>
                ),
                plan,
              }}
            >
              You are purchasing a %time_interval_bold% %plan% membershipDetails that is active immediately and will
              renew %time_interval% at a price of %price_bold%.
            </I18nMessage>

            {plan === MEMBERSHIP_CONSTS.ODYSEE_TIER_NAMES.PREMIUM_PLUS &&
              __('The no ads feature applies site-wide for all channels.')}

            {!noChannelsOrIncognitoMode ? (
              <I18nMessage tokens={{ channel_name: <b className="membershipDetails-bolded">{activeChannelName}</b> }}>
                Your badge will be shown for your %channel_name% channel in all areas of the app, and can be added to
                two additional channels in the future for free.
              </I18nMessage>
            ) : !channels ? (
              __(
                'You currently have no channels. To show your badge on a channel, please create a channel first. If you register a channel later you will be able to show a badge for up to three channels.'
              )
            ) : incognito ? (
              __(
                'You currently have no channel selected and will not have a badge be visible, if you want to show a badge you can select a channel now, or you can show a badge for up to three channels in the future for free.'
              )
            ) : undefined}

            {__(
              'You can cancel Premium at any time (no refunds) and you can also close this window and choose a different membershipDetails option.'
            )}
          </>
        }
        actions={
          <div className="section__actions">
            {!purchasePending ? (
              <>
                <SubmitPurchaseButton handlePurchase={handlePurchase} />
                <Button button="link" label={__('Cancel')} onClick={doHideModal} />
              </>
            ) : (
              <BusyIndicator message={__('Completing your purchase...')} />
            )}
          </div>
        }
      />
    </Modal>
  );
}

const SubmitPurchaseButton = withCreditCard((props: any) => (
  <Button
    className="stripe__confirm-remove-card"
    button="primary"
    icon={ICONS.FINANCE}
    label={__('Confirm Purchase')}
    onClick={props.handlePurchase}
  />
));

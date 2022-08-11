// @flow
import React from 'react';

import { formatDateToMonthDayAndYear } from 'util/time';

import * as MEMBERSHIPS from 'constants/memberships';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';

import Button from 'component/button';
import PremiumBadge from 'component/premiumBadge';

type Props = {
  key: any,
  membership: MembershipData,
  isCancelled: boolean,
  // -- redux --
  preferredCurrency: CurrencyOption,
  doOpenModal: (modalId: string, {}) => void,
};

const PremiumOption = (props: Props) => {
  const { key, membership, isCancelled, preferredCurrency, doOpenModal } = props;

  const { Membership, Prices } = membership;

  if (Prices) {
    return (
      <div className="premium-option" key={key}>
        <h4 className="membership_title">
          {Membership.name}
          <PremiumBadge membershipName={Membership.name} />
        </h4>

        <h4 className="membership_subtitle">{__(MEMBERSHIPS.DESCRIPTIONS[Membership.name])}</h4>

        {Prices.map(
          (price) =>
            !(price.recurring.interval === 'month' && Membership.name === 'Premium') &&
            price.currency.toUpperCase() === preferredCurrency && (
              <>
                <h4 className="membership_info">
                  <b>{__('Interval')}:</b> {MEMBERSHIPS.INTERVALS[price.recurring.interval]}
                </h4>

                <h4 className="membership_info">
                  <b>{__('Price')}:</b>{' '}
                  {price.currency.toUpperCase() + ' ' + MEMBERSHIPS.CURRENCY_SYMBOLS[price.currency]}
                  {price.unit_amount / 100} / {MEMBERSHIPS.INTERVALS[price.recurring.interval]}
                </h4>

                <Button
                  button="primary"
                  onClick={() => doOpenModal(MODALS.CONFIRM_ODYSEE_PREMIUM, { membership, price })}
                  membership-id={Membership.id}
                  membership-subscription-period={Membership.type}
                  price-id={price.id}
                  className="membership_button"
                  label={__('Join via %interval% membership', {
                    interval: price.recurring.interval,
                  })}
                  icon={ICONS.FINANCE}
                  interval={price.recurring.interval}
                  plan={Membership.name}
                />
              </>
            )
        )}
      </div>
    );
  }

  const { MembershipDetails, Subscription } = membership;

  return (
    <div className="premium-option" key={MembershipDetails.name}>
      <h4 className="membership_title">
        {MembershipDetails.name}
        <PremiumBadge membershipName={MembershipDetails.name} />
      </h4>

      <h4 className="membership_subtitle">{__(MEMBERSHIPS.DESCRIPTIONS[Membership.name])}</h4>

      <h4 className="membership_info">
        <b>{__('Registered On')}:</b> {formatDateToMonthDayAndYear(Membership.created_at)}
      </h4>

      <h4 className="membership_info">
        <b>{__(isCancelled ? 'Canceled On' : 'Auto-Renews On')}:</b>{' '}
        {formatDateToMonthDayAndYear((isCancelled ? Subscription.canceled_at : Subscription.current_period_end) * 1000)}
      </h4>

      {!isCancelled && (
        <h4 className="membership_info">
          <b>{__('Still Valid Until')}:</b> {formatDateToMonthDayAndYear(Membership.current_period_end)}
        </h4>
      )}

      {!isCancelled && (
        <Button
          button="alt"
          membership-id={Membership.membership_id}
          onClick={(e) =>
            doOpenModal(MODALS.CONFIRM_ODYSEE_PREMIUM, { membership, isCancelled: true, membershipId: MembershipDetails.id })
          }
          className="cancel-membership-button"
          label={__('Cancel membership')}
          icon={ICONS.FINANCE}
        />
      )}
    </div>
  );
};

export default PremiumOption;

// @flow
import { Form } from 'component/common/form';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import Card from 'component/common/card';
import React from 'react';

import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

type TipParams = { tipAmount: number, tipChannelName: string, channelClaimId: string };
type UserParams = { activeChannelName: ?string, activeChannelId: ?string };

type Props = {
  activeChannelId?: string,
  activeChannelName?: string,
  claimId: string,
  claimType?: string,
  channelClaimId?: string,
  tipChannelName?: string,
  claimIsMine: boolean,
  isSupport: boolean,
  isTipOnly?: boolean,
  customText?: string,
  doHideModal: () => void,
  setAmount?: (number) => void,
  // preferredCurrency: string,
  preOrderPurchase: (
    TipParams,
    anonymous: boolean,
    UserParams,
    claimId: string,
    stripe: ?string,
    preferredCurrency: string,
    type: string,
    ?(any) => Promise<void>,
    ?(any) => void
  ) => void,
  preorderTag: number,
  preorderOrPurchase: string,
  purchaseTag: number,
  purchaseMadeForClaimId: ?boolean,
  hasCardSaved: boolean,
  doCheckIfPurchasedClaimId: (string) => void,
};

export default function PreorderContent(props: Props) {
  const {
    activeChannelId,
    activeChannelName,
    channelClaimId,
    tipChannelName,
    doHideModal,
    preOrderPurchase,
    // preferredCurrency,
    preorderTag,
    preorderOrPurchase,
    purchaseTag,
    doCheckIfPurchasedClaimId,
    claimId,
    hasCardSaved,
  } = props;

  // set the purchase amount once the preorder tag is selected
  React.useEffect(() => {
    if (preorderOrPurchase === 'preorder') {
      setTipAmount(preorderTag);
    } else {
      setTipAmount(purchaseTag);
    }
  }, [preorderTag, purchaseTag]);

  const [tipAmount, setTipAmount] = React.useState(0);
  const [waitingForBackend, setWaitingForBackend] = React.useState(false);

  let modalHeaderText;
  if (preorderOrPurchase === 'purchase') {
    modalHeaderText = __('Purchase Your Content');
  } else {
    modalHeaderText = __('Preorder Your Content');
  }

  let subtitleText, toBeAbleToText, orderYourContentText;
  if (preorderOrPurchase === 'purchase') {
    subtitleText = __("After completing the purchase you will have instant access to your content that doesn't expire");
    toBeAbleToText = __(' To Purchase Your Content');
    orderYourContentText = 'Purchase your content for %tip_currency%%tip_amount%';
  } else {
    subtitleText = __(
      'This content is not available yet but you can pre-order it now so you can access it as soon as it goes live'
    );
    toBeAbleToText = __(' To Preorder Your Content');
    orderYourContentText = 'Preorder your content for %tip_currency%%tip_amount%';
  }

  function handleSubmit() {
    const tipParams: TipParams = {
      tipAmount,
      tipChannelName: tipChannelName || '',
      channelClaimId: channelClaimId || '',
    };
    const userParams: UserParams = { activeChannelName, activeChannelId };

    async function checkIfFinished() {
      await doCheckIfPurchasedClaimId(claimId);
      doHideModal();
    }

    setWaitingForBackend(true);

    // hit backend to send tip
    preOrderPurchase(
      tipParams,
      !activeChannelId,
      userParams,
      claimId,
      stripeEnvironment,
      'USD', // hardcode to USD for the moment
      // preferredCurrency,
      preorderOrPurchase,
      checkIfFinished,
      doHideModal
    );
  }

  // const fiatSymbolToUse = preferredCurrency === 'EUR' ? '€' : '$';
  const fiatSymbolToUse = '$';

  const buttonText = __(orderYourContentText, {
    tip_currency: fiatSymbolToUse,
    tip_amount: tipAmount.toString(),
  });

  return (
    <Form onSubmit={handleSubmit}>
      {!waitingForBackend && (
        <Card
          title={modalHeaderText}
          className={'preorder-content-modal'}
          subtitle={<div className="section__subtitle">{subtitleText}</div>}
          actions={
            // confirm purchase functionality
            <>
              <div className="handle-submit-area">
                <Button autoFocus onClick={handleSubmit} button="primary" label={buttonText} disabled={!hasCardSaved} />

                {!hasCardSaved && (
                  <div className="add-card-prompt">
                    <Button navigate={`/$/${PAGES.SETTINGS_STRIPE_CARD}`} label={__('Add a Card')} button="link" />
                    {toBeAbleToText}
                  </div>
                )}
              </div>
            </>
          }
        />
      )}
      {/* processing payment card */}
      {waitingForBackend && (
        <Card
          title={modalHeaderText}
          className={'preorder-content-modal-loading'}
          subtitle={<div className="section__subtitle">{__('Processing your purchase...')}</div>}
        />
      )}
    </Form>
  );
}

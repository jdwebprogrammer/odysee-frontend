// @flow
import React, { useEffect, useState } from 'react';
import { FormField } from 'component/common/form';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import Button from 'component/button';
import * as PAGES from 'constants/pages';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
let stripeEnvironment = getStripeEnvironment();

type Props = {
  description: ?string,
  disabled: boolean,
  updatePublishForm: ({}) => void,
};

function PublishProtectedContent(props: Props) {

  const { activeChannel, updatePublishForm } = props;

  function handleRestrictedMembershipChange(event) {

    let matchedMemberships = [];
    const restrictCheckboxes = document.querySelectorAll('*[id^="restrictToMembership"]');
    for (const checkbox of restrictCheckboxes) {
      if (checkbox.checked) {
        matchedMemberships.push(Number(checkbox.id.split(':')[1]));
      }
    }

    const commaSeparatedValueString = matchedMemberships.join(',');

    console.log('matched membership');
    console.log(matchedMemberships);
    console.log(commaSeparatedValueString);

    // console.log('event');
    // console.log(event);

    updatePublishForm({ restrictedToMemberships: commaSeparatedValueString });
  }

  console.log('active channel');
  console.log(activeChannel);

  const [isRestrictingContent, setIsRestrictingContent] = React.useState(false);
  const [creatorMemberships, setCreatorMemberships] = React.useState([]);

  function handleChangeRestriction(){
    setIsRestrictingContent(!isRestrictingContent)

    console.log('hey something')
  }

  const memberships = ['Bronze Plan', 'Silver Plan', 'Gold Plan']

  const [hasSavedTiers, setHasSavedTiers] = React.useState(false);

  async function getExistingTiers() {
    const response = await Lbryio.call(
      'membership',
      'list',
      {
        environment: stripeEnvironment,
        channel_name: activeChannel.normalized_name,
        channel_id: activeChannel.claim_id,
      },
      'post'
    );

    console.log('response');
    console.log(response);

    if (response && response.length && response.length > 0) {
      setHasSavedTiers(true);
      setCreatorMemberships(response);
    }

    return response;
  }

  useEffect(() => {
    if (activeChannel) {
      getExistingTiers();
    }
  }, [activeChannel]);

  return (
    <>
      <h2 className="card__title" style={{ marginBottom: '10px' }}>{__('Restrict Content')}</h2>
      { !hasSavedTiers && (
        <>
          <div style={{ marginTop: '10px', marginBottom: '40px' }}>
            <I18nMessage
              tokens={{
                activate_your_memberships: (
                  <Button
                    navigate={`/$/${PAGES.CREATOR_MEMBERSHIPS}`}
                    label={__('activate your memberships')}
                    button="link"
                  />
                ),
              }}
              style={{ marginTop: '10px', marginBottom: '40px' }}
            >
              Please %activate_your_memberships% first to to use this functionality
            </I18nMessage>
          </div>
        </>
      )}

      { hasSavedTiers && (
        <>
          <Card
            className=""
            actions={
              <>
              </>
            }
            body={
              <>
                <FormField
                  type="checkbox"
                  defaultChecked={false}
                  label={'Restrict content to only allow subscribers to certain memberships to view it'}
                  name={'toggleRestrictedContent'}
                  style={{ fontSize: '15px' }}
                  className="restrict-content__checkbox"
                  onChange={() => handleChangeRestriction()}
                />
                { isRestrictingContent && (<>
                  <h1 style={{ marginTop: '20px', marginBottom: '18px' }} >Memberships which can view the content:</h1>
                  {creatorMemberships.map((membership) => (
                    <FormField
                      key={membership.id}
                      type="checkbox"
                      defaultChecked={false}
                      label={membership.Membership.name}
                      name={'restrictToMembership:' + membership.Membership.id}
                      style={{ fontSize: '15px', marginTop: '10px' }}
                      onChange={handleRestrictedMembershipChange}
                    />
                  ))}
                </>)}
              </>
            }
          />
        </>
      )}

    </>
  );
}

export default PublishProtectedContent;

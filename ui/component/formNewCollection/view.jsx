// @flow
import React from 'react';
import type { ElementRef } from 'react';
import * as ICONS from 'constants/icons';
import * as KEYCODES from 'constants/keycodes';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { FormField } from 'component/common/form';
import Button from 'component/button';

type Props = {
  uri: string,
  onlyCreate?: boolean,
  closeForm: (newCollectionName?: string, newCollectionId?: string) => void,
  // -- redux --
  doLocalCollectionCreate: (params: CollectionCreateParams, cb: () => void) => void,
};

function FormNewCollection(props: Props) {
  const { uri, onlyCreate, closeForm, doLocalCollectionCreate } = props;

  const buttonref: ElementRef<any> = React.useRef();
  const newCollectionName = React.useRef('');

  const [disabled, setDisabled] = React.useState(true);

  function handleNameInput(e) {
    const { value } = e.target;
    newCollectionName.current = value;
    setDisabled(value.length === 0);
  }

  function handleAddCollection() {
    let newCollectionId = '';

    doLocalCollectionCreate(
      { name: newCollectionName.current, items: onlyCreate ? [] : [uri], type: 'playlist' },
      (id) => {
        newCollectionId = id;
      }
    );

    closeForm(newCollectionName.current, newCollectionId);
  }

  function altEnterListener(e: SyntheticKeyboardEvent<*>) {
    if (e.keyCode === KEYCODES.ENTER) {
      e.preventDefault();
      buttonref.current.click();
    }
  }

  function onTextareaFocus() {
    window.addEventListener('keydown', altEnterListener);
  }

  function onTextareaBlur() {
    window.removeEventListener('keydown', altEnterListener);
  }

  function handleClearNew() {
    closeForm();
  }

  return (
    <FormField
      autoFocus
      type="text"
      name="new_collection"
      label={__('New Playlist Title')}
      placeholder={__(COLLECTIONS_CONSTS.PLACEHOLDER)}
      onFocus={onTextareaFocus}
      onBlur={onTextareaBlur}
      inputButton={
        <>
          <Button
            button="alt"
            icon={ICONS.COMPLETED}
            title={__('Confirm')}
            className="button-toggle"
            disabled={disabled}
            onClick={handleAddCollection}
            ref={buttonref}
          />
          {!onlyCreate && (
            <Button
              button="alt"
              className="button-toggle"
              icon={ICONS.REMOVE}
              title={__('Cancel')}
              onClick={handleClearNew}
            />
          )}
        </>
      }
      onChange={handleNameInput}
    />
  );
}

export default FormNewCollection;
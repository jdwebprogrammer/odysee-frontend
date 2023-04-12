// @flow
import React from 'react';
import Button from 'component/button';
import DateTimePicker from 'react-datetime-picker';

function linuxTimestampToDate(linuxTimestamp: number) {
  return new Date(linuxTimestamp * 1000);
}

function dateToLinuxTimestamp(date: Date) {
  return Number(Math.round(date.getTime() / 1000));
}

const NOW = 'now';
const DEFAULT = 'default';
const RESET_TO_ORIGINAL = 'reset-to-original';
const FUTURE_DATE_ERROR = 'Cannot set to a future date.';

type Props = {
  // --- redux:
  isEdit: boolean,
  releaseTime: ?number,
  releaseTimeError: ?string,
  clock24h: boolean,
  appLanguage: ?string,
  updatePublishForm: ({}) => void,
};

const PublishReleaseDate = (props: Props) => {
  const { isEdit, releaseTime, releaseTimeError, clock24h, appLanguage, updatePublishForm } = props;

  const maxDate = new Date();
  const showDefaultBtn = releaseTime !== undefined;
  const showDatePicker = true;

  const onDateTimePickerChanged = (value) => {
    const isValueInFuture = maxDate && value && value.getTime() > maxDate.getTime();

    console.assert(value, 'onDateTimePickerChanged: null value?'); // eslint-disable-line no-console

    updatePublishForm({
      releaseTime: isValueInFuture ? releaseTime : dateToLinuxTimestamp(value),
      releaseTimeError: isValueInFuture ? FUTURE_DATE_ERROR : undefined,
    });
  };

  function newDate(value: string | Date) {
    const changes: UpdatePublishState = {
      releaseTimeError: undefined, // clear
    };

    switch (value) {
      case NOW:
        changes.releaseTime = dateToLinuxTimestamp(new Date());
        break;

      case DEFAULT:
      case RESET_TO_ORIGINAL:
        // PUBLISH.releaseTime() will do the right thing based on various scenarios.
        changes.releaseTime = undefined;
        break;

      default:
        console.assert(false, 'unhandled case'); // eslint-disable-line no-console
        changes.releaseTime = undefined;
        break;
    }

    updatePublishForm(changes);
  }

  function handleBlur(event) {
    if (event.target.name === 'minute' || event.target.name === 'day') {
      const validity = event?.target?.validity;
      if (validity.rangeOverflow || validity.rangeUnderflow) {
        updatePublishForm({ releaseTimeError: event.target.name });
      } else if (releaseTimeError === event.target.name) {
        updatePublishForm({ releaseTimeError: undefined });
      }
    }
  }

  return (
    <div className="form-field-date-picker">
      <label>{__('Release date')}</label>
      <div className="form-field-date-picker__controls">
        {showDatePicker && (
          <DateTimePicker
            locale={appLanguage}
            className="date-picker-input"
            calendarClassName="form-field-calendar"
            onBlur={handleBlur}
            onChange={onDateTimePickerChanged}
            value={releaseTime ? linuxTimestampToDate(releaseTime) : undefined}
            format={clock24h ? 'y-MM-dd HH:mm' : 'y-MM-dd h:mm a'}
            disableClock
            clearIcon={null}
          />
        )}
        {showDatePicker && (
          <Button
            button="link"
            label={__('Now')}
            aria-label={__('Set to current date and time')}
            onClick={() => newDate(NOW)}
          />
        )}
        {showDefaultBtn && (
          <Button
            button="link"
            label={isEdit ? __('Reset') : __('Default')}
            aria-label={isEdit ? __('Reset to original (previous) publish date') : __('Remove custom release date')}
            onClick={() => newDate(DEFAULT)}
          />
        )}
        {releaseTimeError && (
          <span className="form-field-date-picker__error">
            <span>{releaseTimeError === FUTURE_DATE_ERROR ? __(FUTURE_DATE_ERROR) : __('Invalid date/time.')}</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default PublishReleaseDate;

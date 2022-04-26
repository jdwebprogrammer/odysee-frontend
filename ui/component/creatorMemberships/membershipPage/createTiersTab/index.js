import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import MembershipsPage from './view';
import { doToast } from 'redux/actions/notifications';
import { selectBankAccountConfirmed } from 'redux/selectors/stripe';

const select = (state) => ({
  bankAccountConfirmed: selectBankAccountConfirmed(state),
});

const perform = {
  openModal: doOpenModal,
  doToast,
};

export default connect(select, perform)(MembershipsPage);
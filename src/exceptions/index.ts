import { ExceptionsManager } from '../helpers';
import tx6837619361654997458 from './tx_6837619361654997458';
import tx16433427573962963022 from './tx_16433427573962963022';
import tx2729957662760052130 from './tx_2729957662760052130';
const allExceptionCreator: Array<(exc: ExceptionsManager) => void> = [
  tx6837619361654997458,
  tx2729957662760052130,
  tx16433427573962963022
];

export { allExceptionCreator };

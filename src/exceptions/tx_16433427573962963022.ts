import { ExceptionsList, ExceptionsManager, IExceptionHandler } from '../helpers';
import { ITransactionLogic } from '../ioc/interfaces/logic';
import { IBaseTransaction } from '../logic/transactions';
import { VoteAsset } from '../logic/transactions';
/**
 * This transaction was broadcasted with 16433427573962963022 in the same
 * block and it was not allowed to be included as it register the same delegate.
 *
 * Affected block was: 1515220
 */
export default function exceptionTx16433427573962963022(excManager: ExceptionsManager) {
  const handler: IExceptionHandler<ITransactionLogic> = {
    canHandle(obj: ITransactionLogic, tx: IBaseTransaction<VoteAsset>) {
      return tx.id === '16433427573962963022' &&
        tx.senderPublicKey === 'e1e52751ab1a54556b662ff0ceaf2a2c319fe03a12b4f68e0b1f65442285c9a6';
    },
    handle() {
      return Promise.resolve([]);
    },
  };
  excManager.registerExceptionHandler(
    ExceptionsList.tx_apply,
    'tx_16433427573962963022',
    handler
  );
  excManager.registerExceptionHandler(
    ExceptionsList.tx_applyUnconfirmed,
    'tx_16433427573962963022',
    handler
  );
}

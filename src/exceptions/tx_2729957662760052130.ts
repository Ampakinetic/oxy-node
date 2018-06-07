import { ExceptionsList, ExceptionsManager, IExceptionHandler } from '../helpers';
import { ITransactionLogic } from '../ioc/interfaces/logic';
import { IBaseTransaction } from '../logic/transactions';
import { VoteAsset } from '../logic/transactions';
/**
 * This transaction was broadcasted with 2729957662760052130 in the same
 * block and it was not allowed to be included as it register the same delegate.
 *
 * Affected block was: 549745
 */
export default function exceptionTx2729957662760052130(excManager: ExceptionsManager) {
  const handler: IExceptionHandler<ITransactionLogic> = {
    canHandle(obj: ITransactionLogic, tx: IBaseTransaction<VoteAsset>) {
      return tx.id === '2729957662760052130' &&
        tx.senderPublicKey === 'cbced906dcd30ac4641d72140688b8122eee4b12dc4296e5e750d38c95b0e7d6';
    },
    handle() {
      return Promise.resolve([]);
    },
  };
  excManager.registerExceptionHandler(
    ExceptionsList.tx_apply,
    'tx_2729957662760052130',
    handler
  );
  excManager.registerExceptionHandler(
    ExceptionsList.tx_applyUnconfirmed,
    'tx_2729957662760052130',
    handler
  );
}

import { ExceptionsList, ExceptionsManager, IExceptionHandler } from '../helpers';
import { ITransactionLogic } from '../ioc/interfaces/logic';
import { IBaseTransaction } from '../logic/transactions';
import { VoteAsset } from '../logic/transactions';
/**
 * This transaction was broadcasted with 6837619361654997458 in the same
 * block and it was not allowed to be included as it register the same delegate.
 *
 * Affected block was: 537889
 */
export default function exceptionTx14712341342146176146(excManager: ExceptionsManager) {
  const handler: IExceptionHandler<ITransactionLogic> = {
    canHandle(obj: ITransactionLogic, tx: IBaseTransaction<VoteAsset>) {
      return tx.id === '6837619361654997458' &&
        tx.senderPublicKey === '71904305bcca3f5e7b57f7845f16a0e7514d0ed870dae8d99e25846499fb5ba2';
    },
    handle() {
      return Promise.resolve([]);
    },
  };
  excManager.registerExceptionHandler(
    ExceptionsList.tx_apply,
    'tx_6837619361654997458',
    handler
  );
  excManager.registerExceptionHandler(
    ExceptionsList.tx_applyUnconfirmed,
    'tx_6837619361654997458',
    handler
  );
}

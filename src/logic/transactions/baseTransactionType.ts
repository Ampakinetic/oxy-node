import { injectable, unmanaged } from 'inversify';
import { IDatabase } from 'pg-promise';
import { TransactionType } from '../../helpers/';
import { MemAccountsData } from '../account';
import { SignedBlockType } from '../block';

export interface IBaseTransaction<T> {
  type: TransactionType;
  amount: number;
  senderId?: string;
  senderPublicKey: string;
  requesterPublicKey?: string;
  timestamp: number;
  asset: T;
  recipientId: string;
  signature: string;
  id: string;
  fee: number;
  signatures?: string[];
  signSignature?: string;
}

export interface IConfirmedTransaction<T> extends IBaseTransaction<T> {
  blockId: string;
  height: number;
  senderId: string;
  recipientPublicKey?: string;
  confirmations?: number;
}

const emptyBuffer = new Buffer(0);

/**
 * Describes a Base Transaction Object
 */
@injectable()
export abstract class BaseTransactionType<T> {

  constructor(@unmanaged() private txType: TransactionType) {
  }

  public get type(): TransactionType {
    return this.txType;
  }

  public abstract calculateFee(tx: IBaseTransaction<T>, sender: MemAccountsData, height: number): number;

  public verify(tx: IBaseTransaction<T>, sender: MemAccountsData): Promise<void> {
    return Promise.resolve();
  }

  public process(tx: IBaseTransaction<T>, sender: MemAccountsData): Promise<void> {
    return Promise.resolve();
  }

  public getBytes(tx: IBaseTransaction<T>, skipSignature: boolean, skipSecondSignature: boolean): Buffer {
    return emptyBuffer;
  }

  public apply(tx: IConfirmedTransaction<T>, block: SignedBlockType, sender: MemAccountsData): Promise<void> {
    return Promise.resolve();
  }

  public applyUnconfirmed(tx: IBaseTransaction<T>, sender: MemAccountsData): Promise<void> {
    return Promise.resolve();
  }

  public undo(tx: IConfirmedTransaction<T>, block: SignedBlockType, sender: MemAccountsData): Promise<void> {
    return Promise.resolve();
  }

  public undoUnconfirmed(tx: IBaseTransaction<T>, sender: MemAccountsData): Promise<void> {
    return Promise.resolve();
  }

  public abstract objectNormalize(tx: IBaseTransaction<T>): IBaseTransaction<T>;

  public abstract dbRead(raw: any): T;

  // tslint:disable-next-line max-line-length
  public abstract dbSave(tx: IConfirmedTransaction<T> & { senderId: string }): { table: string, fields: string[], values: any };

  public afterSave(tx: IBaseTransaction<T>): Promise<void> {
    return Promise.resolve();
  }

  public restoreAsset(tx: IBaseTransaction<any>, db: IDatabase<any>): Promise<IBaseTransaction<T>> {
    return Promise.resolve(tx);
  }

  public ready(tx: IBaseTransaction<T>, sender: MemAccountsData): boolean {
    if (Array.isArray(sender.multisignatures) && sender.multisignatures.length) {
      if (!Array.isArray(tx.signatures)) {
        return false;
      }
      return tx.signatures.length >= sender.multimin;
    } else {
      return true;
    }
  }

}

import * as chai from 'chai';
import { expect } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Container } from 'inversify';
import * as sinon from 'sinon';
import { SinonSandbox, SinonStub } from 'sinon';
import { TransactionType } from '../../../src/helpers';
import { Symbols } from '../../../src/ioc/symbols';
import { IBaseTransaction, MultiSignatureTransaction } from '../../../src/logic/transactions';
import { MultisignaturesModule } from '../../../src/modules';
import {
  AccountsModuleStub,
  BusStub,
  InnerTXQueueStub,
  LoggerStub,
  SequenceStub,
  SocketIOStub,
  TransactionLogicStub,
  TransactionPoolStub,
  TransactionsModuleStub
} from '../../stubs';
import { createContainer } from '../../utils/containerCreator';

chai.use(chaiAsPromised);

// tslint:disable no-unused-expression
describe('modules/multisignatures', () => {
  let instance: MultisignaturesModule;
  let container: Container;
  let sandbox: SinonSandbox;
  let tx: IBaseTransaction<any>;
  let sender: any;
  let signature: string;

  let accountsModuleStub: AccountsModuleStub;
  let busStub: BusStub;
  let loggerStub: LoggerStub;
  let sequenceStub: SequenceStub;
  let socketIOStub: SocketIOStub;
  let transactionLogicStub: TransactionLogicStub;
  let transactionsModuleStub: TransactionsModuleStub;
  let multisigTx: MultiSignatureTransaction;
  let transactionPoolStub: TransactionPoolStub;
  let innerTXQueueStub: InnerTXQueueStub;

  before(() => {
    container = createContainer();
    container.rebind(Symbols.modules.multisignatures).to(MultisignaturesModule).inSingletonScope();
    // Txs
    container.bind(Symbols.logic.transactions.createmultisig).to(MultiSignatureTransaction).inSingletonScope();

  });

  beforeEach(() => {
    sandbox                = sinon.sandbox.create();
    instance               = container.get(Symbols.modules.multisignatures);
    transactionsModuleStub = container.get(Symbols.modules.transactions);
    accountsModuleStub     = container.get(Symbols.modules.accounts);
    transactionLogicStub   = container.get(Symbols.logic.transaction);
    transactionPoolStub    = container.get(Symbols.logic.transactionPool);
    innerTXQueueStub       = transactionPoolStub.multisignature;
    loggerStub             = container.get(Symbols.helpers.logger);
    socketIOStub           = container.get(Symbols.generic.socketIO);
    busStub                = container.get(Symbols.helpers.bus);
    sequenceStub           = container.getTagged(Symbols.helpers.sequence, Symbols.helpers.sequence, Symbols.tags.helpers.balancesSequence);
    multisigTx             = container.get(Symbols.logic.transactions.createmultisig);
    tx        = {
      type           : TransactionType.MULTI,
      amount         : 108910891000000,
      fee            : 10,
      timestamp      : 0,
      recipientId    : '15256762582730568272R',
      senderId       : '1233456789012345R',
      senderPublicKey: '6588716f9c941530c74eabdf0b27b1a2bac0a1525e9605a37e6c0b3817e58fe3',
      signature      : 'f8fbf9b8433bf1bbea971dc8b14c6772d33c7dd285d84c5e6c984b10c4141e9f' +
      'a56ace902b910e05e98b55898d982b3d5b9bf8bd897083a7d1ca1d5028703e03',
      id             : '8139741256612355994',
      asset          : {},
    };
    signature = '72d33c7dd285d84c5e6c984b10c4141e9ff8fbf9b8433bf1bbea971dc8b14c67' +
      'e98b55898d982b3d5b9ba56ace902b910e05f8bd897083a7d1ca1d5028703e03';
    sender    = {
      balance  : 10000000,
      address  : '1233456789012345R',
      publicKey: '6588716f9c941530c74eabdf0b27b1a2bac0a1525e9605a37e6c0b3817e58fe3',
    };
  });

  afterEach(() => {
    sandbox.restore();
    [transactionsModuleStub, accountsModuleStub, transactionLogicStub, loggerStub, socketIOStub, busStub, sequenceStub]
      .forEach((stub: any) => {
        if (typeof stub.reset !== 'undefined') {
          stub.reset();
        }
        if (typeof stub.stubReset !== 'undefined') {
          stub.stubReset();
        }
      });
  });

  describe('processSignature', () => {
    let processMultisigTxStub: SinonStub;
    let processNormalTxStub: SinonStub;
    let txReadyStub: SinonStub;

    beforeEach(() => {
      transactionsModuleStub.enqueueResponse('getMultisignatureTransaction', tx);
      transactionsModuleStub.enqueueResponse('getMultisignatureTransaction', tx);
      processMultisigTxStub = sandbox.stub(instance as any, 'processMultiSigSignature').resolves();
      processNormalTxStub   = sandbox.stub(instance as any, 'processNormalTxSignature').resolves();
      txReadyStub           = sandbox.stub(multisigTx as any, 'ready').returns(true);
      accountsModuleStub.enqueueResponse('getAccount', sender);
      busStub.stubs.message.resolves();
    });

    it('should call transactionsModule.getMultisignatureTransaction', async () => {
      await instance.processSignature({ signature, transaction: tx.id });
      expect(transactionsModuleStub.stubs.getMultisignatureTransaction.called).to.be.true;
      expect(transactionsModuleStub.stubs.getMultisignatureTransaction.firstCall.args[0]).to.be.equal(tx.id);
    });

    it('should throw if transactionsModule.getMultisignatureTransaction returns false', async () => {
      transactionsModuleStub.reset();
      transactionsModuleStub.enqueueResponse('getMultisignatureTransaction', false);
      await expect(instance.processSignature({
        signature,
        transaction: tx.id,
      })).to.be.rejectedWith('Transaction not found');
    });

    it('should set tx.signatures to [] if TransactionType is MULTI and tx.signatures is not set', async () => {
      delete tx.signatures;
      await instance.processSignature({ signature, transaction: tx.id });
      expect(processMultisigTxStub.calledOnce).to.be.true;
      // Our first arg is the modified tx
      expect(Array.isArray(processMultisigTxStub.firstCall.args[0].signatures)).to.be.true;
      expect(processMultisigTxStub.firstCall.args[0].signatures.length).to.be.equal(1);
    });

    it('should call processMultiSigSignature if TransactionType is MULTI', async () => {
      tx.type = TransactionType.MULTI;
      await instance.processSignature({ signature, transaction: tx.id });
      expect(processMultisigTxStub.calledOnce).to.be.true;
      expect(processNormalTxStub.notCalled).to.be.true;
      expect(processMultisigTxStub.firstCall.args[0]).to.be.deep.equal(tx);
      expect(processMultisigTxStub.firstCall.args[1]).to.be.deep.equal(signature);
    });

    it('should call processNormalTxSignature if TransactionType is NOT MULTI', async () => {
      tx.type = TransactionType.SIGNATURE;
      await instance.processSignature({ signature, transaction: tx.id });
      expect(processNormalTxStub.calledOnce).to.be.true;
      expect(processMultisigTxStub.notCalled).to.be.true;
      expect(processNormalTxStub.firstCall.args[0]).to.be.deep.equal(tx);
      expect(processNormalTxStub.firstCall.args[1]).to.be.deep.equal(signature);
    });

    it('should call balancesSequence.addAndPromise with a worker', async () => {
      await instance.processSignature({ signature, transaction: tx.id });
      expect(sequenceStub.spies.addAndPromise.calledOnce).to.be.true;
      expect(sequenceStub.spies.addAndPromise.firstCall.args[0]).to.be.a('function');
    });

    it('should call transactionsModule.getMultisignatureTransaction (in worker)', async () => {
      await instance.processSignature({ signature, transaction: tx.id });
      expect(transactionsModuleStub.stubs.getMultisignatureTransaction.calledTwice).to.be.true;
      expect(transactionsModuleStub.stubs.getMultisignatureTransaction.secondCall.args[0]).to.be.deep.equal(tx.id);
    });

    it('should throw if transactionsModule.getMultisignatureTransaction returns falsey (in worker)', async () => {
      transactionsModuleStub.reset();
      transactionsModuleStub.stubs.getMultisignatureTransaction.onCall(0).resolves(tx);
      transactionsModuleStub.stubs.getMultisignatureTransaction.onCall(1).returns(false);
      await expect(instance.processSignature({
        signature,
        transaction: tx.id,
      })).to.be.rejectedWith('Transaction not found');
    });

    it('should call accountsModule.getAccount (in worker)', async () => {
      await instance.processSignature({ signature, transaction: tx.id });
      expect(accountsModuleStub.stubs.getAccount.calledOnce).to.be.true;
      expect(accountsModuleStub.stubs.getAccount.firstCall.args[0]).to.be.deep.equal({ address: tx.senderId });
    });

    it('should throw if accountsModule.getAccount returns falsey (in worker)', async () => {
      accountsModuleStub.reset();
      accountsModuleStub.stubs.getAccount.returns(false);
      await expect(instance.processSignature({ signature, transaction: tx.id })).to.be.rejectedWith('Sender not found');
    });

    it('should call bus.message (in worker)', async () => {
      await instance.processSignature({ signature, transaction: tx.id });
      expect(busStub.stubs.message.calledOnce).to.be.true;
      expect(busStub.stubs.message.firstCall.args[0]).to.be.equal('signature');
      expect(busStub.stubs.message.firstCall.args[1]).to.be.deep.equal({ transaction: tx.id, signature });
      expect(busStub.stubs.message.firstCall.args[2]).to.be.true;
    });

    it('Throw: Cannot find payload for such multisig tx', async () => {
      innerTXQueueStub.stubs.getPayload.returns(false);
      await expect(instance.processSignature({
        signature,
        transaction: tx.id,
      })).to.be.rejectedWith('Cannot find payload for such multisig tx');
    });
  });

  describe('processNormalTxSignature', () => {
    let existingSigner: string;
    beforeEach(() => {
      accountsModuleStub.stubs.getAccount.resolves(sender);
      transactionLogicStub.stubs.verifySignature.returns(true);
      existingSigner         = tx.senderPublicKey.split('').reverse().join('');
      sender.multisignatures = [existingSigner];
    });

    it('should call accountsModule.getAccount', async () => {
      await (instance as any).processNormalTxSignature(tx, signature);
      expect(accountsModuleStub.stubs.getAccount.calledOnce).to.be.true;
      expect(accountsModuleStub.stubs.getAccount.firstCall.args[0]).to.be.deep.equal({ address: tx.senderId });
    });

    it('should throw if accountsModule.getAccount returns falsey', async () => {
      accountsModuleStub.stubs.getAccount.resolves(false);
      await expect((instance as any).processNormalTxSignature(tx, signature)).to.be
        .rejectedWith('Multisignature account not found');
    });

    it('should add the senderPublicKey to tx.multisignatures if tx.requesterPublicKey', async () => {
      tx.requesterPublicKey = 'pubkey';
      await (instance as any).processNormalTxSignature(tx, signature);
      expect(Array.isArray(sender.multisignatures)).to.be.true;
      expect(sender.multisignatures.length).to.be.equal(2);
      expect(sender.multisignatures[0]).to.be.equal(existingSigner);
      expect(sender.multisignatures[1]).to.be.equal(tx.senderPublicKey);
    });

    it('should throw if passed signature is already in tx.signatures', async () => {
      tx.signatures = [signature];
      await expect((instance as any).processNormalTxSignature(tx, signature)).to.be
        .rejectedWith('Signature already exists');
    });

    it('should call transactionLogic.verifySignature until publicKey that verifies is found', async () => {
      tx.requesterPublicKey = 'reqPubKey';
      // In this case, tx.senderpublicKey verifies the passed signature
      transactionLogicStub.reset();
      transactionLogicStub.stubs.verifySignature.onCall(0).returns(false);
      transactionLogicStub.stubs.verifySignature.onCall(1).returns(false);
      transactionLogicStub.stubs.verifySignature.onCall(2).returns(true);
      sender.multisignatures = ['doesnotVerify1', 'doesnotVerify2']; // tx.senderPublicKey is added...
      await (instance as any).processNormalTxSignature(tx, signature);
      expect(transactionLogicStub.stubs.verifySignature.callCount).to.be.equal(3);
      expect(transactionLogicStub.stubs.verifySignature.getCall(0).args[0]).to.be.deep.equal(tx);
      expect(transactionLogicStub.stubs.verifySignature.getCall(0).args[1]).to.be.deep.equal(sender.multisignatures[0]);
      expect(transactionLogicStub.stubs.verifySignature.getCall(0).args[2]).to.be.deep.equal(signature);
      expect(transactionLogicStub.stubs.verifySignature.getCall(1).args[0]).to.be.deep.equal(tx);
      expect(transactionLogicStub.stubs.verifySignature.getCall(1).args[1]).to.be.deep.equal(sender.multisignatures[1]);
      expect(transactionLogicStub.stubs.verifySignature.getCall(1).args[2]).to.be.deep.equal(signature);
      expect(transactionLogicStub.stubs.verifySignature.getCall(2).args[0]).to.be.deep.equal(tx);
      expect(transactionLogicStub.stubs.verifySignature.getCall(2).args[1]).to.be.deep.equal(tx.senderPublicKey);
      expect(transactionLogicStub.stubs.verifySignature.getCall(2).args[2]).to.be.deep.equal(signature);
    });

    it('should throw if no publicKey verifying the signature is found', async () => {
      transactionLogicStub.reset();
      transactionLogicStub.stubs.verifySignature.onCall(0).returns(false);
      transactionLogicStub.stubs.verifySignature.onCall(1).returns(false);
      sender.multisignatures = ['doesnotVerify1', 'doesnotVerify2'];
      await expect((instance as any).processNormalTxSignature(tx, signature)).to.be
        .rejectedWith('Failed to verify signature');
    });

    it('should call call io.sockets.emit', async () => {
      await (instance as any).processNormalTxSignature(tx, signature);
      expect(socketIOStub.sockets.emit.calledOnce).to.be.true;
      expect(socketIOStub.sockets.emit.firstCall.args[0]).to.be.equal('multisignatures/signature/change');
      expect(socketIOStub.sockets.emit.firstCall.args[1]).to.be.deep.equal(tx);
    });
  });

  describe('processMultisigSignature', () => {
    beforeEach(() => {
      tx.signatures           = [];
      tx.asset.multisignature = {};
    });

    it('should throw if tx already has the multisignature.signatures asset', async () => {
      tx.asset.multisignature.signatures = [];
      await expect((instance as any).processMultiSigSignature(tx, signature)).to.be
        .rejectedWith('Permission to sign transaction denied');
    });

    it('should throw if tx.signatures already contains the passed signature', async () => {
      tx.signatures = [signature];
      await expect((instance as any).processMultiSigSignature(tx, signature)).to.be
        .rejectedWith('Permission to sign transaction denied');
    });

    it('should call transactionLogic.verifySignature until publicKey that verifies is found', async () => {
      // In this case, tx.senderpublicKey verifies the passed signature
      transactionLogicStub.reset();
      transactionLogicStub.stubs.verifySignature.onCall(0).returns(false);
      transactionLogicStub.stubs.verifySignature.onCall(1).returns(true);
      tx.asset.multisignature.keysgroup = ['doesnotVerify', 'verifies'];
      await (instance as any).processMultiSigSignature(tx, signature);
      expect(transactionLogicStub.stubs.verifySignature.callCount).to.be.equal(2);
      expect(transactionLogicStub.stubs.verifySignature.getCall(0).args[0]).to.be.deep.equal(tx);
      expect(transactionLogicStub.stubs.verifySignature.getCall(0).args[1]).to.be.deep
        .equal(tx.asset.multisignature.keysgroup[0].substring(1));
      expect(transactionLogicStub.stubs.verifySignature.getCall(0).args[2]).to.be.deep.equal(signature);
      expect(transactionLogicStub.stubs.verifySignature.getCall(1).args[0]).to.be.deep.equal(tx);
      expect(transactionLogicStub.stubs.verifySignature.getCall(1).args[1]).to.be.deep
        .equal(tx.asset.multisignature.keysgroup[1].substring(1));
      expect(transactionLogicStub.stubs.verifySignature.getCall(1).args[2]).to.be.deep.equal(signature);
    });

    it('should throw if one or more signatures are not verified', async () => {
      transactionLogicStub.reset();
      transactionLogicStub.stubs.verifySignature.onCall(0).returns(false);
      transactionLogicStub.stubs.verifySignature.onCall(1).returns(false);
      tx.asset.multisignature.keysgroup = ['doesnotVerify1', 'doesnotVerify2'];
      await expect((instance as any).processMultiSigSignature(tx, signature)).to.be
        .rejectedWith('Failed to verify signature');
    });
  });
});

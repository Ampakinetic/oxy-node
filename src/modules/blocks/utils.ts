import { inject, injectable, tagged } from 'inversify';
import { IDatabase } from 'pg-promise';
import {
  BlockProgressLogger,
  catchToLoggerAndRemapError,
  constants as constantType,
  ILogger,
  logCatchRewrite,
  Sequence,
  TransactionType

} from '../../helpers/';
import { IBlockLogic, ITransactionLogic } from '../../ioc/interfaces/logic';
import { IBlocksModule, IBlocksModuleUtils } from '../../ioc/interfaces/modules/';
import { Symbols } from '../../ioc/symbols';
import { SignedAndChainedBlockType, SignedBlockType } from '../../logic/';
import sql from '../../sql/blocks';
import { RawFullBlockListType } from '../../types/rawDBTypes';
import { publicKey } from '../../types/sanityTypes';

@injectable()
export class BlocksModuleUtils implements IBlocksModuleUtils {

  // Generic
  @inject(Symbols.generic.db)
  private db: IDatabase<any>;
  @inject(Symbols.generic.genesisBlock)
  private genesisBlock: SignedAndChainedBlockType;

  // Helpers
  @inject(Symbols.helpers.constants)
  private constants: typeof constantType;
  @inject(Symbols.helpers.sequence)
  @tagged(Symbols.helpers.sequence, Symbols.tags.helpers.dbSequence)
  private dbSequence: Sequence;
  @inject(Symbols.helpers.logger)
  private logger: ILogger;

  // Logic
  @inject(Symbols.logic.block)
  private blockLogic: IBlockLogic;
  @inject(Symbols.logic.transaction)
  private transactionLogic: ITransactionLogic;

  // Modules
  @inject(Symbols.modules.blocks)
  private blocksModule: IBlocksModule;

  public readDbRows(rows: RawFullBlockListType[]): SignedAndChainedBlockType[] {
    const blocks = {};
    const order  = [];
    // a block is defined in multiple_rows
    // due to the view full_block_list which performs a left outer join
    // over transactions list.
    for (let i = 0, length = rows.length; i < length; i++) {
      // Normalize block
      const block = this.blockLogic.dbRead(rows[i]);

      if (block) {
        // If block is not already in the list...
        if (!blocks[block.id]) {
          if (block.id === this.genesisBlock.id) {
            // Generate fake signature for genesis block
            // tslint:disable-next-line
            block['generationSignature'] = (new Array(65)).join('0');
          }

          // Add block ID to order list
          order.push(block.id);
          // Add block to list
          blocks[block.id] = block;
        }

        // Normalize transaction
        const transaction             = this.transactionLogic.dbRead(rows[i]);
        // Set empty object if there are no transactions in block
        blocks[block.id].transactions = blocks[block.id].transactions || {};

        if (transaction) {
          // Add transaction to block if not there already
          if (!blocks[block.id].transactions[transaction.id]) {
            blocks[block.id].transactions[transaction.id] = transaction;
          }
        }
      }
    }

    // Reorganize list
    return order.map((v) => {
      blocks[v].transactions = Object.keys(blocks[v].transactions).map((t) => blocks[v].transactions[t]);
      return blocks[v];
    });
  }

  /**
   * Loads full blocks from database and normalize them
   *
   */
  public async loadBlocksPart(filter: { limit?: number, id?: string, lastId?: string }) {
    const blocks = await this.loadBlocksData(filter);
    return this.readDbRows(blocks);
  }

  /**
   * Loads the last block from db and normalizes it.
   * @return {Promise<SignedBlockType>}
   */
  public async loadLastBlock(): Promise<SignedAndChainedBlockType> {
    return await this.dbSequence.addAndPromise(async () => {
      const rows  = await this.db.query(sql.loadLastBlock);
      const block = this.readDbRows(rows)[0];
      // this is not correct. Ordering should always return consistent data so it should also account b
      // I'm not sure why this is needed though
      // FIXME PLEASE!
      block.transactions = block.transactions.sort((a, b) => {
        if (block.id === this.genesisBlock.id) {
          if (a.type === TransactionType.VOTE) {
            return 1;
          }
        }
        if (a.type === TransactionType.SIGNATURE) {
          return 1;
        }
        return 0;
      });

      this.blocksModule.lastBlock = block;
      return block;
    })
      .catch(logCatchRewrite(this.logger, 'Blocks#loadLastBlock error'));
  }

  /**
   * Gets block IDs sequence - last block id, ids of first blocks of last 5 rounds and genesis block id.
   * @param {number} height
   */
  public async getIdSequence(height: number): Promise<{ firstHeight: number, ids: string[] }> {
    const lastBlock = this.blocksModule.lastBlock;
    // Get IDs of first blocks of (n) last rounds, descending order
    // EXAMPLE: For height 2000000 (round 19802) we will get IDs of blocks at height: 1999902, 1999801, 1999700,
    // 1999599, 1999498
    const rows = await this.db.query<Array<{ id: string, height: number }>>(sql.getIdSequence(), {
      delegates: this.constants.activeDelegates,
      height,
      limit    : 5,
    });

    if (rows.length === 0) {
      throw new Error(`Failed to get id sequence for height ${height}`);
    }

    // Add genesis block at the end if the set doesn't contain it already
    if (this.genesisBlock) {
      if (!rows.find((v) => v.id === this.genesisBlock.id)) {
        rows.push({
          height: this.genesisBlock.height,
          id    : this.genesisBlock.id,
        });
      }
    }

    // Add last block at the beginning if the set doesn't contain it already
    if (lastBlock && !rows.find((v) => v.id === lastBlock.id)) {
      rows.unshift({
        height: lastBlock.height,
        id    : lastBlock.id,
      });
    }

    const ids: string[] = rows.map((r) => r.id);

    return {firstHeight: rows[0].height, ids};
  }

  // tslint:disable-next-line max-line-length
  public async loadBlocksData(filter: { limit?: number, id?: string, lastId?: string }): Promise<RawFullBlockListType[]> {
    const params: any = { limit: filter.limit || 1 };
    if (filter.id && filter.lastId) {
      throw new Error('Invalid filter: Received both id and lastId');
    } else if (filter.id) {
      params.id = filter.id;
    } else if (filter.lastId) {
      params.lastId = filter.lastId;
    }
    return await this.dbSequence.addAndPromise(async () => {
      const res = await this.db.oneOrNone<{height: number}>(
        sql.getHeightByLastId,
        { id: filter.lastId || filter.id || null }
        );

      const height = res !== null ? res.height : 0;
      // Calculate max block height for database query

      params.limit  = height + (parseInt(`${filter.limit}`, 10) || 1);
      params.height = height;

      return this.db.query(sql.loadBlocksData(filter), params);
    })
      .catch(catchToLoggerAndRemapError('Blocks#loadBlockData error', this.logger));
  }

  public getBlockProgressLogger(txCount: number, logsFrequency: number, msg: string) {
    return new BlockProgressLogger(txCount, logsFrequency, msg, this.logger);
  }

  /**
   * Gets block rewards for a delegate for time period
   */
  // tslint:disable-next-line max-line-length
  public async aggregateBlockReward(filter: { generatorPublicKey: publicKey, start?: number, end?: number }): Promise<{ fees: number, rewards: number, count: number }> {
    const params: any         = {};
    params.generatorPublicKey = filter.generatorPublicKey;
    params.delegates          = this.constants.activeDelegates;

    if (typeof(filter.start) !== 'undefined') {
      params.start = filter.start - this.constants.epochTime.getTime() / 1000;
    }

    if (typeof(filter.end) !== 'undefined') {
      params.end = filter.end - this.constants.epochTime.getTime() / 1000;
    }

    // Get calculated rewards
    // tslint:disable-next-line
    type dbDataType = {delegate: 1, fees: number, rewards: number, count: number};
    const data: dbDataType = await this.db.oneOrNone<dbDataType>(sql.aggregateBlocksReward(params), params)
      .catch(catchToLoggerAndRemapError<dbDataType>('Blocks#aggregateBlocksReward error', this.logger));

    if (data && data.delegate === null) {
      throw new Error('Account not found or is not a delegate');
    }
    return { fees: data.fees || 0, rewards: data.rewards || 0, count: data.count || 0 };
  }

}

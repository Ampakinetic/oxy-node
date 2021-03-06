import initializer from '../common/init';
import { checkEnumParam, checkIntParam, checkPubKey, checkRequiredParam, checkReturnObjKeyVal } from './utils';

// tslint:disable no-unused-expression max-line-length
describe('api/delegates', () => {

  initializer.setup();

  describe('/', () => {
    checkEnumParam('orderBy', [
      'approval:desc', 'approval:asc',
      'productivity:desc', 'productivity:asc',
      'rank:desc', 'rank:asc',
      'vote:desc', 'vote:asc',
      'address:desc', 'address:asc',
      'username:desc', 'username:asc',
      'publicKey:desc', 'publicKey:asc',
    ], '/api/delegates');
    checkIntParam('limit', '/api/delegates', { min: 1, max: 101 });
    checkIntParam('offset', '/api/delegates', { min: 0 });

    checkReturnObjKeyVal('totalCount', 101, '/api/delegates');
    it('should return delegates array');
    it('should honor orderBy asc param');
    it('should honor orderBy desc param');
    it('should honor limit param');
    it('should honor offset param');
  });

  describe('/fee', () => {
    checkIntParam('height', '/api/delegates/fee', { min: 1 });
    checkReturnObjKeyVal('fromHeight', 1, '/api/delegates/fee');
    checkReturnObjKeyVal('toHeight', null, '/api/delegates/fee');
    checkReturnObjKeyVal('height', 2, '/api/delegates/fee');
    it('should return fee value for delegate');
  });

  describe('/forging/getForgedByAccount', () => {
    checkIntParam('start', '/api/delegates/forging/getForgedByAccount?generatorPublicKey=b1cb14cd2e0d349943fdf4d4f1661a5af8e3c3e8b5868d428b9a383d47aa98c3');
    checkIntParam('end', '/api/delegates/forging/getForgedByAccount?generatorPublicKey=b1cb14cd2e0d349943fdf4d4f1661a5af8e3c3e8b5868d428b9a383d47aa98c3');
    checkPubKey('generatorPublicKey', '/api/delegates/forging/getForgedByAccount');
    it('should calculate the total forged amount');
    it('should calculate the forged amount accounting start and end');
  });

  describe('/get', () => {
    checkPubKey('publicKey', '/api/delegates/get');
    it('should return delegate object by username');
    it('should return delegate object by publicKey');
    it('should throw delegate not found if delecate is not there');
  });

  describe('/voters', () => {
    checkPubKey('publicKey', '/api/delegates/voters');
    it('should return accounts that voted for delegate');
    it('should return empty array if delegate does not exist');
    it('should return empty array if delegate have no votes');
  });

  describe('/search', () => {
    checkRequiredParam('q', '/api/delegates/search?q=haha');
    checkIntParam('limit', '/api/delegates/search?q=haha', { min: 1, max: 1000 });
    it('should return delegates array matching search criteria');
    it('should honor limit parameter');
  });

  describe('/count', () => {
    checkReturnObjKeyVal('count', 101, '/api/delegates/count');
  });

  describe('/getNextForgers', () => {
    it('should return current block');
    it('should return currentBlock slot');
    it('should return current slot (time)');
    it('should return next delegates in line to forge');
  });

  describe('/forging/status', () => {
    checkPubKey('publicKey', '/api/delegates/forging/status');
    it('should disallow request from unallowed ip');
    it('should check for publicKey only if provided');
    it('should return all enabled delegates to forge');
  });
  describe('/forging/enable', () => {
    // checkRequiredParam('secret', '/api/delegates/forging/enable?secret=aaa');
    // checkPubKey('publicKey', '/api/delegates/forging/enable?secret=aaa');
    it('should disallow request from unallowed ip');
    it('should throw error if given publicKey differs from computed pk');
    it('should throw error if forging is already enabled for such account');
    it('should throw error if account is not found');
    it('should throw error if account is not a delegate');
  });
  describe('/forging/disable', () => {
    // checkRequiredParam('secret', '/api/delegates/forging/disable');
    // checkPubKey('publicKey', '/api/delegates/forging/disable?secret=aaa');
    it('should disallow request from unallowed ip');
    it('should throw error if given publicKey differs from computed pk');
    it('should throw error if forging is already disabled for such account');
    it('should throw error if account is not found');
    it('should throw error if account is not a delegate');
  });

});

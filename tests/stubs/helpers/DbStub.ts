import { injectable } from 'inversify';

import { BaseStubClass } from '../BaseStubClass';
import { stubMethod } from '../stubDecorator';

// tslint:disable no-empty

@injectable()
export default class DbStub extends BaseStubClass /*implements IDatabase<any>*/ {

  @stubMethod()
  public query() {
  }

  @stubMethod()
  public none() {
  }

  @stubMethod()
  public one() {
  }

  @stubMethod()
  public any() {
  }

  @stubMethod()
  public tx() {
  }

  @stubMethod()
  public task() {
  }

  @stubMethod()
  public oneOrNone(){

  }
  // TODO Add more methods when needed
}

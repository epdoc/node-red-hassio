import {
  NodeRedContextApi,
  NodeRedEnvMock,
  NodeRedFlowMock,
  NodeRedGlobalMock,
  NodeRedNodeMock
} from '@epdoc/node-red-hautil';
import { Integer } from '@epdoc/typeutil';
import { NodeRedFlowFactory } from '../src';

function g(i: Integer): string {
  return String('g' + i);
}

describe('LocationHistory', () => {
  const gMock: NodeRedGlobalMock = new NodeRedGlobalMock();
  // @ts-ignore
  const factory = new NodeRedFlowFactory(gMock);
  const oMock: NodeRedContextApi = {
    env: new NodeRedEnvMock(),
    // @ts-ignore
    flow: new NodeRedFlowMock(),
    node: new NodeRedNodeMock()
  };

  const tNow = new Date().getTime();
  const LOCATIONS = [];

  describe('basic', () => {
    let history = factory.makeLocationHistory(oMock, { context: 'flow' });
    it('find none', () => {
      let f = history.filter('bob');
      expect(f.found()).toEqual(false);
      expect(f.numFound()).toEqual(0);
    });
    it('cutoff one', () => {
      history.add('bob', g(0), tNow - 5000);
      let f = history.filter('bob').cutoff(tNow - 20000);
      expect(f.found()).toEqual(true);
      expect(f.numFound()).toEqual(1);
    });
    it('cutoff none', () => {
      let f = history.filter('bob').cutoff(tNow);
      expect(f.found()).toEqual(false);
      expect(f.numFound()).toEqual(0);
    });
    it('add and find', () => {
      history.add('bob', g(0), tNow - 5000);
      let f = history
        .filter('bob')
        .cutoff(tNow - 10000)
        .locations([g(0), g(1), g(2)]);
      expect(f.found()).toEqual(true);
      expect(f.numFound()).toEqual(1);
      f = history
        .filter('andy')
        .cutoff(tNow - 10000)
        .locations([g(0), g(1), g(2)]);
      expect(f.numFound()).toEqual(0);
      f = history
        .filter('bob')
        .cutoff(tNow - 4000)
        .locations([g(0), g(1), g(2)]);
      expect(f.numFound()).toEqual(0);
      f = history
        .filter('bob')
        .cutoff(tNow - 5500)
        .locations([g(0), g(1), g(2)]);
      expect(f.numFound()).toEqual(1);
      f = history
        .filter('bob')
        .cutoff(tNow - 5500)
        .locations([g(1), g(2)]);
      expect(f.numFound()).toEqual(0);
      f = history.filter('bob').cutoff(tNow - 5500);
      expect(f.numFound()).toEqual(1);
    });
    it('moving one location fail', () => {
      let f = history
        .filter('bob')
        .cutoff(tNow - 20000)
        .locations([g(0), g(1)]);
      expect(f.found()).toEqual(true);
      expect(f.numFound()).toEqual(1);
      expect(f.moving()).toEqual(false);
      f.locations([g(1), g(0)]);
      expect(f.moving()).toEqual(false);
    });
    it('raw history add', () => {
      history.add('bob', g(0), tNow + 4000);
      history.add('bob', g(1), tNow + 5000);
      let items = history.history['bob'];
      expect(items).toHaveLength(2);
      expect(items[1].location).toEqual(g(1));
      expect(items[1].time).toEqual(tNow + 5000);
      expect(items[0].location).toEqual(g(0));
      expect(items[0].time).toEqual(tNow + 4000);
    });
    it('moving two location pass', () => {
      let f = history
        .filter('bob')
        .cutoff(tNow - 20000)
        .locations([g(0), g(1)]);
      expect(f.moving()).toEqual(true);
      expect(f.numFound()).toEqual(2);
    });
    it('moving two location fail', () => {
      let f = history
        .filter('bob')
        .cutoff(tNow - 20000)
        .locations([g(1), g(0)]);
      expect(f.moving()).toEqual(false);
    });
    it('moving two location short cutoff', () => {
      let f = history
        .filter('bob')
        .cutoff(tNow + 5500)
        .locations([g(0), g(1)]);
      expect(f.moving()).toEqual(false);
    });
    it('moving two location wrong order', () => {
      let f = history
        .filter('bob')
        .cutoff(tNow - 20000)
        .locations([g(1), g(0)]);
      expect(f.moving()).toEqual(false);
    });
    it('find more', () => {
      expect(history.history['bob'].length).toEqual(2);
      let f = history
        .filter('bob')
        .cutoff(tNow - 10000)
        .locations([g(0)]);
      expect(f.numFound()).toEqual(1);
      f = history
        .filter('bob')
        .cutoff(tNow - 10000)
        .locations(g(1));
      expect(f.numFound()).toEqual(1);
    });
    it('add back entries', () => {
      history.add('bob', g(0), tNow + 4000);
      history.add('bob', g(1), tNow + 5000);
      let f = history.filter('bob');
      expect(f.numFound()).toEqual(2);
    });
    it('prune nothing', () => {
      history.prune(tNow + 3000);
      let f = history
        .filter('bob')
        .cutoff(tNow - 10000)
        .locations([g(0)]);
      expect(f.numFound()).toEqual(1);
      f.locations(g(1));
      expect(f.numFound()).toEqual(0);
      f = history
        .filter('bob')
        .cutoff(tNow - 10000)
        .locations(g(1));
      expect(f.numFound()).toEqual(1);
    });
    it('add back entries', () => {
      history.add('bob', g(0), tNow + 4000);
      history.add('bob', g(1), tNow + 5000);
      let f = history.filter('bob');
      expect(f.numFound()).toEqual(2);
    });
    it('prune one', () => {
      history.prune(tNow + 4500);
      let f = history
        .filter('bob')
        .cutoff(tNow - 10000)
        .locations([g(0), g(1)]);
      expect(f.numFound()).toEqual(1);
    });
    it('pre flush raw', () => {
      let filter = history.filter('bob').cutoff(tNow - 10000);
      filter.locations(g(1));
      expect(filter.numFound()).toEqual(1);
    });
    it('pre flush raw', () => {
      let filter = history
        .filter('bob')
        .cutoff(tNow + 5001)
        .locations(g(1));
      expect(filter.numFound()).toEqual(0);
    });
    it('pre flush raw', () => {
      const h = oMock.flow.get('gate_history');
      expect(h).toBeUndefined();
    });
    it('flush raw', () => {
      history.add('bob', g(2), tNow + 6000);
      history.flush();
      const h = oMock.flow.get('gate_history');
      expect(h).toBeDefined();
      expect(h).toHaveProperty('bob');
      // @ts-ignore
      expect(h.bob).toHaveLength(2);
    });
    it('read', () => {
      history.flush();
      history.history = {};
      history.read();
      const h = oMock.flow.get('gate_history');
      expect(h).toBeDefined();
      expect(h).toHaveProperty('bob');
      // @ts-ignore
      expect(h.bob).toHaveLength(2);
      let f = history
        .filter('bob')
        .cutoff(tNow - 10000)
        .locations([g(1)]);
      expect(f.numFound()).toEqual(1);
      f = history
        .filter('bob')
        .cutoff(tNow - 10000)
        .locations(g(2));
      expect(f.numFound()).toEqual(1);
    });
  });
});

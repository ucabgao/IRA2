import setupStore from 'dummy/tests/helpers/store';
import Ember from 'ember';
import QUnit, {module, test} from 'qunit';
import DS from 'ember-data';

var Person, store, env;
var run = Ember.run;

module("integration/store/json-validation", {
  beforeEach: function() {
    Person = DS.Model.extend({
      updatedAt: DS.attr('string'),
      name: DS.attr('string'),
      firstName: DS.attr('string'),
      lastName: DS.attr('string')
    });

    env = setupStore({
      person: Person
    });
    store = env.store;
  },

  afterEach: function() {
    run(store, 'destroy');
  }
});

test("when normalizeResponse returns undefined (or doesn't return), throws an error", function(assert) {

  env.registry.register('serializer:person', DS.Serializer.extend({
    normalizeResponse() {}
  }));

  env.registry.register('adapter:person', DS.Adapter.extend({
    findRecord() {
      return Ember.RSVP.resolve({});
    }
  }));

  assert.throws(function () {
    run(function() {
      store.find('person', 1);
    });
  }, /Top level of a JSON API document must be an object/);
});

test("when normalizeResponse returns null, throws an error", function(assert) {

  env.registry.register('serializer:person', DS.Serializer.extend({
    normalizeResponse() {return null;}
  }));

  env.registry.register('adapter:person', DS.Adapter.extend({
    findRecord() {
      return Ember.RSVP.resolve({});
    }
  }));

  assert.throws(function () {
    run(function() {
      store.find('person', 1);
    });
  }, /Top level of a JSON API document must be an object/);
});


test("when normalizeResponse returns an empty object, throws an error", function(assert) {

  env.registry.register('serializer:person', DS.Serializer.extend({
    normalizeResponse() {return {};}
  }));

  env.registry.register('adapter:person', DS.Adapter.extend({
    findRecord() {
      return Ember.RSVP.resolve({});
    }
  }));

  assert.throws(function () {
    run(function() {
      store.find('person', 1);
    });
  }, /One or more of the following keys must be present/);
});

test("when normalizeResponse returns a document with both data and errors, throws an error", function(assert) {

  env.registry.register('serializer:person', DS.Serializer.extend({
    normalizeResponse() {
      return {
        data: [],
        errors: []
      };
    }
  }));

  env.registry.register('adapter:person', DS.Adapter.extend({
    findRecord() {
      return Ember.RSVP.resolve({});
    }
  }));

  assert.throws(function () {
    run(function() {
      store.find('person', 1);
    });
  }, /cannot both be present/);
});

QUnit.assert.payloadError = function payloadError(payload, expectedError) {
  env.registry.register('serializer:person', DS.Serializer.extend({
    normalizeResponse(store, type, pld) {
      return pld;
    }
  }));
  env.registry.register('adapter:person', DS.Adapter.extend({
    findRecord() {
      return Ember.RSVP.resolve(payload);
    }
  }));
  this.throws(function () {
    run(function() {
      store.find('person', 1);
    });
  }, expectedError, `Payload ${JSON.stringify(payload)} should throw error ${expectedError}`);
  env.registry.unregister('serializer:person');
  env.registry.unregister('adapter:person');
};

test("normalizeResponse 'data' cannot be undefined, a number, a string or a boolean", function(assert) {

  assert.payloadError({ data: undefined }, /data must be/);
  assert.payloadError({ data: 1 }, /data must be/);
  assert.payloadError({ data: 'lollerskates' }, /data must be/);
  assert.payloadError({ data: true }, /data must be/);

});

test("normalizeResponse 'meta' cannot be an array, undefined, a number, a string or a boolean", function(assert) {

  assert.payloadError({ meta: undefined }, /meta must be an object/);
  assert.payloadError({ meta: [] }, /meta must be an object/);
  assert.payloadError({ meta: 1 }, /meta must be an object/);
  assert.payloadError({ meta: 'lollerskates' }, /meta must be an object/);
  assert.payloadError({ meta: true }, /meta must be an object/);

});

test("normalizeResponse 'links' cannot be an array, undefined, a number, a string or a boolean", function(assert) {

  assert.payloadError({ data: [], links: undefined }, /links must be an object/);
  assert.payloadError({ data: [], links: [] }, /links must be an object/);
  assert.payloadError({ data: [], links: 1 }, /links must be an object/);
  assert.payloadError({ data: [], links: 'lollerskates' }, /links must be an object/);
  assert.payloadError({ data: [], links: true }, /links must be an object/);

});

test("normalizeResponse 'jsonapi' cannot be an array, undefined, a number, a string or a boolean", function(assert) {

  assert.payloadError({ data: [], jsonapi: undefined }, /jsonapi must be an object/);
  assert.payloadError({ data: [], jsonapi: [] }, /jsonapi must be an object/);
  assert.payloadError({ data: [], jsonapi: 1 }, /jsonapi must be an object/);
  assert.payloadError({ data: [], jsonapi: 'lollerskates' }, /jsonapi must be an object/);
  assert.payloadError({ data: [], jsonapi: true }, /jsonapi must be an object/);

});

test("normalizeResponse 'included' cannot be an object, undefined, a number, a string or a boolean", function(assert) {

  assert.payloadError({ included: undefined }, /included must be an array/);
  assert.payloadError({ included: {} }, /included must be an array/);
  assert.payloadError({ included: 1 }, /included must be an array/);
  assert.payloadError({ included: 'lollerskates' }, /included must be an array/);
  assert.payloadError({ included: true }, /included must be an array/);

});

test("normalizeResponse 'errors' cannot be an object, undefined, a number, a string or a boolean", function(assert) {

  assert.payloadError({ errors: undefined }, /errors must be an array/);
  assert.payloadError({ errors: {} }, /errors must be an array/);
  assert.payloadError({ errors: 1 }, /errors must be an array/);
  assert.payloadError({ errors: 'lollerskates' }, /errors must be an array/);
  assert.payloadError({ errors: true }, /errors must be an array/);

});



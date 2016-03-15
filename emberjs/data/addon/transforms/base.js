/**
  The `DS.Transform` class is used to serialize and deserialize model
  attributes when they are saved or loaded from an
  adapter. Subclassing `DS.Transform` is useful for creating custom
  attributes. All subclasses of `DS.Transform` must implement a
  `serialize` and a `deserialize` method.

  Example

  ```app/transforms/temperature.js
  import DS from 'ember-data';

  // Converts centigrade in the JSON to fahrenheit in the app
  export default DS.Transform.extend({
    deserialize: function(serialized) {
      return (serialized *  1.8) + 32;
    },
    serialize: function(deserialized) {
      return (deserialized - 32) / 1.8;
    }
  });
  ```

  Usage

  ```app/models/requirement.js
  import DS from 'ember-data';

  export default DS.Model.extend({
    name: DS.attr('string'),
    temperature: DS.attr('temperature')
  });
  ```

  @class Transform
  @namespace DS
 */
export default Ember.Object.extend({
  /**
    When given a deserialized value from a record attribute this
    method must return the serialized value.

    Example

    ```javascript
    serialize: function(deserialized) {
      return Ember.isEmpty(deserialized) ? null : Number(deserialized);
    }
    ```

    @method serialize
    @param deserialized The deserialized value
    @return The serialized value
  */
  serialize: null,

  /**
    When given a serialize value from a JSON object this method must
    return the deserialized value for the record attribute.

    Example

    ```javascript
    deserialize: function(serialized) {
      return empty(serialized) ? null : Number(serialized);
    }
    ```

    @method deserialize
    @param serialized The serialized value
    @return The deserialized value
  */
  deserialize: null
});

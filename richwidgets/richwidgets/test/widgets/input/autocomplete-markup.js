define(['widget-test-base', 'jquery', 'jquery-ui', 'src/widgets/input/autocomplete'], function () {

  describe('widget(autocomplete): dom construction', function () {

    var fixture, element;



    beforeEach(function () {
      var f = jasmine.getFixtures();
      f.load('test/widgets/input/autocomplete-markup.html');

      var s = jasmine.getStyleFixtures();
      s.appendLoad('dist/assets/bootstrap/bootstrap.css');
      s.appendLoad('dist/assets/font-awesome/font-awesome.css');
      s.appendLoad('dist/assets/richwidgets/input/autocomplete.css');

      fixture = $('#fixture');
      element = $('.autocomplete', fixture);
    });



    it('initializes DOM correctly', function () {
      // given
      var expected = $('#expected');

      // when
      element.autocomplete({ source: ['Java', 'Haskell'] });

      // then
      expect(fixture).toHaveEqualInnerDom(expected);
    });



    it('can be destructed', function () {
      // given
      var expected = $('#expected');
      var initialDom = fixture.html();

      // construct element
      element.autocomplete({
        source: ['Java', 'Haskell']
      });
      expect(fixture).toHaveEqualInnerDom(expected);

      // when
      element.autocomplete('destroy');

      // then
      expect(fixture).toHaveEqualInnerDom(initialDom);
    });



    it('can have button', function () {
      // given
      var expected = $('#expected-with-button');

      // when
      element.autocomplete({
        source: ['Java', 'Haskell'],
        showButton: true
      });

      // then
      expect(fixture).toHaveEqualInnerDom(expected);
    });

  });

});

  describe('selecting a value', function() {
    var combobox;
    var input;
    var valueChangedSpy;
    var selectedItemChangedSpy;

    function dispatchTap(elm) {
      elm.dispatchEvent(new CustomEvent('tap', {
        bubbles: true
      }));
    }

    beforeEach(function() {
      combobox = fixture('combobox');
      combobox.items = ['foo', 'bar'];
      input = combobox.$$('input');

      valueChangedSpy = sinon.spy();
      combobox.addEventListener('value-changed', valueChangedSpy);

      selectedItemChangedSpy = sinon.spy();
      combobox.addEventListener('selected-item-changed', selectedItemChangedSpy);
    });

    it('should stop tap events from bubbling outside the overlay', function() {
      var tapSpy = sinon.spy();
      document.addEventListener('tap', tapSpy);
      combobox.$.overlay.$.selector.dispatchEvent(new CustomEvent('tap', {
        bubbles: true
      }));
      document.removeEventListener('tap', tapSpy);
      expect(tapSpy.calledOnce).not.to.be.true;
    });

    it('should fire `selection-changed` when tapped on an item', function() {
      combobox.opened = true;
      var spy = sinon.spy();
      combobox.$.overlay.addEventListener('selection-changed', spy);

      Polymer.dom(combobox.$.overlay.$.selector).querySelector('vaadin-combo-box-item').dispatchEvent(new CustomEvent('tap', {
        bubbles: true
      }));

      expect(spy.calledOnce).to.be.true;
      expect(spy.args[0][0].detail.item).to.eql(combobox.items[0]);
    });

    it('should fire `selection-changed` in short touch gestures', function(done) {
      combobox.opened = true;

      var spy = sinon.spy();
      combobox.$.overlay.addEventListener('selection-changed', spy);

      MockTouchInteractions.touchstart(combobox.$.overlay.$.scroller);

      combobox.async(function() {
        var firstItem = Polymer.dom(combobox.$.overlay.$.selector).querySelector('vaadin-combo-box-item');
        dispatchTap(firstItem);

        expect(spy.calledOnce).to.be.true;
        done();
      }, 200);
    });

    it('should not fire `selection-changed` in long touch gestures', function(done) {
      combobox.opened = true;

      var spy = sinon.spy();
      combobox.$.overlay.addEventListener('selection-changed', spy);

      MockTouchInteractions.touchstart(combobox.$.overlay.$.scroller);

      combobox.async(function() {
        var firstItem = Polymer.dom(combobox.$.overlay.$.selector).querySelector('vaadin-combo-box-item');
        dispatchTap(firstItem);

        expect(spy.calledOnce).to.be.false;
        done();
      }, 350);
    });

    it('should not fire `selection-changed` after scrolling for grace period of 300ms', function(done) {
      // We need more items to increase scroller
      var items = [];
      for (var i = 1; i < 50; i++) items.push(i);
      combobox.items = items;

      var spy = sinon.spy();
      combobox.$.overlay.addEventListener('selection-changed', spy);

      // open the combo box, and move the scroll
      combobox.opened = true;

      function listener() {
        // Ensure the listener is invoked only once. Otherwise, `done()` might
        // be called multiple times, which produces error for the test.
        combobox.$.overlay.$.scroller.removeEventListener('scroll', listener);

        combobox.async(function() {
          var firstItem = Polymer.dom(combobox.$.overlay.$.selector).querySelector('vaadin-combo-box-item');
          dispatchTap(firstItem);

          expect(spy.calledOnce).to.be.false;
          done();
        }, 200);
      }

      // Scroll start could delay, for example, with full SD polyfill
      combobox.$.overlay.$.scroller.addEventListener('scroll', listener);

      combobox.$.overlay.$.selector.scrollToIndex(20);
    });

    it('should fire `selection-changed` after the scrolling grace period', function(done) {
      var items = [];
      for (var i = 1; i < 50; i++) items.push(i);
      combobox.items = items;

      var spy = sinon.spy();
      combobox.$.overlay.addEventListener('selection-changed', spy);

      combobox.opened = true;

      function listener() {
        // Ensure the listener is invoked only once. Otherwise, `done()` might
        // be called multiple times, which produces error for the test.
        combobox.$.overlay.$.scroller.removeEventListener('scroll', listener);

        combobox.async(function() {
          var firstItem = Polymer.dom(combobox.$.overlay.$.selector).querySelector('vaadin-combo-box-item');
          dispatchTap(firstItem);

          expect(spy.calledOnce).to.be.true;
          done();
        }, 500);
      }

      // Scroll start could delay, for example, with full SD polyfill
      combobox.$.overlay.$.scroller.addEventListener('scroll', listener);

      combobox.$.overlay.$.selector.scrollToIndex(20);
    });

    it('should select by using JS api', function() {
      combobox.value = 'foo';

      combobox.open();

      expect(combobox.selectedItem).to.equal('foo');
      expect(combobox.$.overlay._selectedItem).to.equal('foo');
      expect(input.bindValue).to.equal('foo');
    });

    it('should close the dropdown on selection', function() {
      combobox.open();

      combobox.$.overlay.$.selector.querySelector('vaadin-combo-box-item').click();

      expect(combobox.opened).to.equal(false);
    });

    it('should fire exactly one `value-changed` event', function() {
      combobox.value = 'foo';
      expect(valueChangedSpy.callCount).to.equal(1);
    });

    describe('`change` event', function() {
      it('should fire `value-changed` and `selected-item-changed` before `changed`', function(done) {
        combobox.addEventListener('change', function() {
          expect(valueChangedSpy.called).to.be.true;
          expect(selectedItemChangedSpy.called).to.be.true;
          done();
        });

        combobox.open();
        combobox.value = 'foo';
        combobox.close();
      });

      it('should fire exactly one `change` event', function() {
        var spy = sinon.spy();
        combobox.addEventListener('change', spy);

        combobox.open();
        combobox.value = 'foo';
        combobox.close();

        expect(spy.callCount).to.equal(1);
      });

      it('should fire on clear', function() {
        var spy = sinon.spy();
        combobox.addEventListener('change', spy);

        combobox.value = 'foo';
        combobox.$.clearIcon.click();

        expect(spy.callCount).to.equal(1);
      });

      it('should not fire until close', function() {
        var spy = sinon.spy();
        combobox.addEventListener('change', spy);

        combobox.value = 'foo';
        combobox.open();
        combobox.value = 'bar';

        expect(spy.callCount).to.equal(0);
      });

      it('should not fire on cancel', function() {
        var spy = sinon.spy();
        combobox.addEventListener('change', spy);

        combobox.open();
        combobox.value = 'foo';
        combobox.cancel();

        expect(spy.callCount).to.equal(0);
      });

      it('should not fire for changes when closed', function() {
        var spy = sinon.spy();
        combobox.addEventListener('change', spy);

        combobox.value = 'foo';

        combobox.open();
        combobox.close();

        expect(spy.callCount).to.equal(0);
      });

      it('should stop input `change` event from bubbling', function() {
        var spy = sinon.spy();
        combobox.addEventListener('change', spy);

        combobox.$.input.fire('change');

        expect(spy.callCount).to.equal(0);
      });
    });

    it('should close the dropdown when reselecting the current value', function() {
      combobox.value = 'foo';
      combobox.open();
      combobox.$.overlay.fire('selection-changed', {item: combobox.items[0]});
      expect(combobox.opened).to.be.false;
    });

    it('should not fire an event when reselecting the current value', function() {
      combobox.value = 'foo';
      valueChangedSpy.reset();
      combobox.$.overlay.fire('selection-changed', {item: combobox.items[0]});
      expect(valueChangedSpy.callCount).to.equal(0);
    });

    it('should not throw an error if value was undefined', function() {
      combobox.allowCustomValue = true;
      combobox.value = undefined;
      combobox.open();
      combobox.close();
    });
  });

  ['default', 'custom'].forEach(function(button) {

    describe('clearing a selection - ' + button + ' clear icon', function() {
      var combobox;
      var clearIcon;
      beforeEach(function() {
        combobox = fixture(button === 'default' ? 'combobox' : 'combobox-custom-clear');
        combobox.items = ['foo', 'bar'];

        combobox.value = 'foo';

        clearIcon = combobox._clearElement;
      });

      it('should show the clearing icon only when combobox has value', function() {
        expect(window.getComputedStyle(clearIcon).display).to.contain('block');
        combobox.value = '';
        expect(window.getComputedStyle(clearIcon).display).to.contain('none');
      });

      it('should not show clearing icon when nothing is selected', function() {
        combobox.open();

        combobox.value = '';

        expect(window.getComputedStyle(clearIcon).display).to.eql('none');
      });

      it('should clear the selection when tapping on the icon', function() {
        combobox.open();

        Polymer.Base.fire('tap', {}, {
          bubbles: true,
          node: clearIcon
        });

        expect(combobox.value).to.eql('');
        expect(combobox.$.overlay._selectedItem).to.be.null;
        expect(combobox.selectedItem).to.be.null;
      });

      it('should close the dropdown after clearing a selection', function() {
        combobox.open();

        Polymer.Base.fire('tap', {}, {
          bubbles: true,
          node: clearIcon
        });

        expect(combobox.opened).to.eql(false);
      });

      it('should cancel down event to avoid input blur', function() {
        combobox.open();

        var event = Polymer.Base.fire('down', {}, {
          bubbles: true,
          node: clearIcon,
          cancelable: true
        });

        expect(event.defaultPrevented).to.eql(true);
      });

    });

  });

  describe('selecting a custom value', function() {
    var combobox;
    beforeEach(function() {
      combobox = fixture('combobox');
      combobox.allowCustomValue = true;
      combobox.items = ['foo', 'bar', 'barbar'];

      combobox.open();
    });

    it('should select a value when closing when having a single exact match', function() {
      combobox.$.input.bindValue = 'barbar';
      combobox.$.input.fire('input');

      combobox.close();

      expect(combobox.value).to.eql('barbar');
    });

    it('should select a value when closing when having multiple matches', function() {
      combobox.$.input.bindValue = 'BAR';
      combobox.$.input.fire('input');

      combobox.close();

      expect(combobox.value).to.eql('bar');
    });

    it('should clear the selection when closing the overlay and input is cleared', function() {
      combobox.value = 'foo';

      combobox.$.input.bindValue = '';
      combobox.$.input.fire('input');

      combobox.close();

      expect(combobox.value).to.be.empty;
      expect(combobox.selectedItem).to.be.null;
      expect(combobox.hasValue).to.be.false;
    });

    it('should select a custom value', function() {
      combobox.value = 'foobar';

      combobox.close();

      expect(combobox.value).to.eql('foobar');
      expect(combobox.selectedItem).to.be.null;
      expect(combobox._inputElementValue).to.eql('foobar');
      expect(combobox.hasValue).to.be.true;
    });

    it('should clear the custom value on clear', function() {
      combobox.value = 'foobar';

      combobox.$.input.bindValue = '';
      combobox.$.input.fire('input');

      combobox.close();

      expect(combobox.value).to.be.empty;
      expect(combobox.selectedItem).to.be.null;
    });

    it('should allow changing value to existing item when custom value is set', function() {
      combobox.value = 'foobar';

      combobox.close();

      combobox.value = 'foo';
      expect(combobox.value).to.eql('foo');
      expect(combobox.selectedItem).to.eql('foo');
    });
  });

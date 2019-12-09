import * as Util from '../../src/core/Util';

describe('Util', () => {
  describe('extend', () => {
    let a = {"a": "a"};
    let b = {"b": "b"};
    let c = {"c": "c"};

    it('identity', () => {
      expect(Util.extend(a)).toStrictEqual({"a": "a"});
    });

    it('disjoint', () => {
      expect(Util.extend(a, b, c)).toStrictEqual({"a": "a", "b": "b", "c": "c"});
    });

    it('intersect', () => {
      expect(Util.extend(Util.extend(a, b), Util.extend(b, c))).toStrictEqual({"a": "a", "b": "b", "c": "c"});
    });

    it('mayhem', () => {
      expect(Util.extend(Util.extend(a, b, c), Util.extend(c, b, a), Util.extend(b, a, c))).toStrictEqual({"c": "c", "a": "a", "b": "b"});
    });
  });

  describe('create', () => {
    it('identity', () => {
      expect(Util.create).toBeDefined();
    });
  });

  describe('bind', () => {
    let fn = jest.fn();
    let obj = { a: 'a' };

    it('works', () => {
      expect(Util.bind(fn, obj)).toBeFunction();
    });
  });

  describe('lastId', () => {
    it('initialized', () => {
      expect(Util.lastId).toStrictEqual(0)
    });
  });

  describe('stamp', () => {
    it('works', () => {
      expect(Util.lastId).toStrictEqual(0);

      let a = {};
      expect(a._cozy_id).toBe(undefined);
      expect(Util.stamp(a)).toStrictEqual(1);
      expect(a._cozy_id).toStrictEqual(1);
      expect(Util.stamp(a)).toStrictEqual(1);
      expect(a._cozy_id).toStrictEqual(1);

      expect(Util.lastId).toStrictEqual(1);

      let b = {};
      expect(b._cozy_id).toBe(undefined);
      expect(Util.stamp(b)).toStrictEqual(2);
      expect(b._cozy_id).toStrictEqual(2);
      expect(Util.stamp(b)).toStrictEqual(2);
      expect(b._cozy_id).toStrictEqual(2);

      expect(Util.lastId).toStrictEqual(2);
    });
  });

  describe('throttle', () => {
    let fn = jest.fn();
    let time = 1;
    let context = { "a": "a" };

    it('works', () => {
      expect(Util.throttle(fn, time, context)).toBeFunction();
    });
  });

  describe('wrapNum', () => {
    let range = [0, 1];

    it('open', () => {
      expect(Util.wrapNum(1, range, false)).toStrictEqual(0);
    });

    it('closed', () => {
      expect(Util.wrapNum(1, range, true)).toStrictEqual(1);
    });
  });

  describe('falseFn', () => {
    it('false', () => {
      expect(Util.falseFn()).toBeFalse();
    });
  });

  describe('formatNum', () => {
    describe('positive', () => {
      let num = 0.55555555555555555555;

      it('five digits (default)', () => {
        expect(Util.formatNum(num)).toStrictEqual(0.55556);
      });

      it('three digits', () => {
        expect(Util.formatNum(num, 3)).toStrictEqual(0.556);
      });
    });

    describe('negative', () => {
      let num = -0.55555555555555555555;

      it('five digits (default)', () => {
        expect(Util.formatNum(num)).toStrictEqual(-0.55556);
      });

      it('three digits', () => {
        expect(Util.formatNum(num, 3)).toStrictEqual(-0.556);
      });
    });
  });

  describe('isNumeric', () => {
    describe('alpha', () => {
      let num = "alpha"

      it('isNaN', () => {
        expect(Util.isNumeric(num)).toBeFalse();
      });
    });

    describe('finite', () => {
      let num = 1;

      it('positive', () => {
        expect(Util.isNumeric(num)).toBeTrue();
      });

      it('negative', () => {
        expect(Util.isNumeric(-num)).toBeTrue();
      });
    });

    describe('float', () => {
      let num = 1.1;

      it('positive', () => {
        expect(Util.isNumeric(num)).toBeTrue();
      });

      it('negative', () => {
        expect(Util.isNumeric(-num)).toBeTrue();
      });
    });
  });

  describe('trim', () => {
    let sentence = " alpha   beta  ";

    it('ends', () => {
      expect(Util.trim(sentence)).toStrictEqual("alpha   beta");
    });
  });

  describe('splitWords', () => {
    let sentence = " alpha   beta  ";

    it('alpha beta', () => {
      expect(Util.splitWords(sentence)).toStrictEqual(["alpha", "beta"]);
    });
  });

  describe('setOptions', () => {
    let options = { b: "b", c: "c" };

    describe('has not', () => {
      let obj = { };

      it('create', () => {
        expect(Util.setOptions(obj, options)).toStrictEqual(options);
      });
    });

    describe('has', () => {
      let obj = { options: { a: "aa", b: "bb", c: "cc", d: "dd"} };

      it('override and merge', () => {
        expect(Util.setOptions(obj, options)).toStrictEqual({ a: "aa", b: "b", c: "c", d: "dd"});
      });
    });
  });

  describe('getParamString', () => {
    let obj = { a: "foo", B: "bar" };

    describe('new', () => {
      it('lowercase', () => {
        expect(Util.getParamString(obj)).toStrictEqual("?a=foo&b=bar");
      });
      it('uppercase', () => {
        expect(Util.getParamString(obj, "", true)).toStrictEqual("?A=foo&B=bar");
      });
    });

    describe('append', () => {
      let url = "lol?j=joker"

      it('lowercase', () => {
        expect(Util.getParamString(obj, url)).toStrictEqual("&a=foo&b=bar");
      });
      it('uppercase', () => {
        expect(Util.getParamString(obj, url, true)).toStrictEqual("&A=foo&B=bar");
      });
    });
  });

  describe('template', () => {
    let format = "Hello {a}, {b}";

    it('missing data', () => {
      let data = { a: "foo" };

      expect(() => { Util.template(format, data) }).toThrow("No value provided for variable {b}");
    });

    it('case sensitive', () => {
      let data = { A: "foo", b: () => { return "BAR"; } };

      expect(() => { Util.template(format, data) }).toThrow("No value provided for variable {a}");
    });

    it('works', () => {
      let data = { a: "foo", b: () => { return "BAR"; } };

      expect(Util.template(format, data)).toStrictEqual("Hello foo, BAR");
    });
  });

  describe('isArray', () => {
    it('array', () => {
      expect(Util.isArray([])).toBeTrue();
    });

    it('non-array', () => {
      expect(Util.isArray({})).toBeFalse();
    });
  });

  describe('indexOf', () => {
    let array = [0,1,"0", "1"];

    it('element', () => {
      expect(Util.indexOf(array, "0")).toStrictEqual(2);
    });

    it('non-element', () => {
      expect(Util.indexOf(array, 2)).toStrictEqual(-1);
    });
  });

  describe('emptyImageUrl', () => {
    it('exist', () => {
      expect(Util.emptyImageUrl).toStrictEqual("data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=")
    });
  });

  describe('requestFn', () => {
    it('exist', () => {
      expect(Util.requestFn).toBeDefined();
    });
  });

  describe('cancelFn', () => {
    it('exist', () => {
      expect(Util.cancelFn).toBeDefined();
    });
  });

  describe('requestAnimFrame', () => {
    const fn = jest.fn();
    let context = { context: "context" };
    let immediate = true;

    it('exist', () => {
      expect(Util.requestAnimFrame(fn, context, immediate)).toBeDefined();
    });
  });

  describe('cancelAnimFrame', () => {
    it('exist', () => {
      expect(Util.cancelAnimFrame('id')).toBeUndefined();
    });
  });

  describe('inVp', () => {
    let box = {};
    let elem = { getBoundingClientRect: jest.fn().mockReturnValueOnce(box) };
    let threshold = {};
    let container = null;

    it('exist', () => {
      expect(Util.inVp(elem, threshold, container)).toBeDefined();
    });
  });

  describe('loader', () => {
    let url = "url";

    it('exist', () => {
      expect(Util.loader["js"](url)).toBeDefined();
    });
  });
});

import { Class } from "../../src/core/Class";

describe('Class', () => {
  it('exist', () => {
    expect(Class).toBeFunction();
  });

  describe('extend', () => {
    it('exist', () => {
      expect(Class.extend).toBeFunction();
    });
  });

  describe('include', () => {
    it('exist', () => {
      expect(Class.include).toBeFunction();
    });
  });

  describe('mergeOptions', () => {
    it('exist', () => {
      expect(Class.mergeOptions).toBeFunction();
    });
  });

  describe('addInitHook', () => {
    it('exist', () => {
      expect(Class.addInitHook()).toBeFunction();
    });
  });
});

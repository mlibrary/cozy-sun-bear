import { Modal } from "../../src/control/Modal";

describe('Modal', () => {
  it('true', () => {
    expect(true).toBeTrue();
  });

  it('window', () => {
    expect(window).toBeDefined();
  });

  it('exist', () => {
    expect(new Modal).toBeDefined();
  });
});

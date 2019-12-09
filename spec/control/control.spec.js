import { Control, control } from "../../src/control/Control";

// jest.mock("../../src/control/Control");
// jest.mock("../../src/control/Modal");

describe('Control', () => {
  it('Control', () => {
    expect(Control).toBeDefined();
  });

  it('control', () => {
    expect(control).toBeDefined();
  });
});

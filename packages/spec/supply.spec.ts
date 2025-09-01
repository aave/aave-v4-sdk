import { describe, it } from "vitest";

describe("Aave Market Supply Scenarios", () => {
  describe("GIVEN a user and a Reserve", () => {
    describe("WHEN the user supplies tokens", () => {
      describe("THEN the user's supply positions are updated", () => {
        it.todo("AND the supplied tokens are set as collateral by default");
      });
    });

    describe("WHEN the user supplies tokens with collateral disabled", () => {
      it.todo("THEN the user's supply positions are updated without collateral");
    });

    describe("WHEN the user supplies tokens on behalf of another address", () => {
      it.todo("THEN the other address's supply positions are updated");
    });

    describe("WHEN the user supplies tokens using a permit signature", () => {
      it.todo("THEN the supply succeeds without requiring ERC20 approval");
    });

    describe("WHEN the user supplies tokens on behalf of another address using a permit signature", () => {
      describe("THEN the supply succeeds without requiring ERC20 approval", () => {
        it.todo("AND the other user's supply positions are updated");
      });
    });

    describe("WHEN the Reserve allows supplying native tokens", () => {
      describe("AND the user supplies native tokens", () => {
        describe("THEN the user's supply positions are updated", () => {
          it.todo("AND should appear in the user's supply positions");
        });
      });
    });
  });
});

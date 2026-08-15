// @vitest-environment jsdom

import { act } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LocationHashContextProvider, useLocationHash } from ".";

const LocationHashProbe = () => {
  const { hash } = useLocationHash();
  return <output data-testid="hash">{hash}</output>;
};

const renderLocationHash = () =>
  render(
    <LocationHashContextProvider>
      <LocationHashProbe />
    </LocationHashContextProvider>,
  );

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

describe("LocationHashContextProvider", () => {
  it("reads the initial location hash", () => {
    window.history.replaceState(null, "", "/#category-a");

    renderLocationHash();

    expect(screen.getByTestId("hash").textContent).toBe("category-a");
  });

  it("updates the hash when the location hash changes", () => {
    renderLocationHash();

    act(() => {
      window.history.pushState(null, "", "/#category-b");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(screen.getByTestId("hash").textContent).toBe("category-b");
  });
});

import { describe, test, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PortaVirtus from "../src/PortaVirtus";

const H_KEY = "porta_virtus_history";
const T_KEY = "porta_virtus_tasks";
const U_KEY = "porta_virtus_user";

beforeEach(() => {
  localStorage.clear();
});

describe("PortaVirtus", () => {
  test("renders the loader on first paint without throwing", () => {
    render(<PortaVirtus />);
    expect(screen.getByText("PORTA VIRTUS")).toBeInTheDocument();
  });

  test("shows the name modal after async load when no user is stored", async () => {
    render(<PortaVirtus />);
    await waitFor(() => {
      expect(screen.getByText("¿Cómo quieres que te llame?")).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("Tu nombre")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  test("renders the main dashboard when user is pre-populated in localStorage", async () => {
    localStorage.setItem(U_KEY, JSON.stringify({ name: "Marco" }));
    localStorage.setItem(H_KEY, JSON.stringify({}));
    localStorage.setItem(T_KEY, JSON.stringify([]));

    render(<PortaVirtus />);

    await waitFor(() => {
      expect(screen.getByText("Marco")).toBeInTheDocument();
    });
    expect(screen.getByText("Tracker de desarrollo personal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hoy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Semana" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Insignias" })).toBeInTheDocument();
  });
});

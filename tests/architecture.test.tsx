import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Architecture } from "@/features/architecture/architecture";

it("distinguishes implemented prototype from proposed infrastructure", () => {
  render(<Architecture />);
  expect(screen.getByText("Implemented prototype")).toBeInTheDocument();
  expect(screen.getByText("Proposed production architecture")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Video infrastructure/ }));
  expect(screen.getByText(/Daily, Agora or Twilio/)).toBeInTheDocument();
  expect(screen.getByText(/No real camera or microphone access/)).toBeInTheDocument();
});

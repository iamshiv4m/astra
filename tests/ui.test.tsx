import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState, Field, Modal } from "@/components/ui";
import { AvailabilityCalendar } from "@/components/calendar";

describe("shared interface primitives", () => {
  it("offers a useful recovery action in empty states", () => {
    render(<EmptyState title="No consultations yet" description="Find someone to talk to." href="/astrologers" label="Explore astrologers" />);
    expect(screen.getByRole("link", { name: "Explore astrologers" })).toHaveAttribute("href", "/astrologers");
  });
  it("associates the field label with its control", () => {
    render(<Field label="Your name"><input id="name" /></Field>);
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
  });
  it("exposes an accessible dialog and close action", () => {
    const close = vi.fn();
    render(<Modal open onOpenChange={close} title="Your birth details"><p>Optional information</p></Modal>);
    expect(screen.getByRole("dialog", { name: "Your birth details" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(close).toHaveBeenCalledWith(false);
  });
  it("selects an available calendar date and disables past days", () => {
    const select = vi.fn();
    render(<AvailabilityCalendar value="2026-09-19" minDate="2026-09-19" onChange={select} />);
    fireEvent.click(screen.getByRole("button", { name: /20 September 2026/ }));
    expect(select).toHaveBeenCalledWith("2026-09-20");
    expect(screen.getByRole("button", { name: /18 September 2026/ })).toBeDisabled();
  });
  it("returns keyboard focus to the control that opened a dialog", async () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Open settings</button><Modal open={open} onOpenChange={setOpen} title="Settings"><p>Demo settings</p></Modal></>;
    }
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Open settings" });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PollForm } from "../components/PollForm";

// Mock the createPoll function
jest.mock("@/lib/mock-actions", () => ({
  createPoll: jest.fn(),
}));

describe("PollForm", () => {
  it("renders the form fields correctly", () => {
    render(<PollForm />);
    expect(
      screen.getByPlaceholderText("What's your poll about?"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Add more context about your poll..."),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Option 1")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Option 2")).toBeInTheDocument();
  });

  it("shows error messages when typing invalid input", async () => {
    render(<PollForm />);

    // Type invalid input to trigger validation
    const titleInput = screen.getByPlaceholderText("What's your poll about?");
    fireEvent.change(titleInput, { target: { value: "ab" } }); // Less than 3 characters

    // Check that error message appears
    expect(
      await screen.findByText("Title must be at least 3 characters"),
    ).toBeInTheDocument();
  });

  it("enables submit button when form is valid", async () => {
    render(<PollForm />);

    // Submit button should always be enabled now
    const submitButton = screen.getByRole("button", { name: /create poll/i });
    expect(submitButton).not.toBeDisabled();

    // Fill in valid form data
    fireEvent.change(screen.getByPlaceholderText("What's your poll about?"), {
      target: { value: "What's your favorite framework?" },
    });
    fireEvent.change(screen.getByPlaceholderText("Option 1"), {
      target: { value: "Next.js" },
    });
    fireEvent.change(screen.getByPlaceholderText("Option 2"), {
      target: { value: "React" },
    });

    // Submit button should still be enabled
    expect(submitButton).not.toBeDisabled();

    // Since current logic only logs to console, we check that no validation errors appear
    expect(
      screen.queryByText("Title must be at least 3 characters"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("At least 2 options are required"),
    ).not.toBeInTheDocument();
  });
});

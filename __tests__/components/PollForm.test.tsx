import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PollForm } from "@/components/PollForm";
import { createPoll } from "@/lib/mock-actions";

// Mock the createPoll function
jest.mock("@/lib/mock-actions", () => ({
  createPoll: jest.fn(),
}));

const mockCreatePoll = createPoll as jest.MockedFunction<typeof createPoll>;

describe("PollForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the form with all required fields", () => {
    render(<PollForm />);

    expect(screen.getByLabelText(/poll title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByText(/poll options/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create poll/i }),
    ).toBeInTheDocument();
  });

  it("shows validation errors for empty required fields", async () => {
    const user = userEvent.setup();
    render(<PollForm />);

    const submitButton = screen.getByRole("button", { name: /create poll/i });
    
    // Debug: Check if the form has any validation errors before clicking
    console.log("Form errors before submit:", screen.queryByText(/question is required/i));
    
    await user.click(submitButton);

    // Wait a bit longer for validation to trigger
    await waitFor(() => {
      expect(screen.getByText(/question is required/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("validates title length", async () => {
    const user = userEvent.setup();
    render(<PollForm />);

    const titleInput = screen.getByLabelText(/poll title/i);
    await user.type(titleInput, "ab");

    await waitFor(() => {
      expect(
        screen.getByText(/title must be at least 3 characters/i),
      ).toBeInTheDocument();
    });
  });

  it("validates title maximum length", async () => {
    const user = userEvent.setup();
    render(<PollForm />);

    const titleInput = screen.getByLabelText(/poll title/i);
    const longTitle = "a".repeat(201);
    await user.type(titleInput, longTitle);

    await waitFor(() => {
      expect(
        screen.getByText(/title must be less than 200 characters/i),
      ).toBeInTheDocument();
    });
  });

  it("allows adding and removing options", async () => {
    const user = userEvent.setup();
    render(<PollForm />);

    // Initially should have 2 options
    expect(screen.getAllByPlaceholderText(/option \d+/i)).toHaveLength(2);

    // Add a new option
    const addButton = screen.getByRole("button", { name: /add option/i });
    await user.click(addButton);

    expect(screen.getAllByPlaceholderText(/option \d+/i)).toHaveLength(3);

    // Remove an option (should be possible when more than 2)
    const removeButtons = screen.getAllByLabelText(/remove option/i);
    await user.click(removeButtons[0]);

    expect(screen.getAllByPlaceholderText(/option \d+/i)).toHaveLength(2);
  });

  it("validates duplicate options", async () => {
    const user = userEvent.setup();
    render(<PollForm />);

    const optionInputs = screen.getAllByPlaceholderText(/option \d+/i);

    // Type the same text in both options
    await user.type(optionInputs[0], "Same Option");
    await user.type(optionInputs[1], "Same Option");

    await waitFor(() => {
      expect(screen.getByText(/options must be unique/i)).toBeInTheDocument();
    });
  });

  it("shows character count for title", async () => {
    const user = userEvent.setup();
    render(<PollForm />);

    const titleInput = screen.getByLabelText(/poll title/i);
    await user.click(titleInput);
    await user.type(titleInput, "Test Title");

    expect(screen.getByText("10/200")).toBeInTheDocument();
  });

  it("shows character count for description", async () => {
    const user = userEvent.setup();
    render(<PollForm />);

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.click(descriptionInput);
    await user.type(descriptionInput, "Test Description");

    expect(screen.getByText("16/500")).toBeInTheDocument();
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    mockCreatePoll.mockResolvedValueOnce({
      success: true,
      pollId: "123",
      message: "Poll created successfully!",
    });

    render(<PollForm />);

    // Fill in the form
    await user.type(screen.getByLabelText(/poll title/i), "Test Poll");
    await user.type(screen.getByLabelText(/description/i), "Test Description");

    const optionInputs = screen.getAllByPlaceholderText(/option \d+/i);
    await user.type(optionInputs[0], "Option 1");
    await user.type(optionInputs[1], "Option 2");

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /create poll/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledWith(
        expect.any(FormData)
      );
    });
  });

  it("shows success message after successful submission", async () => {
    const user = userEvent.setup();
    mockCreatePoll.mockResolvedValueOnce({
      success: true,
      pollId: "123",
      message: "Poll created successfully!",
    });

    render(<PollForm />);

    // Fill in the form
    await user.type(screen.getByLabelText(/poll title/i), "Test Poll");
    await user.type(screen.getByLabelText(/description/i), "Test Description");

    const optionInputs = screen.getAllByPlaceholderText(/option \d+/i);
    await user.type(optionInputs[0], "Option 1");
    await user.type(optionInputs[1], "Option 2");

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /create poll/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Poll created successfully!"),
      ).toBeInTheDocument();
    });
  });

  it("shows error message on submission failure", async () => {
    const user = userEvent.setup();
    mockCreatePoll.mockResolvedValueOnce({
      success: false,
      message: "Failed to create poll",
    });

    render(<PollForm />);

    // Fill in the form
    await user.type(screen.getByLabelText(/poll title/i), "Test Poll");
    await user.type(screen.getByLabelText(/description/i), "Test Description");

    const optionInputs = screen.getAllByPlaceholderText(/option \d+/i);
    await user.type(optionInputs[0], "Option 1");
    await user.type(optionInputs[1], "Option 2");

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /create poll/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to create poll")).toBeInTheDocument();
    });
  });

  it("disables submit button when form is invalid", async () => {
    render(<PollForm />);

    const submitButton = screen.getByRole("button", { name: /create poll/i });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when form is valid", async () => {
    const user = userEvent.setup();
    render(<PollForm />);

    // Fill in the form with valid data
    await user.type(screen.getByLabelText(/poll title/i), "Test Poll");
    await user.type(screen.getByLabelText(/description/i), "Test Description");

    const optionInputs = screen.getAllByPlaceholderText(/option \d+/i);
    await user.type(optionInputs[0], "Option 1");
    await user.type(optionInputs[1], "Option 2");

    const submitButton = screen.getByRole("button", { name: /create poll/i });
    expect(submitButton).toBeEnabled();
  });
});

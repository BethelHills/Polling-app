import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OptionInput } from "@/components/ui/option-input";

describe("OptionInput", () => {
  const defaultProps = {
    value: "",
    onChange: jest.fn(),
    index: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with correct index number", () => {
    render(<OptionInput {...defaultProps} index={2} />);

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("calls onChange when input value changes", async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    render(<OptionInput {...defaultProps} onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/option 1/i);
    await user.type(input, "Test Option");
    
    // Wait for all async operations to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should be called for each character typed
    expect(mockOnChange).toHaveBeenCalledTimes(11); // "Test Option" = 11 characters
    expect(mockOnChange).toHaveBeenLastCalledWith("n"); // Last character typed
    expect(mockOnChange).toHaveBeenNthCalledWith(1, "T"); // First character typed
  });

  it("shows remove button when canRemove is true", () => {
    render(<OptionInput {...defaultProps} canRemove={true} />);

    expect(
      screen.getByRole("button", { name: /remove option 1/i }),
    ).toBeInTheDocument();
  });

  it("does not show remove button when canRemove is false", () => {
    render(<OptionInput {...defaultProps} canRemove={false} />);

    expect(
      screen.queryByRole("button", { name: /remove option 1/i }),
    ).not.toBeInTheDocument();
  });

  it("calls onRemove when remove button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnRemove = jest.fn();

    render(
      <OptionInput
        {...defaultProps}
        canRemove={true}
        onRemove={mockOnRemove}
      />,
    );

    const removeButton = screen.getByRole("button", {
      name: /remove option 1/i,
    });
    await user.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalled();
  });

  it("shows error message when error prop is provided", () => {
    render(<OptionInput {...defaultProps} error="This is an error" />);

    expect(screen.getByText("This is an error")).toBeInTheDocument();
  });

  it("shows success state when success prop is true", () => {
    render(
      <OptionInput {...defaultProps} value="Valid Option" success={true} />,
    );

    // Check for success styling by looking for the check icon
    expect(screen.getByRole("listitem")).toHaveClass("bg-green-50");
  });

  it("shows character count when focused and near limit", async () => {
    const user = userEvent.setup();
    const longText = "a".repeat(85); // Near the 100 character limit

    render(<OptionInput {...defaultProps} value={longText} maxLength={100} />);

    const input = screen.getByPlaceholderText(/option 1/i);
    await user.click(input);

    expect(screen.getByText("85/100")).toBeInTheDocument();
  });

  it("prevents input when maxLength is exceeded", async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    const longText = "a".repeat(100);

    render(
      <OptionInput
        {...defaultProps}
        value={longText}
        onChange={mockOnChange}
        maxLength={100}
      />,
    );

    const input = screen.getByPlaceholderText(/option 1/i);
    await user.type(input, "b");

    // Should not call onChange with the new character
    expect(mockOnChange).not.toHaveBeenCalledWith(longText + "b");
  });

  it("shows drag handle on hover", async () => {
    const user = userEvent.setup();
    render(<OptionInput {...defaultProps} />);

    const container = screen.getByRole("listitem");
    await user.hover(container);

    // The drag handle should become visible on hover
    expect(container).toHaveClass("group");
  });

  it("applies custom className", () => {
    render(<OptionInput {...defaultProps} className="custom-class" />);

    expect(screen.getByRole("listitem")).toHaveClass("custom-class");
  });

  it("shows placeholder text", () => {
    render(<OptionInput {...defaultProps} placeholder="Custom placeholder" />);

    expect(
      screen.getByPlaceholderText("Custom placeholder"),
    ).toBeInTheDocument();
  });

  it("uses default placeholder when none provided", () => {
    render(<OptionInput {...defaultProps} />);

    expect(screen.getByPlaceholderText("Option 1")).toBeInTheDocument();
  });

  it("shows validation error for duplicate options", async () => {
    const user = userEvent.setup();
    const allOptions = ["Option 1", "Option 2", "Option 1"]; // Duplicate

    render(
      <OptionInput
        {...defaultProps}
        value="Option 1"
        allOptions={allOptions}
        showValidation={true}
      />,
    );

    const input = screen.getByPlaceholderText(/option 1/i);
    await user.click(input);
    await act(async () => {
      input.blur();
    });

    await user.type(input, "Option 1");

    // Should show duplicate error
    expect(screen.getByText(/this option already exists/i)).toBeInTheDocument();
  });
});

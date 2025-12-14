// __tests__/MultiStepAdmissionForm.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { act } from "react-dom/test-utils";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import MultiStepAdmissionForm from "@/app/admission/components/steps/MultiStepAdmissionForm.tsx";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("MultiStepAdmissionForm Step 0 → Step 1", () => {
  beforeEach(() => {
    // Reset store before each test
    useAdmissionStore.setState({
      formData: {
        surname: "",
        firstName: "",
        email: "",
        password: "",
        progress: 0,
      },
      loading: false,
      errors: {},
      userCreated: false,
      completeStep: useAdmissionStore.getState().completeStep,
      setField: useAdmissionStore.getState().setField,
    });
    jest.clearAllMocks();
  });

  it("creates user and advances to Step 1 if user does not exist", async () => {
    // Mock POST response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        admission: { id: "app123", studentId: "stu123" },
      },
    });

    render(<MultiStepAdmissionForm />);

    // Fill Step 0 fields
    act(() => {
      useAdmissionStore.getState().setField("surname", "Doe");
      useAdmissionStore.getState().setField("firstName", "John");
      useAdmissionStore.getState().setField("email", "john@example.com");
      useAdmissionStore.getState().setField("password", "secret123");
    });

    const nextButton = screen.getByRole("button", { name: /next/i });

    // Click Next
    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Wait for Step 1 component to render (StepPersonalInfo)
    await waitFor(() => {
      expect(screen.getByLabelText(/Date of Birth/i)).toBeInTheDocument();
    });

    // Ensure axios POST was called
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/api/admissions",
      expect.objectContaining({ surname: "Doe", firstName: "John" }),
      expect.any(Object)
    );

    // Store should have userCreated = true
    expect(useAdmissionStore.getState().userCreated).toBe(true);
  });

  it("updates existing user and advances to Step 1 if userCreated = true", async () => {
    // Setup store as if user already exists
    useAdmissionStore.setState({
      userCreated: true,
      formData: { applicationId: "app123" },
    });

    mockedAxios.put.mockResolvedValueOnce({ data: {} });

    render(<MultiStepAdmissionForm />);

    const nextButton = screen.getByRole("button", { name: /next/i });

    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Ensure axios PUT/update was called
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "/api/admissions/app123",
      expect.any(Object),
      expect.any(Object)
    );

    // Step 1 should render
    await waitFor(() => {
      expect(screen.getByLabelText(/Date of Birth/i)).toBeInTheDocument();
    });
  });
});

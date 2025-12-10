// app/admissions/components/FormInput.tsx
import React from "react";
import { UseFormRegister, FieldErrors, Path } from "react-hook-form";
import { z } from "zod";
import { admissionFormSchema } from "../../stores/useAdmissionStore";

type FormData = z.infer<typeof admissionFormSchema> & { [key: string]: any };

interface FormInputProps {
  label: string;
  name: Path<FormData>;
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  type?: string;
  options?: { value: string; label: string }[];
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  register,
  errors,
  type = "text",
  options,
}) => {
  const error = errors[name];

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      {type === "select" && options ? (
        <select
          id={name}
          {...register(name)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={name}
          {...register(name)}
          rows={3}
          className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
            error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          }`}
        />
      ) : type === "checkbox" ? (
        <div className="flex items-center">
          <input
            id={name}
            type="checkbox"
            {...register(name)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
            {label}
          </label>
        </div>
      ) : (
        <input
          id={name}
          type={type}
          {...register(name)}
          className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
            error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          }`}
        />
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error.message}</p>}
    </div>
  );
};

export default FormInput;

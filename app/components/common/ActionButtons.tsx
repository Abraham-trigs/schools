"use client";

import React from "react";

interface ActionButtonsProps {
  onEdit: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
}

export default function ActionButtons({
  onEdit,
  onDelete,
  canDelete = true,
}: ActionButtonsProps) {
  return (
    <div className="flex space-x-2">
      <button
        onClick={onEdit}
        className="px-3 py-1 bg-accentTeal text-background rounded hover:bg-accentPurple transition-colors"
      >
        Edit
      </button>
      {canDelete && onDelete && (
        <button
          onClick={onDelete}
          className="px-3 py-1 bg-error text-background rounded hover:bg-errorPink transition-colors"
        >
          Delete
        </button>
      )}
    </div>
  );
}

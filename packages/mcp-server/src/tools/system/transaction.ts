import { ToolDefinition } from "../../registry.js";

const transactionTools: ToolDefinition[] = [
  {
    name: "begin_transaction",
    description:
      "Start a new transaction to group multiple operations. Nested transactions are not supported.",
    category: "transaction",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        label: {
          type: "string",
          description: "A descriptive label for the transaction.",
        },
      },
      required: ["label"],
    },
  },
  {
    name: "commit_transaction",
    description:
      "End the current transaction successfully. If auto-save is enabled, this also creates a project save.",
    category: "transaction",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "rollback_transaction",
    description:
      "Rollback the current transaction, discarding all tracked operations in the group.",
    category: "transaction",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

export default transactionTools;

export const ISSUE_STATUSES = [
  {
    value: "todo",
    label: "To Do",
    pillClass: "bg-blue-50 text-[#003870]",
    selectClass: "border-blue-100 bg-blue-50 text-[#003870]",
  },
  {
    value: "done",
    label: "Done",
    pillClass: "bg-emerald-50 text-emerald-700",
    selectClass: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
];

export const normalizeIssueStatus = (status) => {
  if (status === "done") return "done";
  return "todo";
};

export const getIssueStatusOption = (status) => (
  ISSUE_STATUSES.find((option) => option.value === normalizeIssueStatus(status))
  || ISSUE_STATUSES[0]
);

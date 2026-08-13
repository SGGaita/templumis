export const DOCS_NAV = [
  {
    href: "/documentation",
    label: "Overview",
    exact: true,
  },
  {
    href: "/documentation/user-guide",
    label: "User guide",
    children: [
      { href: "/documentation/user-guide#getting-started", label: "Getting started" },
      { href: "/documentation/user-guide#students", label: "Students" },
      { href: "/documentation/user-guide#scholarships", label: "Scholarships" },
      { href: "/documentation/user-guide#grants", label: "Grants" },
      { href: "/documentation/user-guide#staff", label: "Staff" },
      { href: "/documentation/user-guide#reviewers", label: "Reviewers & sponsors" },
      { href: "/documentation/user-guide#admins", label: "Administrators" },
    ],
  },
  {
    href: "/documentation/technical",
    label: "Technical documentation",
    children: [
      { href: "/documentation/technical#architecture", label: "Architecture" },
      { href: "/documentation/technical#identity", label: "Identity & tenancy" },
      { href: "/documentation/technical#metadata-schema", label: "Metadata schema" },
      { href: "/documentation/technical#json-schemas", label: "JSON schemas" },
      { href: "/documentation/technical#pipelines", label: "Operational pipelines" },
    ],
  },
  {
    href: "/documentation/api",
    label: "API documentation",
    children: [
      { href: "/documentation/api#conventions", label: "Conventions" },
      { href: "/documentation/api#auth", label: "Authentication" },
      { href: "/documentation/api#endpoints", label: "Endpoints" },
    ],
  },
];

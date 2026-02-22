// Fake Canvas Data — replace with real API later
const fakeAssignments = [
  {
    id: 1,
    name: "Math Homework 5",
    course: "MATH 101",
    description:
      "Complete 18 calculus problems on derivatives and related rates. Show full work and upload handwritten solutions as a single PDF.",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 3), // 3 hours from now
    submitted: false,
    weight: 10,
  },
  {
    id: 2,
    name: "History Essay",
    course: "HIST 202",
    description:
      "Write a 4-page essay comparing two primary sources from the Civil War era with citations in Chicago style.",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 26), // 26 hours from now
    submitted: false,
    weight: 25,
  },
  {
    id: 3,
    name: "CS Project Phase 1",
    course: "CS 301",
    description:
      "Build the first milestone of a web app with login, database schema, and API routes. Submit repo link plus architecture notes.",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 72), // 3 days from now
    submitted: false,
    weight: 30,
  },
  {
    id: 4,
    name: "Biology Lab Report",
    course: "BIO 110",
    description:
      "Formal lab report with hypothesis, methods, data table, graph, and conclusion for enzyme activity experiment. Include error analysis.",
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours AGO (overdue)
    submitted: false,
    weight: 15,
  },
  {
    id: 5,
    name: "English Reading Quiz",
    course: "ENG 105",
    description:
      "10-question quiz on assigned reading chapters covering symbolism, tone, and author argument.",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 120), // 5 days from now
    submitted: true,
    weight: 5,
  },
];

// Fake Canvas Data — replace with real API later
const fakeAssignments = [
  {
    id: 1,
    name: "Math Homework 5",
    course: "MATH 101",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 3), // 3 hours from now
    submitted: false,
    weight: 10,
  },
  {
    id: 2,
    name: "History Essay",
    course: "HIST 202",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 26), // 26 hours from now
    submitted: false,
    weight: 25,
  },
  {
    id: 3,
    name: "CS Project Phase 1",
    course: "CS 301",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 72), // 3 days from now
    submitted: false,
    weight: 30,
  },
  {
    id: 4,
    name: "Biology Lab Report",
    course: "BIO 110",
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours AGO (overdue)
    submitted: false,
    weight: 15,
  },
  {
    id: 5,
    name: "English Reading Quiz",
    course: "ENG 105",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 120), // 5 days from now
    submitted: true,
    weight: 5,
  },
];

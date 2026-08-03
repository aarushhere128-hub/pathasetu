// Placeholder curriculum data only — CBSE Class 10.
// Replace with real Firestore-backed curriculum once that data model is built.
// Chapter names for Hindi A/B are generic placeholders; swap in real chapter
// titles when building the actual curriculum content.

export const DUMMY_CURRICULUM = {
  subjects: [
    {
      id: "science",
      name: "Science",
      chapters: ["Light", "Human Eye", "Electricity", "Carbon and its Compounds", "Life Processes"]
    },
    {
      id: "maths",
      name: "Maths",
      chapters: ["Real Numbers", "Polynomials", "Triangles", "Circles", "Probability"]
    },
    {
      id: "english",
      name: "English",
      chapters: ["A Letter to God", "Nelson Mandela", "Two Stories about Flying"]
    },
    {
      id: "hindi-a",
      name: "Hindi (Course A)",
      chapters: ["Chapter 1", "Chapter 2", "Chapter 3"]
    },
    {
      id: "hindi-b",
      name: "Hindi (Course B)",
      chapters: ["Chapter 1", "Chapter 2", "Chapter 3"]
    },
    {
      id: "social-science",
      name: "Social Science",
      chapters: ["Nationalism in Europe", "Federalism", "Resources and Development"]
    },
    {
      id: "ai",
      name: "Artificial Intelligence",
      chapters: ["Introduction to AI", "AI Ethics", "Data Literacy"]
    }
  ]
};

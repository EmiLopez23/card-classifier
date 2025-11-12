export const analyzeCard = async (file: File) => {
  const response = await fetch("/api/analyze-card", {
    method: "POST",
    body: file,
  });
  return response.json();
};
